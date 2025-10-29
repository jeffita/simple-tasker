// File: /app/api/reminders/route.js

import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@libsql/client';

const dbClient = createClient({
  url: process.env.TURSO_DATABASE_URL || "libsql://database-emerald-ball-vercel-icfg-dgpk6yup5ek0sjjg4h4yw1mb.aws-ap-south-1.turso.io",
  authToken: process.env.TURSO_AUTH_TOKEN || "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NTM0NTA5NzgsImlkIjoiNzQ0YzlkYmUtOWE5Yy00ZjU5LTlhOWItZWI3NzYxNGU5NzI1IiwicmlkIjoiODczY2U3ZDUtNzU4Yy00YWEyLTk3ZDAtNGFiOTAyMWU2MGEwIn0.D5o7wFhG2aO48CZCONaPXk81VA3G-5ozzXcF1EQbA_AJ2vfzaYlb4qBDNeIRawBT-UfID_m71QLNE_-lzmwXBQ",
});

// Helper function to get an authenticated Google API client
async function getAuthenticatedClient() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REFRESH_TOKEN) {
    throw new Error("Google API credentials are not configured on the server.");
  }
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    // The redirect URI is not used in the refresh token flow, but is required.
    'https://developers.google.com/oauthplayground' 
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  // Automatically refresh the access token if it's expired
  const { token } = await oauth2Client.getAccessToken();
  oauth2Client.setCredentials({ access_token: token });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}


export async function POST(request) {
  try {
    const calendar = await getAuthenticatedClient();
    const { taskId, taskName, reminderDateTime } = await request.json();

    const event = {
      summary: `Task Reminder: ${taskName}`,
      description: `This is a reminder for your task: "${taskName}"`,
      start: {
        dateTime: reminderDateTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Use server's/user's timezone
      },
      end: {
        dateTime: reminderDateTime, // For reminders, start and end can be the same
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
       reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 60 }, // 1 hour before
          { method: 'popup', minutes: 10 }, // 10 minutes before
        ],
      },
    };

    const createdEvent = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    const eventId = createdEvent.data.id;
    if (!eventId) {
      throw new Error("Failed to get event ID from Google Calendar response.");
    }
    
    // Store mapping in our database
    await dbClient.execute("CREATE TABLE IF NOT EXISTS reminders (task_id TEXT PRIMARY KEY, event_id TEXT, reminder_date TEXT);");
    await dbClient.execute({
      sql: "INSERT OR REPLACE INTO reminders (task_id, event_id, reminder_date) VALUES (?, ?, ?);",
      args: [taskId, eventId, reminderDateTime],
    });

    return NextResponse.json({
      taskId,
      eventId,
      reminderDate: reminderDateTime
    });
  } catch (error) {
    console.error('Failed to set reminder:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ message: 'Failed to set reminder' }, { status: 500 });
  }
}

export async function GET() {
    try {
        await dbClient.execute("CREATE TABLE IF NOT EXISTS reminders (task_id TEXT PRIMARY KEY, event_id TEXT, reminder_date TEXT);");
        const result = await dbClient.execute("SELECT * FROM reminders;");
        
        const reminders = result.rows.reduce((acc, row) => {
            if(row.task_id && row.event_id && row.reminder_date) {
                acc[row.task_id] = {
                    eventId: row.event_id,
                    reminderDate: row.reminder_date,
                };
            }
            return acc;
        }, {});

        return NextResponse.json(reminders);
    } catch (error) {
        console.error('Failed to retrieve reminders:', error instanceof Error ? error.message : String(error));
        return NextResponse.json({ message: 'Failed to retrieve reminders' }, { status: 500 });
    }
}