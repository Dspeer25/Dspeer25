import { NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const folderId = process.env.DRIVE_FOLDER_ID;
  if (!folderId) {
    return NextResponse.json({ error: "Missing folder config" }, { status: 500 });
  }

  const oauth2 = new google.auth.OAuth2();
  oauth2.setCredentials({ access_token: (session as any).accessToken });
  const drive = google.drive({ version: "v3", auth: oauth2 });

  const allFiles: {
    id: string;
    name: string;
    mimeType: string;
    createdTime: string;
    modifiedTime: string;
    folderPath: string;
  }[] = [];

  async function listFolder(id: string, path: string) {
    const res = await drive.files.list({
      q: `'${id}' in parents and trashed = false`,
      fields: "files(id, name, mimeType, createdTime, modifiedTime)",
      pageSize: 100,
    });
    const files = res.data.files ?? [];
    for (const file of files) {
      if (file.mimeType === "application/vnd.google-apps.folder") {
        await listFolder(file.id!, `${path}/${file.name}`);
      } else if (file.mimeType === "application/vnd.google-apps.document") {
        allFiles.push({
          id: file.id!,
          name: file.name!,
          mimeType: file.mimeType!,
          createdTime: file.createdTime!,
          modifiedTime: file.modifiedTime!,
          folderPath: path,
        });
      }
    }
  }

  try {
    const rootInfo = await drive.files.get({ fileId: folderId, fields: "name" });
    await listFolder(folderId, rootInfo.data.name ?? "Journal");
    return NextResponse.json({ files: allFiles });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Failed to list Drive files" },
      { status: 500 }
    );
  }
}
