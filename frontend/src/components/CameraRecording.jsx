import React, { useMemo, useRef, useState } from "react";
import { uploadFile } from "../utils/uploadFile";

export default function CameraRecording({ stream }) {
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [status, setStatus] = useState("");
  const [recordSeconds, setRecordSetconds] = useState(0);
  const timerRef = useRef(null);



  const mimeType = useMemo(() => {
    // Prefer WebM if available (most common support)
    const candidates = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
    ];
    for (const c of candidates) {
      if (window.MediaRecorder && MediaRecorder.isTypeSupported(c)) return c;
    }
    return ""; // browser picks default
  }, []);

  const startRecording = () => {
    setRecordSetconds(0);
    timerRef.current = setInterval(() => {
        setRecordSetconds((s) => s + 1);
    }, 1000);
    if (!stream) {
      setStatus("No camera stream yet. Allow camera permissions first.");
      return;
    }

    // Clear old preview if you start a new recording
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
    setRecordedBlob(null);
    setStatus("");

    chunksRef.current = [];

    try {
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
        setRecordedBlob(blob);

        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);

        setStatus("Recording ready.");
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setStatus("Recording...");
    } catch (err) {
      console.error(err);
      setStatus("Failed to start recording.");
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    try {
      recorder.stop();
    } catch (err) {
      console.error(err);
      setStatus("Failed to stop recording.");
    }
    clearInterval(timerRef.current);
    timerRef.current = null;
    setIsRecording(false);
  };

  const deleteRecording = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
    setRecordedBlob(null);
    setStatus("Deleted.");
  };

  const uploadRecording = async () => {
    if (!recordedBlob) return;

    setStatus("Uploading...");

    // Make a File so your existing uploadFile() works cleanly
    const extension = recordedBlob.type.includes("webm") ? "webm" : "video";
    const filename = `recording-${Date.now()}.${extension}`;
    const file = new File([recordedBlob], filename, { type: recordedBlob.type });

    try {
      const objectKey = await uploadFile(file);
      setStatus(`Upload complete: ${objectKey}`);
    } catch (err) {
      console.error(err);
      setStatus("Upload failed.");
    }
  };

  return (
    
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={startRecording} disabled={isRecording}>
          Start Recording
        </button>
        {isRecording && (
            <div style={{ marginTop: 10, color: "red", fontWeight: "bold" }}>
                🔴 RECORDING — {recordSeconds}s
            </div>
        )}


        <button onClick={stopRecording} disabled={!isRecording}>
          Stop Recording
        </button>
        <div style={{ marginTop: 12 }}>
            <label style={{ display: "block", marginBottom: 4 }}>
                Or upload a video file:
            </label>

            <input
                type="file"
                accept="video/*"
                onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                // Clear old preview URL if it exists
                if (previewUrl) URL.revokeObjectURL(previewUrl);

                setRecordedBlob(file);
                setPreviewUrl(URL.createObjectURL(file));
                setStatus("Video selected from files.");
                }}
            />
            </div>

      </div>

      {status && <p style={{ marginTop: 10 }}>{status}</p>}

      {previewUrl && (
        <div style={{ marginTop: 16 }}>
          <h3>Preview</h3>
          <video src={previewUrl} controls style={{ width: 600, maxWidth: "100%" }} />

          <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
            <button onClick={deleteRecording}>Delete</button>
            <button onClick={uploadRecording}>Upload to S3</button>
          </div>
        </div>
      )}
    </div>
  );
}
