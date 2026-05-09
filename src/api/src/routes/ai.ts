import { Router, Request, Response } from 'express';
import { generateSummary, streamChat, draftCareNote } from '../ai/agent';

const router = Router();

router.post('/summary/:residentId', async (req: Request, res: Response) => {
  try {
    const residentId = parseInt(req.params.residentId, 10);
    const summary = await generateSummary(residentId);
    res.json({ summary });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post('/chat/:residentId', async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const residentId = parseInt(req.params.residentId, 10);
  const { message, history = [] } = req.body as {
    message: string;
    history: Array<{ role: 'user' | 'assistant'; content: string }>;
  };

  try {
    await streamChat(residentId, message, history, (text) => {
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    });
    res.write('data: [DONE]\n\n');
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: String(err) })}\n\n`);
  } finally {
    res.end();
  }
});

router.post('/care-note/:residentId', async (req: Request, res: Response) => {
  try {
    const residentId = parseInt(req.params.residentId, 10);
    const { shiftNotes = '' } = req.body as { shiftNotes: string };
    const note = await draftCareNote(residentId, shiftNotes);
    res.json({ note });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
