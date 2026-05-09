import { useState, useRef, useEffect } from 'react';
import { api } from '../api/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ResidentOption {
  id: number;
  first_name: string;
  last_name: string;
  room_number: string;
}

async function streamChat(
  residentId: number,
  message: string,
  history: Message[],
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: string) => void
) {
  const res = await fetch(`/api/ai/chat/${residentId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });

  if (!res.ok || !res.body) {
    onError(`Request failed (${res.status})`);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';
    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6);
      if (raw === '[DONE]') { onDone(); return; }
      try {
        const parsed = JSON.parse(raw) as { text?: string; error?: string };
        if (parsed.error) { onError(parsed.error); return; }
        if (parsed.text) onChunk(parsed.text);
      } catch { /* ignore malformed chunks */ }
    }
  }
  onDone();
}

export default function AIAssistant() {
  const [residents, setResidents] = useState<ResidentOption[]>([]);
  const [residentId, setResidentId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [noteLoading, setNoteLoading] = useState(false);
  const [shiftNotes, setShiftNotes] = useState('');
  const [showNotePanel, setShowNotePanel] = useState(false);
  const [draftedNote, setDraftedNote] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.residents.list().then((list) => setResidents(list as ResidentOption[]));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleResidentChange(id: number) {
    setResidentId(id);
    setMessages([]);
    setDraftedNote('');
    setShiftNotes('');
  }

  async function sendMessage() {
    if (!residentId || !input.trim() || streaming) return;
    const text = input.trim();
    setInput('');
    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setStreaming(true);

    let assistantContent = '';
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    await streamChat(
      residentId,
      text,
      messages,
      (chunk) => {
        assistantContent += chunk;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
          return updated;
        });
      },
      () => setStreaming(false),
      (err) => {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: `Error: ${err}` };
          return updated;
        });
        setStreaming(false);
      }
    );
  }

  async function generateSummary() {
    if (!residentId || summaryLoading) return;
    setSummaryLoading(true);
    try {
      const res = await fetch(`/api/ai/summary/${residentId}`, { method: 'POST' });
      const data = await res.json() as { summary?: string; error?: string };
      if (data.summary) {
        setMessages(prev => [
          ...prev,
          { role: 'user', content: 'Generate a care summary for today.' },
          { role: 'assistant', content: data.summary! },
        ]);
      }
    } finally {
      setSummaryLoading(false);
    }
  }

  async function draftNote() {
    if (!residentId || noteLoading) return;
    setNoteLoading(true);
    try {
      const res = await fetch(`/api/ai/care-note/${residentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shiftNotes }),
      });
      const data = await res.json() as { note?: string; error?: string };
      if (data.note) setDraftedNote(data.note);
    } finally {
      setNoteLoading(false);
    }
  }

  const selectedResident = residents.find(r => r.id === residentId);

  return (
    <div className="flex h-full">
      {/* left panel */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 p-4 gap-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Resident</h2>
          <select
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={residentId ?? ''}
            onChange={e => handleResidentChange(Number(e.target.value))}
          >
            <option value="">Select a resident…</option>
            {residents.map(r => (
              <option key={r.id} value={r.id}>
                {r.first_name} {r.last_name} — {r.room_number}
              </option>
            ))}
          </select>
        </div>

        {residentId && (
          <>
            <button
              onClick={generateSummary}
              disabled={summaryLoading}
              className="w-full text-left px-3 py-2 rounded-md bg-brand-50 hover:bg-brand-100 text-brand-700 text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {summaryLoading ? 'Generating…' : 'Daily summary'}
            </button>

            <button
              onClick={() => { setShowNotePanel(!showNotePanel); setDraftedNote(''); }}
              className="w-full text-left px-3 py-2 rounded-md bg-brand-50 hover:bg-brand-100 text-brand-700 text-sm font-medium transition-colors"
            >
              Draft care note
            </button>
          </>
        )}

        <div className="mt-auto text-xs text-gray-400 leading-relaxed">
          AI responses are drafts only. Always review before filing. AgeWell AI identifies itself as AI at all times.
        </div>
      </div>

      {/* main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <h1 className="text-lg font-semibold text-gray-900">AI Care Assistant</h1>
          {selectedResident && (
            <p className="text-sm text-gray-500 mt-0.5">
              {selectedResident.first_name} {selectedResident.last_name} — Room {selectedResident.room_number}
            </p>
          )}
        </div>

        {!residentId ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Select a resident to begin
          </div>
        ) : showNotePanel ? (
          /* care note panel */
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Draft Care Note</h2>
            <textarea
              rows={5}
              placeholder="Add your shift observations (optional) — the AI will incorporate today's logged data automatically."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y"
              value={shiftNotes}
              onChange={e => setShiftNotes(e.target.value)}
            />
            <button
              onClick={draftNote}
              disabled={noteLoading}
              className="px-4 py-2 bg-brand-600 text-white rounded-md text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {noteLoading ? 'Drafting…' : 'Generate draft'}
            </button>

            {draftedNote && (
              <div className="mt-4">
                <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                  Draft — review before filing
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-sm text-gray-800 whitespace-pre-wrap">
                  {draftedNote}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* chat panel */
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {messages.length === 0 && (
                <p className="text-sm text-gray-400">
                  Ask anything about {selectedResident?.first_name}'s recent logs, trends, or care status.
                </p>
              )}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-xl px-4 py-3 text-sm whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-brand-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-800'
                    }`}
                  >
                    {msg.content || (streaming && i === messages.length - 1 ? (
                      <span className="animate-pulse text-gray-400">Thinking…</span>
                    ) : '')}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* input bar */}
            <div className="border-t border-gray-200 bg-white px-6 py-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Ask about sleep trends, medication adherence, mood patterns…"
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  disabled={streaming}
                />
                <button
                  onClick={sendMessage}
                  disabled={streaming || !input.trim()}
                  className="px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
