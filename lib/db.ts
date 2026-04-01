import { neon } from '@neondatabase/serverless';

export const sql = neon(process.env.DATABASE_URL!);

export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id VARCHAR(255) PRIMARY KEY,
      gpa_scale_type VARCHAR(10) NOT NULL DEFAULT '4.0',
      gpa_grades JSONB NOT NULL
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS courses (
      id UUID PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      title VARCHAR(255) NOT NULL,
      code VARCHAR(50) NOT NULL,
      credit_hours REAL NOT NULL,
      status VARCHAR(20) NOT NULL,
      final_percent REAL
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS grade_items (
      id UUID PRIMARY KEY,
      course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
      kind VARCHAR(50) NOT NULL,
      name VARCHAR(255) NOT NULL,
      score REAL,
      weight REAL NOT NULL
    );
  `;
  
  console.log("Database initialized successfully.");
}

if (require.main === module) {
  initDb().catch(console.error);
}
