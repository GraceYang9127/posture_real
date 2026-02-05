import toast from "react-hot-toast";

export async function uploadFile(
  file,
  { userId, instrument, videoTitle }
) {
  const toastId = toast.loading(
    `Uploading "${videoTitle || "Untitled Video"}"...`
  );

  try {
    // Get presigned upload URL
    const uploadRes = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/upload-url`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          filename: file.name,
          contentType: file.type,
        }),
      }
    );

    if (!uploadRes.ok) {
      throw new Error("Failed to get upload URL");
    }

    const { uploadUrl, objectKey } = await uploadRes.json();

    //Upload file to S3
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!putRes.ok) {
      throw new Error("Failed to upload video to S3");
    }

    toast.loading(
      `Analyzing "${videoTitle || "Untitled Video"}"...`,
      { id: toastId }
    );

    // Kick off background analysis
    const analyzeRes = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/analyze-after-upload`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          s3Key: objectKey,
          instrument,
          videoTitle, 
        }),
      }
    );

    if (!analyzeRes.ok) {
      throw new Error("Failed to start analysis");
    }

    toast.success(
      `"${videoTitle || "Untitled Video"}" uploaded! Analysis running in background.`,
      { id: toastId }
    );

    return { videoKey: objectKey };
  } catch (err) {
    toast.error("Upload failed", { id: toastId });
    throw err;
  }
}
