import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get("id");
  if (!fileId) {
    return NextResponse.json({ error: "Missing file id" }, { status: 400 });
  }

  const oauth2 = new google.auth.OAuth2();
  oauth2.setCredentials({ access_token: (session as any).accessToken });
  const drive = google.drive({ version: "v3", auth: oauth2 });

  try {
    const res = await drive.files.export({ fileId, mimeType: "text/plain" });
    return NextResponse.json({ content: res.data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Failed to export doc" },
      { status: 500 }
    );
  }
}
