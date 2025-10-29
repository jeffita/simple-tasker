// app/api/reminders/[taskId]/route.js

import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@libsql/client';

const dbClient = createClient({
  url: process.env.TURSO_DATABASE_URL || "libsql://-emerald-ball-vercel-icfg-dgpk6yup5ek0sjjg4h4yw1mb.aws-ap-south-1.turso.io",
  authToken: process.env.TURSO_AUTH_TOKEN || ".eyJpYXQiOjE3NTM0NTA5NzgsImlkIjoiNzQ0YzlkYmUtOWE5Yy00ZjU5LTlhOWItZWI3NzYxNGU5NzI1IiwicmlkIjoiODczY2U3ZDUtNzU4Yy00YWEyLTk3ZDAtNGFiOTAyMWU2MGEwIn0.D5o7wFhG2aO48CZCONaPXk81VA3G-5ozzXcF1EQbA_AJ2vfzaYlb4qBDNeIRawBT-UfID_m71QLNE_-lzmwXBQ",
});

// Helper function to get an authenticated Google API client
async function getAuthenticatedClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground' 
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  const { token } = await oauth2Client.getAccessToken();
  oauth2Client.setCredentials({ access_token: token });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}


export async function DELETE(
  request,
  // --- THIS IS THE FINAL FIX ---
  // We disable the ESLint rule for the line where we use `any`
  // to work around the Next.js build bug.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context 
) {
  // Restore type safety immediately
  const { taskId } = context.params;

  if (!process.env.GOOGLE_REFRESH_TOKEN) {
    return NextResponse.json(
        { message: 'Google API credentials are not configured on the server.' }, 
        { status: 500 }
    );
  }

  try {
    await dbClient.execute(
        "CREATE TABLE IF NOT EXISTS reminders (task_id TEXT PRIMARY KEY, event_id TEXT, reminder_date TEXT);"
    );
    
    const dbResult = await dbClient.execute({
      sql: "SELECT event_id FROM reminders WHERE task_id = ?;",
      args: [taskId],
    });

    // Use `as unknown as` to satisfy strict TypeScript casting rules
    const row = dbResult.rows[0];
    const eventId = row?.event_id;

    if (!eventId) {
      return NextResponse.json({ message: "Reminder not found or already deleted." });
    }

    const calendar = await getAuthenticatedClient();
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });

    await dbClient.execute({
      sql: "DELETE FROM reminders WHERE task_id = ?;",
      args: [taskId],
    });

    return NextResponse.json({ message: 'Reminder deleted successfully' });
  } catch (error) {
    console.error('Failed to delete reminder:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ message: 'Failed to delete reminder' }, { status: 500 });
  }
}
