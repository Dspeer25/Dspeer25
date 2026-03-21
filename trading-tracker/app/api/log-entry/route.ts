import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { date, ticker, event, location, state, notes } = body;

  if (!event || !location || !state) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!spreadsheetId) {
    return NextResponse.json({ error: "Missing spreadsheet config" }, { status: 500 });
  }

  const oauth2 = new google.auth.OAuth2();
  oauth2.setCredentials({ access_token: (session as any).accessToken });
  const sheets = google.sheets({ version: "v4", auth: oauth2 });

  const row = [date ?? new Date().toISOString().split("T")[0], ticker ?? "", event, location, state, notes ?? ""];

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Entries!A:F",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Failed to log entry" },
      { status: 500 }
    );
  }
}
