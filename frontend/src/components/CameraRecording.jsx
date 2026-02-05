import React, { useMemo, useRef, useState, useEffect } from "react";
import { uploadFile } from "../utils/uploadFile";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

export default function CameraRecording({ stream }) {
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [status, setStatus] = useState("");
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [instrument, setInstrument] = useState(null);
  const [instrumentLoaded, setInstrumentLoaded] = useState(false);

  /* ---------- Load default instrument ---------- */
  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setInstrument(null);
        setInstrumentLoaded(true);
        return;
      }

      try {
        const db = getFirestore();
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          setInstrument(snap.data().instrument || null);
        } else {
          setInstrument(null);
        }
      } catch (err) {
        console.error("Failed to load instrument:", err);
        setInstrument(null);
      } finally {
        setInstrumentLoaded(true);
      }
    });

    return () => unsubscribe();
  }, []);



  /* ---------- Media recorder setup ---------- */
  const mimeType = useMemo(() => {
    const candidates = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
    ];
    for (const c of candidates) {
      if (window.MediaRecorder && MediaRecorder.isTypeSupported(c)) return c;
    }
    return "";
  }, []);

  const startRecording = () => {
    if (!stream) {
      setStatus("No camera stream yet. Allow camera permissions first.");
      return;
    }

    setRecordSeconds(0);
    timerRef.current = setInterval(() => {
      setRecordSeconds((s) => s + 1);
    }, 1000);

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
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "video/webm",
        });
        setRecordedBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
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

    recorder.stop();
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

    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      setStatus("You must be logged in to upload a video.");
      return;
    }

    if (!instrument) {
      setStatus("No default instrument set. Please choose one in settings.");
      return;
    }
    if (!videoTitle.trim()) {
      setStatus("Please give your video a title before uploading.");
      return;
    }


    setStatus("Uploading & analyzing...");

    const extension = recordedBlob.type.includes("webm") ? "webm" : "video";
    const filename = `recording-${Date.now()}.${extension}`;
    const file = new File([recordedBlob], filename, {
      type: recordedBlob.type,
    });

    try {
      const { videoKey } = await uploadFile(file, {
        userId: user.uid,
        instrument,
        videoTitle: videoTitle.trim(),
      });

      setStatus("Upload complete. Analyzing posture…");

    } catch (err) {
      console.error(err);
      setStatus("Upload or analysis failed.");
    }
  };

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button onClick={startRecording} disabled={isRecording}>
          Start Recording
        </button>

        {isRecording && (
          <div style={{ color: "red", fontWeight: "bold" }}>
            🔴 RECORDING — {recordSeconds}s
          </div>
        )}

        <button onClick={stopRecording} disabled={!isRecording}>
          Stop Recording
        </button>
      </div>

      <div style={{ marginTop: 12 }}>
        <label>Or upload a video file:</label>
        <input
          type="file"
          accept="video/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setRecordedBlob(file);
            setPreviewUrl(URL.createObjectURL(file));
            setStatus("Video selected from files.");
          }}
        />
      </div>

      {status && <p>{status}</p>}

      {previewUrl && (
        <div style={{ marginTop: 16 }}>
          <h3>Preview</h3>
          <video src={previewUrl} controls style={{ width: 600, maxWidth: "100%" }} />
          <div style={{ marginTop: 12 }}>
            <label style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>
              Video title
            </label>

            <input
              type="text"
              placeholder="e.g. Mozart practice – Feb 4"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid #ccc",
              }}
            />

            <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
              Titles must be unique. A timestamp will be added automatically.
            </div>
          </div>


          <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
            <button onClick={deleteRecording}>Delete</button>
            <button onClick={uploadRecording}>Upload</button>
          </div>
        </div>
      )}
    </div>
  );
}
