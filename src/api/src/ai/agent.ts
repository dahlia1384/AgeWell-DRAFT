import Anthropic from '@anthropic-ai/sdk';
import { buildResidentContext } from './context';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_BASE = `You are AgeWell, an AI care assistant supporting professional caregivers at a senior care facility. You help staff understand residents' health trends, draft care notes, and surface patterns across daily logs.

CONSTRAINTS:
- You assist trained care professionals — you do not replace clinical judgment
- Always flag urgent concerns (falls, medication refusals, severe mood drops, chest pain, confusion) for immediate human review
- Never diagnose or prescribe — observe, note patterns, flag for clinical review
- Be concise and clinical; care staff are busy
- Use first names when referring to residents
- If asked about something not in your data, say so clearly
- You are AI and must never claim to be or imply you are a human caregiver`;

export async function generateSummary(residentId: number): Promise<string> {
  const residentContext = buildResidentContext(residentId);

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 1024,
    thinking: { type: 'adaptive' },
    system: [
      { type: 'text', text: SYSTEM_BASE, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: residentContext, cache_control: { type: 'ephemeral' } },
    ],
    messages: [
      {
        role: 'user',
        content:
          'Generate a concise end-of-day care summary for this resident. Include: overall status, any concerns from the last 7 days, active alerts, and a brief recommended follow-up for the next shift. Keep it factual and clinical.',
      },
    ],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  return (textBlock as Anthropic.TextBlock | undefined)?.text ?? '';
}

export async function streamChat(
  residentId: number,
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  onChunk: (text: string) => void
): Promise<void> {
  const residentContext = buildResidentContext(residentId);

  const messages: Anthropic.MessageParam[] = [
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: message },
  ];

  const stream = client.messages.stream({
    model: 'claude-opus-4-7',
    max_tokens: 2048,
    thinking: { type: 'adaptive' },
    system: [
      { type: 'text', text: SYSTEM_BASE, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: residentContext, cache_control: { type: 'ephemeral' } },
    ],
    messages,
  });

  stream.on('text', (text) => {
    onChunk(text);
  });

  await stream.finalMessage();
}

export async function draftCareNote(residentId: number, shiftNotes: string): Promise<string> {
  const residentContext = buildResidentContext(residentId);

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 1024,
    thinking: { type: 'adaptive' },
    system: [
      { type: 'text', text: SYSTEM_BASE, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: residentContext, cache_control: { type: 'ephemeral' } },
    ],
    messages: [
      {
        role: 'user',
        content: `Draft a professional shift-handover care note based on today's logs and these staff observations:\n\n${shiftNotes}\n\nThe note should be factual, clinical, and include any follow-up actions for the next shift.`,
      },
    ],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  return (textBlock as Anthropic.TextBlock | undefined)?.text ?? '';
}
