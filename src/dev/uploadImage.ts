import { getApiUrl } from "../api/config";
import { getToken } from "../auth/token";

export type UploadResult = { url: string };

type UploadAsset = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
};

export async function uploadImageAsset(asset: UploadAsset): Promise<string> {
  const token = await getToken();
  if (!token) throw new Error("Unauthorized");
  const base = getApiUrl().replace(/\/$/, "");

  const uri = asset.uri;
  const fileName =
    asset.fileName?.trim() || `upload-${Date.now().toString(36)}.jpg`;
  const type = asset.mimeType?.trim() || "image/jpeg";

  const form = new FormData();
  form.append("file", { uri, name: fileName, type } as any);

  const res = await fetch(`${base}/upload/image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  const data = (await res.json()) as UploadResult;
  if (!data?.url) throw new Error("Upload failed (no url)");
  return data.url;
}

