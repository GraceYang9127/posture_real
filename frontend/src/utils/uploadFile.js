export async function uploadFile(file) {
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  if (!API_BASE) {
    throw new Error(
      "VITE_API_BASE_URL is not defined. Check frontend/.env and restart Vite."
    );
  }

  // 1. Ask backend for a presigned upload URL
  const res = await fetch(`${API_BASE}/api/upload-url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to get upload URL");
  }

  const { uploadUrl, objectKey } = await res.json();

  // 2. Upload the file directly to S3
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error("Failed to upload file to S3");
  }

  return objectKey;
}
