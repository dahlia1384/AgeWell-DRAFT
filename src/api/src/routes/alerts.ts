import { Router, Request, Response } from 'express';
import type { SQLInputValue } from 'node:sqlite';
import { db } from '../db/client';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const { status, facility_id } = req.query;

    let sql = `
      SELECT a.*, r.first_name, r.last_name, r.room_number
      FROM alerts a
      JOIN residents r ON a.resident_id = r.id
      WHERE 1=1
    `;
    const params: SQLInputValue[] = [];

    if (status) { sql += ' AND a.status = ?'; params.push(String(status)); }
    if (facility_id) { sql += ' AND r.facility_id = ?'; params.push(String(facility_id)); }

    sql += ' ORDER BY a.created_at DESC LIMIT 200';

    res.json(db.prepare(sql).all(...params));
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { resident_id, category, message, severity } = req.body;
    const result = db.prepare(
      "INSERT INTO alerts (resident_id, alert_type, category, message, severity) VALUES (?, 'manual', ?, ?, ?)"
    ).run(resident_id, category, message, severity);
    res.status(201).json({ id: Number(result.lastInsertRowid) });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

router.put('/:id/acknowledge', (req: Request, res: Response) => {
  try {
    const { staff_id } = req.body;
    db.prepare(
      "UPDATE alerts SET status='acknowledged', acknowledged_by=?, acknowledged_at=CURRENT_TIMESTAMP WHERE id=? AND status='open'"
    ).run(staff_id ?? null, req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

router.put('/:id/resolve', (req: Request, res: Response) => {
  try {
    const { staff_id, resolution_notes } = req.body;
    db.prepare(
      "UPDATE alerts SET status='resolved', resolved_by=?, resolved_at=CURRENT_TIMESTAMP, resolution_notes=? WHERE id=?"
    ).run(staff_id ?? null, resolution_notes ?? null, req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

export default router;
