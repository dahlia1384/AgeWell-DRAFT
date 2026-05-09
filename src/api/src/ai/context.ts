import { db } from '../db/client';

interface ResidentRow {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  room_number: string;
  admission_date: string;
  diagnoses: string;
  medications: string;
  allergies: string;
  preferences: string;
  language: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
}

export function buildResidentContext(residentId: number): string {
  const row = db.prepare('SELECT * FROM residents WHERE id = ? AND active = 1').get(residentId) as ResidentRow | undefined;
  if (!row) throw new Error(`Resident ${residentId} not found`);

  const diagnoses: string[] = JSON.parse(row.diagnoses || '[]');
  const medications: Array<{ name: string; dose: string; frequency: string }> = JSON.parse(row.medications || '[]');
  const allergies: string[] = JSON.parse(row.allergies || '[]');
  const prefs: Record<string, unknown> = JSON.parse(row.preferences || '{}');

  const age = Math.floor((Date.now() - new Date(row.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const sleeps = db.prepare(
    'SELECT log_date, hours, quality, notes FROM sleep_logs WHERE resident_id = ? AND log_date >= ? ORDER BY log_date DESC'
  ).all(residentId, cutoffStr) as Array<{ log_date: string; hours: number; quality: number; notes: string }>;

  const meals = db.prepare(
    'SELECT log_date, meal_type, intake_pct, notes FROM meal_logs WHERE resident_id = ? AND log_date >= ? ORDER BY log_date DESC, created_at DESC'
  ).all(residentId, cutoffStr) as Array<{ log_date: string; meal_type: string; intake_pct: number; notes: string }>;

  const moods = db.prepare(
    'SELECT log_date, mood, notes FROM mood_checkins WHERE resident_id = ? AND log_date >= ? ORDER BY log_date DESC'
  ).all(residentId, cutoffStr) as Array<{ log_date: string; mood: number; notes: string }>;

  const medRecords = db.prepare(
    'SELECT medication_name, dose, given, refusal_reason, administered_at FROM medication_records WHERE resident_id = ? AND date(administered_at) >= ? ORDER BY administered_at DESC'
  ).all(residentId, cutoffStr) as Array<{ medication_name: string; dose: string; given: number; refusal_reason: string; administered_at: string }>;

  const activities = db.prepare(
    'SELECT log_date, activity_name, participation_level, notes FROM activity_logs WHERE resident_id = ? AND log_date >= ? ORDER BY log_date DESC'
  ).all(residentId, cutoffStr) as Array<{ log_date: string; activity_name: string; participation_level: string; notes: string }>;

  const incidents = db.prepare(
    'SELECT incident_type, severity, description, occurred_at FROM incidents WHERE resident_id = ? AND date(occurred_at) >= ? ORDER BY occurred_at DESC'
  ).all(residentId, cutoffStr) as Array<{ incident_type: string; severity: string; description: string; occurred_at: string }>;

  const activeAlerts = db.prepare(
    "SELECT category, message, severity, created_at FROM alerts WHERE resident_id = ? AND status = 'open' ORDER BY created_at DESC"
  ).all(residentId) as Array<{ category: string; message: string; severity: string; created_at: string }>;

  const lines: string[] = [];

  lines.push('RESIDENT PROFILE');
  lines.push(`Name: ${row.first_name} ${row.last_name}`);
  lines.push(`Age: ${age} (DOB: ${row.date_of_birth})`);
  lines.push(`Room: ${row.room_number} | Admitted: ${row.admission_date}`);
  lines.push(`Language: ${row.language}`);
  lines.push('');
  lines.push(`DIAGNOSES: ${diagnoses.join(', ') || 'None recorded'}`);
  lines.push(`ALLERGIES: ${allergies.join(', ') || 'None known'}`);
  lines.push('');
  lines.push('STANDING MEDICATIONS:');
  if (medications.length > 0) {
    medications.forEach(m => lines.push(`  - ${m.name} ${m.dose} ${m.frequency}`));
  } else {
    lines.push('  None');
  }

  const preferred = (prefs.preferred_activities as string[] | undefined) ?? [];
  const dietary = (prefs.dietary_restrictions as string[] | undefined) ?? [];
  if (preferred.length || dietary.length) {
    lines.push('');
    lines.push('PREFERENCES:');
    if (preferred.length) lines.push(`  Activities: ${preferred.join(', ')}`);
    if (dietary.length) lines.push(`  Dietary: ${dietary.join(', ')}`);
  }

  if (row.emergency_contact_name) {
    lines.push('');
    lines.push(`EMERGENCY CONTACT: ${row.emergency_contact_name} (${row.emergency_contact_relation}) — ${row.emergency_contact_phone}`);
  }

  lines.push('');
  lines.push('--- 7-DAY CARE LOG HISTORY ---');

  if (activeAlerts.length > 0) {
    lines.push('');
    lines.push('ACTIVE ALERTS:');
    activeAlerts.forEach(a => lines.push(`  [${a.severity.toUpperCase()}] ${a.category}: ${a.message}`));
  }

  if (sleeps.length > 0) {
    lines.push('');
    lines.push('SLEEP:');
    sleeps.forEach(s =>
      lines.push(`  ${s.log_date}: ${s.hours}h, quality ${s.quality}/5${s.notes ? ` — ${s.notes}` : ''}`)
    );
  }

  if (meals.length > 0) {
    lines.push('');
    lines.push('MEALS:');
    meals.forEach(m =>
      lines.push(`  ${m.log_date} ${m.meal_type}: ${m.intake_pct ?? '?'}% intake${m.notes ? ` — ${m.notes}` : ''}`)
    );
  }

  if (moods.length > 0) {
    lines.push('');
    lines.push('MOOD:');
    moods.forEach(m =>
      lines.push(`  ${m.log_date}: ${m.mood}/5${m.notes ? ` — ${m.notes}` : ''}`)
    );
  }

  if (medRecords.length > 0) {
    lines.push('');
    lines.push('MEDICATION RECORDS:');
    medRecords.forEach(m =>
      lines.push(`  ${m.administered_at}: ${m.medication_name}${m.dose ? ` ${m.dose}` : ''} — ${m.given ? 'given' : `REFUSED: ${m.refusal_reason || 'no reason given'}`}`)
    );
  }

  if (activities.length > 0) {
    lines.push('');
    lines.push('ACTIVITIES:');
    activities.forEach(a =>
      lines.push(`  ${a.log_date}: ${a.activity_name} (${a.participation_level})${a.notes ? ` — ${a.notes}` : ''}`)
    );
  }

  if (incidents.length > 0) {
    lines.push('');
    lines.push('INCIDENTS:');
    incidents.forEach(i =>
      lines.push(`  ${i.occurred_at}: [${i.severity.toUpperCase()}] ${i.incident_type} — ${i.description}`)
    );
  }

  return lines.join('\n');
}
