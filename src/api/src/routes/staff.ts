import { Router, Request, Response } from 'express';
import { db } from '../db/client';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  try {
    res.json(db.prepare('SELECT * FROM staff ORDER BY name').all());
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { facility_id, name, email, role } = req.body;
    const result = db.prepare(
      'INSERT INTO staff (facility_id, name, email, role) VALUES (?, ?, ?, ?)'
    ).run(facility_id, name, email, role);
    res.status(201).json({ id: Number(result.lastInsertRowid) });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

export default router;
