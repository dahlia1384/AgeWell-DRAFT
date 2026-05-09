import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

const dataDir = path.resolve(__dirname, '../../../../data');
const dbPath  = path.join(dataDir, 'agewell.db');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

export function applySchema(): void {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
}
