import toast from "react-hot-toast";

/**
 * Uploads a video file using a presigned S3 URL
 * Frontend never handles AWS credentials directly
 * 
 * Flow: 
 * 1. Request a presigned upload URL from backend
 * 2. upload file directly to S3
 * 3. Notify backend to start background analysis
 */
export async function uploadFile(
  file,
  { userId, instrument, videoTitle }
) {
  // Provide immediate user feedback while upload runs
  const toastId = toast.loading(
    `Uploading "${videoTitle || "Untitled Video"}"...`
  );

  try {
    /**
     * STEP 1: requesting presigned upload URL from backend
     * 
     * backend validates User identity and returns: 
     * - A temporary S3 upload URL
     *  - The object key where the file will live
     * 
     * The file itself is NOT sent to the backend yet
     */
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

    /**
     * STEP 2: Upload directly to S3
     * 
     * This PUT request goes straight to AWS S3
     * Backend is not involved in file transfer
     */
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!putRes.ok) {
      throw new Error("Failed to upload video to S3");
    }
    /**
     * STEP 3: Notify backend to start analysis
     * 
     * Now, the file is stored in S3, send metadata to the backend for the analysis to run asynchronously
     */
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
    // If the upload completes, the analysis can continue in the background. 
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
