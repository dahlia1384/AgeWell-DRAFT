import { Router, Request, Response } from 'express';
import { db } from '../db/client';

const router = Router();

router.post('/meal', (req: Request, res: Response) => {
  try {
    const { resident_id, staff_id, log_date, meal_type, intake_pct, food_items, notes } = req.body;
    const result = db.prepare(
      'INSERT INTO meal_logs (resident_id, staff_id, log_date, meal_type, intake_pct, food_items, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(resident_id, staff_id ?? null, log_date, meal_type, intake_pct ?? null, food_items ?? null, notes ?? null);
    res.status(201).json({ id: Number(result.lastInsertRowid) });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

router.post('/sleep', (req: Request, res: Response) => {
  try {
    const { resident_id, staff_id, log_date, hours, quality, notes } = req.body;
    const result = db.prepare(
      'INSERT INTO sleep_logs (resident_id, staff_id, log_date, hours, quality, notes) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(resident_id, staff_id ?? null, log_date, hours ?? null, quality ?? null, notes ?? null);
    res.status(201).json({ id: Number(result.lastInsertRowid) });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

router.post('/mood', (req: Request, res: Response) => {
  try {
    const { resident_id, staff_id, log_date, mood, notes } = req.body;
    const result = db.prepare(
      'INSERT INTO mood_checkins (resident_id, staff_id, log_date, mood, notes) VALUES (?, ?, ?, ?, ?)'
    ).run(resident_id, staff_id ?? null, log_date, mood, notes ?? null);
    res.status(201).json({ id: Number(result.lastInsertRowid) });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

router.post('/medication', (req: Request, res: Response) => {
  try {
    const { resident_id, staff_id, medication_name, dose, administered_at, given, refusal_reason, notes } = req.body;
    const result = db.prepare(
      'INSERT INTO medication_records (resident_id, staff_id, medication_name, dose, administered_at, given, refusal_reason, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(resident_id, staff_id ?? null, medication_name, dose ?? null, administered_at, given ?? 1, refusal_reason ?? null, notes ?? null);
    res.status(201).json({ id: Number(result.lastInsertRowid) });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

router.post('/activity', (req: Request, res: Response) => {
  try {
    const { resident_id, staff_id, log_date, activity_name, participation_level, notes } = req.body;
    const result = db.prepare(
      'INSERT INTO activity_logs (resident_id, staff_id, log_date, activity_name, participation_level, notes) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(resident_id, staff_id ?? null, log_date, activity_name, participation_level ?? null, notes ?? null);
    res.status(201).json({ id: Number(result.lastInsertRowid) });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

router.post('/incident', (req: Request, res: Response) => {
  try {
    const { resident_id, staff_id, incident_type, severity, description, location, occurred_at, actions_taken } = req.body;
    const result = db.prepare(
      'INSERT INTO incidents (resident_id, staff_id, incident_type, severity, description, location, occurred_at, actions_taken) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(resident_id, staff_id ?? null, incident_type, severity, description, location ?? null, occurred_at, actions_taken ?? null);

    if (severity === 'high') {
      db.prepare(
        "INSERT INTO alerts (resident_id, alert_type, category, message, severity) VALUES (?, 'system', 'safety', ?, 'high')"
      ).run(resident_id, `Incident reported: ${String(description).substring(0, 100)}`);
    }

    res.status(201).json({ id: Number(result.lastInsertRowid) });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

router.get('/:residentId', (req: Request, res: Response) => {
  try {
    const { residentId } = req.params;
    const days = parseInt((req.query.days as string) ?? '7', 10);
    const end = (req.query.date as string) ?? new Date().toISOString().split('T')[0];
    const start = new Date(end);
    start.setDate(start.getDate() - days);
    const startStr = start.toISOString().split('T')[0];

    res.json({
      mealLogs:          db.prepare('SELECT * FROM meal_logs WHERE resident_id = ? AND log_date BETWEEN ? AND ? ORDER BY log_date DESC, created_at DESC').all(residentId, startStr, end),
      sleepLogs:         db.prepare('SELECT * FROM sleep_logs WHERE resident_id = ? AND log_date BETWEEN ? AND ? ORDER BY log_date DESC').all(residentId, startStr, end),
      moodCheckins:      db.prepare('SELECT * FROM mood_checkins WHERE resident_id = ? AND log_date BETWEEN ? AND ? ORDER BY log_date DESC').all(residentId, startStr, end),
      medicationRecords: db.prepare("SELECT * FROM medication_records WHERE resident_id = ? AND date(administered_at) BETWEEN ? AND ? ORDER BY administered_at DESC").all(residentId, startStr, end),
      activityLogs:      db.prepare('SELECT * FROM activity_logs WHERE resident_id = ? AND log_date BETWEEN ? AND ? ORDER BY log_date DESC').all(residentId, startStr, end),
      incidents:         db.prepare("SELECT * FROM incidents WHERE resident_id = ? AND date(occurred_at) BETWEEN ? AND ? ORDER BY occurred_at DESC").all(residentId, startStr, end),
    });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

export default router;
