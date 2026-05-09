import { db, applySchema } from './client';

applySchema();

const existing = db.prepare('SELECT COUNT(*) as count FROM facilities').get() as { count: number };
if (existing.count > 0) {
  console.log('Database already seeded. Skipping.');
  process.exit(0);
}

const facilityId = db.prepare(
  'INSERT INTO facilities (name, address, phone) VALUES (?, ?, ?)'
).run('Sunrise Care Home', '123 Elm Street, Toronto, ON M5V 1A1', '(416) 555-0100').lastInsertRowid;

const adminId = db.prepare(
  'INSERT INTO staff (facility_id, name, email, role) VALUES (?, ?, ?, ?)'
).run(facilityId, 'Dr. Sarah Chen', 'sarah.chen@sunrise.ca', 'admin').lastInsertRowid;

db.prepare('INSERT INTO staff (facility_id, name, email, role) VALUES (?, ?, ?, ?)').run(
  facilityId, 'Nurse Maria Santos', 'maria.santos@sunrise.ca', 'nurse'
);
db.prepare('INSERT INTO staff (facility_id, name, email, role) VALUES (?, ?, ?, ?)').run(
  facilityId, 'James Wilson', 'james.wilson@sunrise.ca', 'caregiver'
);

const insertResident = db.prepare(`
  INSERT INTO residents (
    facility_id, first_name, last_name, date_of_birth, room_number, admission_date,
    diagnoses, medications, allergies, preferences, language,
    emergency_contact_name, emergency_contact_phone, emergency_contact_relation
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const r1 = insertResident.run(
  facilityId, 'Margaret', 'Thompson', '1938-03-15', '101A', '2023-01-10',
  JSON.stringify(['Type 2 Diabetes', 'Hypertension', 'Mild cognitive impairment']),
  JSON.stringify([
    { name: 'Metformin', dose: '500mg', frequency: 'twice daily' },
    { name: 'Lisinopril', dose: '10mg', frequency: 'once daily' },
    { name: 'Aspirin', dose: '81mg', frequency: 'once daily' },
  ]),
  JSON.stringify(['Penicillin']),
  JSON.stringify({ preferred_activities: ['bingo', 'gardening'], dietary_restrictions: ['low sodium'] }),
  'en', 'Robert Thompson', '(416) 555-0201', 'Son'
).lastInsertRowid;

const r2 = insertResident.run(
  facilityId, 'Henry', 'Nakamura', '1932-07-22', '203B', '2022-06-15',
  JSON.stringify(["Parkinson's Disease", 'Osteoarthritis', 'Depression']),
  JSON.stringify([
    { name: 'Levodopa', dose: '100mg', frequency: 'three times daily' },
    { name: 'Sertraline', dose: '50mg', frequency: 'once daily' },
    { name: 'Calcium + Vitamin D', dose: '600mg/400IU', frequency: 'once daily' },
  ]),
  JSON.stringify(['Sulfa drugs', 'Shellfish']),
  JSON.stringify({ preferred_activities: ['reading', 'chess'], dietary_restrictions: [] }),
  'en', 'Yuki Nakamura', '(416) 555-0312', 'Daughter'
).lastInsertRowid;

const r3 = insertResident.run(
  facilityId, 'Eleanor', 'Osei', '1940-11-03', '115C', '2023-08-20',
  JSON.stringify(['Congestive Heart Failure', 'Atrial Fibrillation', 'Hypothyroidism']),
  JSON.stringify([
    { name: 'Warfarin', dose: '2.5mg', frequency: 'once daily' },
    { name: 'Metoprolol', dose: '25mg', frequency: 'twice daily' },
    { name: 'Levothyroxine', dose: '50mcg', frequency: 'once daily' },
  ]),
  JSON.stringify([]),
  JSON.stringify({ preferred_activities: ['tv', 'knitting'], dietary_restrictions: ['low fluid'] }),
  'en', 'Kwame Osei', '(416) 555-0423', 'Nephew'
).lastInsertRowid;

const todayIso = new Date().toISOString().split('T')[0];

for (const residentId of [r1, r2, r3]) {
  for (const type of ['data_collection', 'ai_analysis', 'family_sharing']) {
    db.prepare(
      'INSERT INTO consent_records (resident_id, consent_given, consent_date, consent_type) VALUES (?, 1, ?, ?)'
    ).run(residentId, todayIso, type);
  }
}

const today = new Date().toISOString().split('T')[0];

db.prepare(
  'INSERT INTO meal_logs (resident_id, staff_id, log_date, meal_type, intake_pct, notes) VALUES (?, ?, ?, ?, ?, ?)'
).run(r1, adminId, today, 'breakfast', 75, 'Good appetite, finished most of porridge');

db.prepare(
  'INSERT INTO sleep_logs (resident_id, staff_id, log_date, hours, quality, notes) VALUES (?, ?, ?, ?, ?, ?)'
).run(r1, adminId, today, 7.5, 3, 'Woke twice during the night, seemed restless');

db.prepare(
  'INSERT INTO mood_checkins (resident_id, staff_id, log_date, mood, notes) VALUES (?, ?, ?, ?, ?)'
).run(r1, adminId, today, 4, 'Cheerful, chatting with other residents at breakfast');

db.prepare(
  'INSERT INTO alerts (resident_id, alert_type, category, message, severity) VALUES (?, ?, ?, ?, ?)'
).run(r2, 'manual', 'health', 'Blood pressure elevated: 158/92 mmHg. Monitor every 2 hours.', 'medium');

db.prepare(
  'INSERT INTO alerts (resident_id, alert_type, category, message, severity) VALUES (?, ?, ?, ?, ?)'
).run(r3, 'manual', 'medication', 'Warfarin dose adjustment pending INR results from lab.', 'high');

console.log('Database seeded successfully with 3 residents, sample logs, and alerts.');
process.exit(0);
