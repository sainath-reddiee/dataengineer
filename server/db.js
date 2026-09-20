import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize SQLite database
const db = new Database(path.join(dataDir, 'database.sqlite'), { verbose: console.log });

// Enable Write-Ahead Logging for better performance
db.pragma('journal_mode = WAL');

// Create the users table for tracking subscriptions
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    plan TEXT DEFAULT 'free',
    subscription_status TEXT DEFAULT 'inactive',
    subscription_id TEXT,
    customer_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Create the interview_questions table
db.exec(`
  CREATE TABLE IF NOT EXISTS interview_questions (
    id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    role TEXT,
    topic TEXT,
    difficulty TEXT,
    type TEXT,
    company TEXT,
    platform TEXT,
    proOnly INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ─── Database Helpers ─────────────────────────────────────────────────────────

export function getUserById(id) {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id);
}

export function getUserByEmail(email) {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  return stmt.get(email);
}

export function upsertUser(user) {
  const stmt = db.prepare(`
    INSERT INTO users (id, email, name, plan, subscription_status, subscription_id, customer_id)
    VALUES (@id, @email, @name, @plan, @subscription_status, @subscription_id, @customer_id)
    ON CONFLICT(email) DO UPDATE SET
      name = excluded.name,
      plan = excluded.plan,
      subscription_status = excluded.subscription_status,
      subscription_id = excluded.subscription_id,
      customer_id = excluded.customer_id,
      updated_at = CURRENT_TIMESTAMP
  `);
  stmt.run(user);
}

export function updateUserSubscription(email, plan, status, subscriptionId, customerId) {
  const stmt = db.prepare(`
    UPDATE users 
    SET plan = ?, subscription_status = ?, subscription_id = ?, customer_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE email = ?
  `);
  stmt.run(plan, status, subscriptionId, customerId, email);
}

export function getAllUsers() {
  const stmt = db.prepare('SELECT * FROM users ORDER BY created_at DESC');
  return stmt.all();
}

export function getAllQuestions() {
  const stmt = db.prepare('SELECT * FROM interview_questions ORDER BY created_at DESC');
  return stmt.all().map(q => ({ ...q, proOnly: !!q.proOnly }));
}

export function addQuestion(q) {
  const stmt = db.prepare(`
    INSERT INTO interview_questions (id, question, role, topic, difficulty, type, company, platform, proOnly)
    VALUES (@id, @question, @role, @topic, @difficulty, @type, @company, @platform, @proOnly)
  `);
  stmt.run({ ...q, proOnly: q.proOnly ? 1 : 0 });
}

export function updateQuestion(id, q) {
  const stmt = db.prepare(`
    UPDATE interview_questions 
    SET question = @question, role = @role, topic = @topic, difficulty = @difficulty, 
        type = @type, company = @company, platform = @platform, proOnly = @proOnly, updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `);
  stmt.run({ ...q, id, proOnly: q.proOnly ? 1 : 0 });
}

export function deleteQuestion(id) {
  const stmt = db.prepare('DELETE FROM interview_questions WHERE id = ?');
  stmt.run(id);
}

export default db;
