import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getAuth } from "firebase/auth";

export default function Analytics() {
  const [videoUrl, setVideoUrl] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [status, setStatus] = useState("Loading...");

  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const videoKey = params.get("videoKey");
  const analysisKey = params.get("analysisKey");

  useEffect(() => {
    const loadAnalytics = async () => {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        setStatus("Not authenticated.");
        return;
      }

      try {
        const videoRes = await fetch("http://localhost:5000/api/download-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.uid, key: videoKey }),
        });
        const videoData = await videoRes.json();
        setVideoUrl(videoData.downloadUrl);

        const analysisRes = await fetch("http://localhost:5000/api/download-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.uid, key: analysisKey }),
        });
        const analysisUrlData = await analysisRes.json();

        const analysisJsonRes = await fetch(analysisUrlData.downloadUrl);

        if (!analysisJsonRes.ok) {
          throw new Error("Analysis file not found");
        }

        const analysisJson = await analysisJsonRes.json();


        setAnalysis(analysisJson);
        setStatus("");
      } catch (err) {
        console.error(err);
        setStatus("Failed to load analytics.");
      }
    };

    if (videoKey && analysisKey) loadAnalytics();
    else setStatus("Missing video or analysis reference.");
  }, [videoKey, analysisKey]);

  if (!analysis || !analysis.metrics) {
    return (
      <div style={{ padding: 32, fontSize: 16, color: "#666" }}>
        Loading analysis…
      </div>
    );
  }

  const { metrics, feedback, instrument, overall_score } = analysis;


  return (
    <div
      style={{
        padding: 32,
        maxWidth: 1100,
        margin: "0 auto",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>Posture Analysis</h1>
        <p style={{ marginTop: 6, color: "#666" }}>
          Instrument: <strong>{instrument || "Unknown"}</strong>
        </p>
      </div>

      {/* Main content */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 24,
          alignItems: "start",
        }}
      >
        {/* Video */}
        <div
          style={{
            background: "#fafafa",
            padding: 16,
            borderRadius: 12,
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <video
            src={videoUrl}
            controls
            style={{ width: "100%", borderRadius: 8 }}
          />
        </div>

        {/* Summary metrics */}
        <div
          style={{
            background: "#ffffff",
            padding: 20,
            borderRadius: 12,
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Summary</h3>

          <Metric
            label="Overall posture score"
            value={`${overall_score}/100`}
          />

          <Metric
            label="Forward head angle (avg)"
            value={`${metrics.head_forward_mean_deg.toFixed(1)}°`}
          />

          <Metric
            label="Torso lean angle (avg)"
            value={`${metrics.torso_lean_mean_deg.toFixed(1)}°`}
          />

          <Metric
            label="Posture stability"
            value={metrics.head_stability_variance.toFixed(3)}
          />

          <Metric
            label="Pose detection coverage"
            value={`${Math.round(metrics.pose_coverage * 100)}%`}
          />
        </div>
        </div>

      {/* Feedback */}
      <div
        style={{
          marginTop: 32,
          background: "#ffffff",
          padding: 24,
          borderRadius: 12,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Actionable Feedback</h3>
        <ul style={{ paddingLeft: 20, lineHeight: 1.6 }}>
          {feedback.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 13, color: "#777" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 600 }}>{value}</div>
    </div>
  );
}
