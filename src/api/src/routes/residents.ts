import { Router, Request, Response } from 'express';
import { db } from '../db/client';

const router = Router();

function parseResident(r: Record<string, unknown>) {
  return {
    ...r,
    diagnoses:   JSON.parse((r.diagnoses as string)   || '[]'),
    medications: JSON.parse((r.medications as string) || '[]'),
    allergies:   JSON.parse((r.allergies as string)   || '[]'),
    preferences: JSON.parse((r.preferences as string) || '{}'),
    active: Boolean(r.active),
  };
}

router.get('/', (_req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT r.*, f.name AS facility_name
      FROM residents r
      LEFT JOIN facilities f ON r.facility_id = f.id
      WHERE r.active = 1
      ORDER BY r.last_name, r.first_name
    `).all() as Record<string, unknown>[];
    res.json(rows.map(parseResident));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const resident = db.prepare(`
      SELECT r.*, f.name AS facility_name
      FROM residents r
      LEFT JOIN facilities f ON r.facility_id = f.id
      WHERE r.id = ?
    `).get(req.params.id) as Record<string, unknown> | undefined;

    if (!resident) return res.status(404).json({ error: 'Resident not found' });

    const today = new Date().toISOString().split('T')[0];

    const todaysLogs = {
      mealLogs:          db.prepare('SELECT * FROM meal_logs WHERE resident_id = ? AND log_date = ? ORDER BY created_at').all(req.params.id, today),
      sleepLogs:         db.prepare('SELECT * FROM sleep_logs WHERE resident_id = ? AND log_date = ?').all(req.params.id, today),
      moodCheckins:      db.prepare('SELECT * FROM mood_checkins WHERE resident_id = ? AND log_date = ?').all(req.params.id, today),
      medicationRecords: db.prepare("SELECT * FROM medication_records WHERE resident_id = ? AND date(administered_at) = ? ORDER BY administered_at").all(req.params.id, today),
      activityLogs:      db.prepare('SELECT * FROM activity_logs WHERE resident_id = ? AND log_date = ?').all(req.params.id, today),
    };

    const activeAlerts = db.prepare(`
      SELECT * FROM alerts WHERE resident_id = ? AND status != 'resolved'
      ORDER BY created_at DESC LIMIT 10
    `).all(req.params.id);

    res.json({ ...parseResident(resident), todaysLogs, activeAlerts });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const {
      facility_id, first_name, last_name, date_of_birth, room_number, admission_date,
      diagnoses, medications, allergies, preferences, language,
      emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
    } = req.body;

    const result = db.prepare(`
      INSERT INTO residents (
        facility_id, first_name, last_name, date_of_birth, room_number, admission_date,
        diagnoses, medications, allergies, preferences, language,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      facility_id, first_name, last_name, date_of_birth, room_number, admission_date,
      JSON.stringify(diagnoses   ?? []),
      JSON.stringify(medications ?? []),
      JSON.stringify(allergies   ?? []),
      JSON.stringify(preferences ?? {}),
      language ?? 'en',
      emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
    );
    res.status(201).json({ id: Number(result.lastInsertRowid) });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const {
      first_name, last_name, room_number, diagnoses, medications, allergies, preferences,
      language, emergency_contact_name, emergency_contact_phone, emergency_contact_relation, active,
    } = req.body;

    db.prepare(`
      UPDATE residents SET
        first_name                 = COALESCE(?, first_name),
        last_name                  = COALESCE(?, last_name),
        room_number                = COALESCE(?, room_number),
        diagnoses                  = COALESCE(?, diagnoses),
        medications                = COALESCE(?, medications),
        allergies                  = COALESCE(?, allergies),
        preferences                = COALESCE(?, preferences),
        language                   = COALESCE(?, language),
        emergency_contact_name     = COALESCE(?, emergency_contact_name),
        emergency_contact_phone    = COALESCE(?, emergency_contact_phone),
        emergency_contact_relation = COALESCE(?, emergency_contact_relation),
        active                     = COALESCE(?, active),
        updated_at                 = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      first_name ?? null, last_name ?? null, room_number ?? null,
      diagnoses   ? JSON.stringify(diagnoses)   : null,
      medications ? JSON.stringify(medications) : null,
      allergies   ? JSON.stringify(allergies)   : null,
      preferences ? JSON.stringify(preferences) : null,
      language ?? null,
      emergency_contact_name ?? null, emergency_contact_phone ?? null, emergency_contact_relation ?? null,
      active !== undefined ? (active ? 1 : 0) : null,
      req.params.id,
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
