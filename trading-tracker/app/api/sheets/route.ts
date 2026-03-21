import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET() {
  const spreadsheetId = process.env.SPREADSHEET_ID;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

  if (!spreadsheetId || !apiKey) {
    return NextResponse.json({ error: "Missing config" }, { status: 500 });
  }

  try {
    const sheets = google.sheets({ version: "v4", auth: apiKey });
    const metaRes = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetNames = (metaRes.data.sheets ?? []).map(
      (s) => s.properties?.title ?? "Sheet1"
    );

    const allSheets: Record<string, { headers: string[]; rows: string[][] }> = {};

    for (const name of sheetNames) {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${name}'!A1:Z1000`,
      });
      const rows = res.data.values ?? [];
      if (rows.length === 0) {
        allSheets[name] = { headers: [], rows: [] };
      } else {
        const [headers, ...dataRows] = rows as string[][];
        allSheets[name] = { headers, rows: dataRows };
      }
    }

    return NextResponse.json({ sheets: allSheets, sheetNames });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Failed to fetch sheet" },
      { status: 500 }
    );
  }
}
