import React, { useEffect, useState, useRef } from "react";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function History() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("Loading...");
  const navigate = useNavigate();
  const seenAnalysisKeysRef = useRef(new Set());

  useEffect(() => {
    const run = async () => {
      const user = getAuth().currentUser;
      if (!user) {
        setStatus("Not authenticated.");
        return;
      }

      try {
        const res = await fetch("http://localhost:5000/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.uid }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load");

        setRows(data);
        setStatus("");
      } catch (e) {
        console.error(e);
        setStatus("Failed to load history.");
      }
    };

    run();
  }, []);

  if (status) return <div style={{ padding: 32, color: "#666" }}>{status}</div>;

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginTop: 0 }}>Video History</h1>
      <p style={{ color: "#666", marginTop: 6 }}>
        Track your posture score over time.
      </p>

      {rows.length === 0 ? (
        <div style={{ marginTop: 20, color: "#666" }}>
          No analyses found yet. Upload a video to get started.
        </div>
      ) : (
        <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
          {rows.map((r, idx) => (
            <div
              key={idx}
              onClick={() =>
                navigate(
                  `/analytics?videoKey=${encodeURIComponent(r.videoKey)}&analysisKey=${encodeURIComponent(r.analysisKey)}`
                )
              }
              style={{
                cursor: "pointer",
                background: "#fff",
                borderRadius: 12,
                padding: 16,
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>
                  {r.createdAt ? new Date(r.createdAt).toLocaleString() : "Unknown date"}
                </div>
                <div style={{ color: "#666", fontSize: 13, marginTop: 4 }}>
                  Instrument: {r.instrument || "Unknown"}{" "}
                  {typeof r.poseCoverage === "number"
                    ? `• Coverage: ${Math.round(r.poseCoverage * 100)}%`
                    : ""}
                </div>
              </div>

              <div style={{ fontWeight: 700 }}>
                {r.title || "Untitled video"}
              </div>


              <div style={{ fontSize: 22, fontWeight: 800 }}>
                {typeof r.overallScore === "number" ? `${r.overallScore}` : "—"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
