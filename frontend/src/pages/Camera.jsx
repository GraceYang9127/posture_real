import React, { useState } from "react";
import LivePose from "../components/LivePose";
import CameraRecording from "../components/CameraRecording";

export default function Camera() {
  const [stream, setStream] = useState(null);

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
        background:
          "linear-gradient(180deg, #f7f8fb 0%, #eef1f6 100%)",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1200,
          display: "flex",
          flexDirection: "column",
          gap: 32,
        }}
      >
        {/* Header */}
        <div>
          <h1 style={{ marginBottom: 6 }}>Camera</h1>
          <p style={{ color: "#666", margin: 0 }}>
            Analyze posture in real time or upload a video
          </p>
        </div>

        {/* Main content */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            gap: 32,
          }}
        >
          {/* Live Camera */}
          <div
            style={{
              background:
                "linear-gradient(180deg, #111 0%, #000 100%)",
              borderRadius: 20,
              padding: 16,
              boxShadow:
                "0 20px 40px rgba(0,0,0,0.25)",
            }}
          >
            <div
              style={{
                borderRadius: 14,
                overflow: "hidden",
                background: "#000",
              }}
            >
              <LivePose onStream={setStream} />
            </div>

            <div
              style={{
                marginTop: 12,
                color: "#aaa",
                fontSize: 14,
                textAlign: "center",
              }}
            >
              Live posture detection
            </div>
          </div>

          {/* Controls */}
          <div
            style={{
              background: "#fff",
              borderRadius: 20,
              padding: 20,
              boxShadow:
                "0 10px 30px rgba(0,0,0,0.1)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div>
              <h2 style={{ marginBottom: 4 }}>
                Recording & Upload
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  color: "#666",
                }}
              >
                Record from your camera or upload an existing
                video
              </p>
            </div>

            <CameraRecording stream={stream} />
          </div>
        </div>
      </div>
    </div>
  );
}
