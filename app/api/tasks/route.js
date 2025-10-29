import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "libsql://database-emerald-ball-vercel-icfg-dgpk6yup5ek0sjjg4h4yw1mb.aws-ap-south-1.turso.io",
  authToken: process.env.TURSO_AUTH_TOKEN || "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NTM0NTA5NzgsImlkIjoiNzQ0YzlkYmUtOWE5Yy00ZjU5LTlhOWItZWI3NzYxNGU5NzI1IiwicmlkIjoiODczY2U3ZDUtNzU4Yy00YWEyLTk3ZDAtNGFiOTAyMWU2MGEwIn0.D5o7wFhG2aO48CZCONaPXk81VA3G-5ozzXcF1EQbA_AJ2vfzaYlb4qBDNeIRawBT-UfID_m71QLNE_-lzmwXBQ",
});

export async function POST(request) {
  try {
    const tasks = await request.json();
    await client.execute("CREATE TABLE IF NOT EXISTS tasks (data TEXT);");
    await client.execute({ sql: "INSERT OR REPLACE INTO tasks (rowid, data) VALUES (1, ?);", args: [JSON.stringify(tasks)] });
    return NextResponse.json({ message: 'Tasks saved successfully' });
  } catch (error) {
    console.error('Failed to save tasks:', error);
    return NextResponse.json({ message: 'Failed to save tasks' }, { status: 500 });
  }
}

export async function GET() {
  try {
    await client.execute("CREATE TABLE IF NOT EXISTS tasks (data TEXT);");
    const result = await client.execute("SELECT data FROM tasks WHERE rowid = 1;");
    const tasks = result.rows[0]?.data;
    return NextResponse.json(tasks ? JSON.parse(tasks) : []);
  } catch (error) {
    console.error('Failed to retrieve tasks:', error);
    return NextResponse.json({ message: 'Failed to retrieve tasks' }, { status: 500 });
  }
}
