import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { Resident, Alert } from '../types';
import AlertCard from '../components/AlertCard';

type Tab = 'meals' | 'sleep' | 'mood' | 'medications' | 'activity' | 'incidents';

const today = () => new Date().toISOString().split('T')[0];
const now   = () => new Date().toISOString().slice(0, 16);

function age(dob: string): number {
  const d = new Date(dob);
  const t = new Date();
  let a = t.getFullYear() - d.getFullYear();
  if (t < new Date(t.getFullYear(), d.getMonth(), d.getDate())) a--;
  return a;
}

const moodLabels = ['', 'Very distressed', 'Unhappy', 'Neutral', 'Content', 'Very happy'];
const moodColors = ['', 'text-red-600', 'text-orange-500', 'text-yellow-500', 'text-green-500', 'text-green-700'];

export default function ResidentDetail() {
  const { id } = useParams<{ id: string }>();
  const [resident, setResident] = useState<Resident | null>(null);
  const [tab, setTab]           = useState<Tab>('meals');
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState('');

  const [mealForm, setMealForm] = useState({ meal_type: 'breakfast', intake_pct: '75', food_items: '', notes: '' });
  const [sleepForm, setSleepForm] = useState({ hours: '8', quality: '3', notes: '' });
  const [moodForm, setMoodForm]   = useState({ mood: '4', notes: '' });
  const [medForm, setMedForm]     = useState({ medication_name: '', dose: '', administered_at: now(), given: true, refusal_reason: '', notes: '' });
  const [actForm, setActForm]     = useState({ activity_name: '', participation_level: 'full', notes: '' });
  const [incForm, setIncForm]     = useState({ incident_type: 'fall', severity: 'medium', description: '', location: '', occurred_at: now(), actions_taken: '' });

  const load = async () => {
    const data = (await api.residents.get(Number(id))) as Resident;
    setResident(data);
  };

  useEffect(() => { void load(); }, [id]);

  const flash = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const rid = Number(id);
      if (tab === 'meals') {
        await api.logs.meal({ resident_id: rid, log_date: today(), ...mealForm, intake_pct: Number(mealForm.intake_pct) });
      } else if (tab === 'sleep') {
        await api.logs.sleep({ resident_id: rid, log_date: today(), hours: Number(sleepForm.hours), quality: Number(sleepForm.quality), notes: sleepForm.notes });
      } else if (tab === 'mood') {
        await api.logs.mood({ resident_id: rid, log_date: today(), mood: Number(moodForm.mood), notes: moodForm.notes });
      } else if (tab === 'medications') {
        await api.logs.medication({ resident_id: rid, ...medForm, given: medForm.given ? 1 : 0 });
        setMedForm(f => ({ ...f, medication_name: '', dose: '', administered_at: now(), given: true, refusal_reason: '', notes: '' }));
      } else if (tab === 'activity') {
        await api.logs.activity({ resident_id: rid, log_date: today(), ...actForm });
      } else if (tab === 'incidents') {
        await api.logs.incident({ resident_id: rid, ...incForm });
      }
      await load();
      flash();
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  if (!resident) return <div className="p-8 text-gray-400">Loading...</div>;

  const tabs: Tab[] = ['meals', 'sleep', 'mood', 'medications', 'activity', 'incidents'];
  const { todaysLogs, activeAlerts } = resident as Resident & { todaysLogs?: Resident['todaysLogs']; activeAlerts?: Alert[] };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <Link to="/residents" className="text-sm text-brand-600 hover:underline">← Back to residents</Link>

      {/* Profile header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 flex gap-5 items-start">
        <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-2xl shrink-0">
          {resident.first_name[0]}{resident.last_name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900">{resident.first_name} {resident.last_name}</h1>
          <p className="text-gray-500 text-sm">Room {resident.room_number} · Age {age(resident.date_of_birth)} · DOB {resident.date_of_birth}</p>
          {resident.allergies.length > 0 && (
            <p className="text-sm text-red-600 font-medium mt-1">Allergies: {resident.allergies.join(', ')}</p>
          )}
          {resident.diagnoses.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {resident.diagnoses.map(d => (
                <span key={d} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{d}</span>
              ))}
            </div>
          )}
          {resident.emergency_contact_name && (
            <p className="text-xs text-gray-400 mt-2">
              Emergency: {resident.emergency_contact_name} ({resident.emergency_contact_relation}) {resident.emergency_contact_phone}
            </p>
          )}
        </div>
      </div>

      {/* Active medications */}
      {resident.medications.length > 0 && (
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Standing Medications</h2>
          <div className="divide-y divide-gray-100">
            {resident.medications.map((m, i) => (
              <div key={i} className="py-2 flex justify-between text-sm">
                <span className="font-medium text-gray-800">{m.name} {m.dose}</span>
                <span className="text-gray-400">{m.frequency}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Active alerts */}
      {activeAlerts && activeAlerts.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Active Alerts</h2>
          <div className="space-y-2">
            {activeAlerts.map(a => <AlertCard key={a.id} alert={a} onUpdate={load} />)}
          </div>
        </section>
      )}

      {/* Log entry tabs */}
      <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium capitalize whitespace-nowrap border-b-2 transition-colors ${
                tab === t
                  ? 'border-brand-600 text-brand-700 bg-brand-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Today's existing entries */}
          <TodayLogs tab={tab} logs={todaysLogs} moodLabels={moodLabels} moodColors={moodColors} />

          <form onSubmit={submit} className="space-y-4 mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Log new entry</h3>

            {tab === 'meals' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs text-gray-500">Meal</span>
                    <select value={mealForm.meal_type} onChange={e => setMealForm(f => ({ ...f, meal_type: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      {['breakfast','lunch','dinner','snack'].map(m => <option key={m}>{m}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs text-gray-500">Intake %</span>
                    <input type="number" min="0" max="100" value={mealForm.intake_pct} onChange={e => setMealForm(f => ({ ...f, intake_pct: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </label>
                </div>
                <label className="block">
                  <span className="text-xs text-gray-500">Food items</span>
                  <input type="text" placeholder="e.g. porridge, toast, tea" value={mealForm.food_items} onChange={e => setMealForm(f => ({ ...f, food_items: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </label>
                <label className="block">
                  <span className="text-xs text-gray-500">Notes</span>
                  <textarea rows={2} value={mealForm.notes} onChange={e => setMealForm(f => ({ ...f, notes: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
                </label>
              </>
            )}

            {tab === 'sleep' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs text-gray-500">Hours slept</span>
                    <input type="number" step="0.5" min="0" max="24" value={sleepForm.hours} onChange={e => setSleepForm(f => ({ ...f, hours: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </label>
                  <label className="block">
                    <span className="text-xs text-gray-500">Quality (1–5)</span>
                    <input type="number" min="1" max="5" value={sleepForm.quality} onChange={e => setSleepForm(f => ({ ...f, quality: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </label>
                </div>
                <label className="block">
                  <span className="text-xs text-gray-500">Notes</span>
                  <textarea rows={2} value={sleepForm.notes} onChange={e => setSleepForm(f => ({ ...f, notes: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
                </label>
              </>
            )}

            {tab === 'mood' && (
              <>
                <div>
                  <span className="text-xs text-gray-500">Mood (1 = very distressed, 5 = very happy)</span>
                  <div className="flex gap-3 mt-2">
                    {[1,2,3,4,5].map(n => (
                      <button
                        type="button"
                        key={n}
                        onClick={() => setMoodForm(f => ({ ...f, mood: String(n) }))}
                        className={`w-10 h-10 rounded-full border-2 font-bold text-sm transition-all ${
                          moodForm.mood === String(n)
                            ? 'border-brand-600 bg-brand-50 text-brand-700 scale-110'
                            : 'border-gray-200 text-gray-500 hover:border-gray-400'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  {moodForm.mood && <p className={`text-sm mt-1 font-medium ${moodColors[Number(moodForm.mood)]}`}>{moodLabels[Number(moodForm.mood)]}</p>}
                </div>
                <label className="block">
                  <span className="text-xs text-gray-500">Notes</span>
                  <textarea rows={2} value={moodForm.notes} onChange={e => setMoodForm(f => ({ ...f, notes: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
                </label>
              </>
            )}

            {tab === 'medications' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs text-gray-500">Medication name</span>
                    <input type="text" required value={medForm.medication_name} onChange={e => setMedForm(f => ({ ...f, medication_name: e.target.value }))} placeholder="e.g. Metformin" className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </label>
                  <label className="block">
                    <span className="text-xs text-gray-500">Dose</span>
                    <input type="text" value={medForm.dose} onChange={e => setMedForm(f => ({ ...f, dose: e.target.value }))} placeholder="e.g. 500mg" className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </label>
                </div>
                <label className="block">
                  <span className="text-xs text-gray-500">Administered at</span>
                  <input type="datetime-local" required value={medForm.administered_at} onChange={e => setMedForm(f => ({ ...f, administered_at: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={medForm.given} onChange={e => setMedForm(f => ({ ...f, given: e.target.checked }))} className="rounded" />
                    Medication given
                  </label>
                </div>
                {!medForm.given && (
                  <label className="block">
                    <span className="text-xs text-gray-500">Refusal reason</span>
                    <input type="text" value={medForm.refusal_reason} onChange={e => setMedForm(f => ({ ...f, refusal_reason: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </label>
                )}
                <label className="block">
                  <span className="text-xs text-gray-500">Notes</span>
                  <textarea rows={2} value={medForm.notes} onChange={e => setMedForm(f => ({ ...f, notes: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
                </label>
              </>
            )}

            {tab === 'activity' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs text-gray-500">Activity</span>
                    <input type="text" required value={actForm.activity_name} onChange={e => setActForm(f => ({ ...f, activity_name: e.target.value }))} placeholder="e.g. Morning yoga" className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </label>
                  <label className="block">
                    <span className="text-xs text-gray-500">Participation</span>
                    <select value={actForm.participation_level} onChange={e => setActForm(f => ({ ...f, participation_level: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      {['full','partial','observed','none'].map(p => <option key={p}>{p}</option>)}
                    </select>
                  </label>
                </div>
                <label className="block">
                  <span className="text-xs text-gray-500">Notes</span>
                  <textarea rows={2} value={actForm.notes} onChange={e => setActForm(f => ({ ...f, notes: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
                </label>
              </>
            )}

            {tab === 'incidents' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs text-gray-500">Type</span>
                    <select value={incForm.incident_type} onChange={e => setIncForm(f => ({ ...f, incident_type: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      {['fall','near_fall','behavior','medical','other'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs text-gray-500">Severity</span>
                    <select value={incForm.severity} onChange={e => setIncForm(f => ({ ...f, severity: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      {['low','medium','high'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </label>
                </div>
                <label className="block">
                  <span className="text-xs text-gray-500">Description <span className="text-red-500">*</span></span>
                  <textarea rows={2} required value={incForm.description} onChange={e => setIncForm(f => ({ ...f, description: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs text-gray-500">Location</span>
                    <input type="text" value={incForm.location} onChange={e => setIncForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Hallway near room" className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </label>
                  <label className="block">
                    <span className="text-xs text-gray-500">Occurred at</span>
                    <input type="datetime-local" value={incForm.occurred_at} onChange={e => setIncForm(f => ({ ...f, occurred_at: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </label>
                </div>
                <label className="block">
                  <span className="text-xs text-gray-500">Actions taken</span>
                  <textarea rows={2} value={incForm.actions_taken} onChange={e => setIncForm(f => ({ ...f, actions_taken: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
                </label>
              </>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="bg-brand-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save entry'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

function TodayLogs({ tab, logs, moodLabels, moodColors }: {
  tab: Tab;
  logs?: Resident['todaysLogs'];
  moodLabels: string[];
  moodColors: string[];
}) {
  if (!logs) return null;

  const items: React.ReactNode[] = [];

  if (tab === 'meals' && logs.mealLogs.length > 0) {
    items.push(
      <div key="meals" className="space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Today's meals</p>
        {logs.mealLogs.map(m => (
          <div key={m.id} className="text-sm flex justify-between py-1 border-b border-gray-50">
            <span className="capitalize font-medium">{m.meal_type}</span>
            <span className="text-gray-500">{m.intake_pct ?? '–'}% intake {m.food_items ? `· ${m.food_items}` : ''}</span>
          </div>
        ))}
      </div>
    );
  }

  if (tab === 'sleep' && logs.sleepLogs.length > 0) {
    items.push(
      <div key="sleep" className="space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Today's sleep</p>
        {logs.sleepLogs.map(s => (
          <div key={s.id} className="text-sm py-1 border-b border-gray-50">
            <span className="font-medium">{s.hours}h</span> · Quality {s.quality}/5 {s.notes ? `· ${s.notes}` : ''}
          </div>
        ))}
      </div>
    );
  }

  if (tab === 'mood' && logs.moodCheckins.length > 0) {
    items.push(
      <div key="mood" className="space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Today's mood</p>
        {logs.moodCheckins.map(c => (
          <div key={c.id} className="text-sm py-1 border-b border-gray-50">
            <span className={`font-medium ${moodColors[c.mood]}`}>{moodLabels[c.mood]} ({c.mood}/5)</span>
            {c.notes ? <span className="text-gray-500"> · {c.notes}</span> : null}
          </div>
        ))}
      </div>
    );
  }

  if (tab === 'medications' && logs.medicationRecords.length > 0) {
    items.push(
      <div key="meds" className="space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Today's medications</p>
        {logs.medicationRecords.map(m => (
          <div key={m.id} className="text-sm flex justify-between py-1 border-b border-gray-50">
            <span className="font-medium">{m.medication_name} {m.dose}</span>
            <span className={m.given ? 'text-green-600' : 'text-red-500'}>{m.given ? 'Given' : 'Not given'}</span>
          </div>
        ))}
      </div>
    );
  }

  if (tab === 'activity' && logs.activityLogs.length > 0) {
    items.push(
      <div key="activity" className="space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Today's activities</p>
        {logs.activityLogs.map(a => (
          <div key={a.id} className="text-sm flex justify-between py-1 border-b border-gray-50">
            <span className="font-medium">{a.activity_name}</span>
            <span className="text-gray-500 capitalize">{a.participation_level}</span>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) return <p className="text-sm text-gray-400">No {tab} logged today yet.</p>;
  return <div className="space-y-3">{items}</div>;
}
