import { neon } from '@neondatabase/serverless';

async function test() {
  const sql = neon(process.env.DATABASE_URL!);
  try {
    const res = await sql`ALTER TABLE courses ALTER COLUMN credit_hours TYPE REAL`;
    console.log("SUCCESS ALTERING TABLE", res);
  } catch (e) {
    console.error("ERROR ALTERING TABLE", e);
  }
}

test();
