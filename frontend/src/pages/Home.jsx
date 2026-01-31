import React from "react";
import ChatBox from "../components/Chatbox";
import postures from "../assets/images/postures.jpg";

const Home = () => {
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
          gap: 40,
        }}
      >
        {/* HERO SECTION */}
        <div
          style={{
            background: "#fff",
            borderRadius: 20,
            padding: "28px 32px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
            display: "flex",
            gap: 32,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {/* Image */}
          <img
            src={postures}
            alt="Healthy posture examples"
            style={{
              width: "100%",
              maxWidth: 420,
              borderRadius: 16,
              objectFit: "cover",
            }}
          />

          {/* Text */}
          <div style={{ flex: 1, minWidth: 280 }}>
            <h1 style={{ marginBottom: 8 }}>
              Welcome to PostureMind
            </h1>

            <p
              style={{
                fontSize: "1.1rem",
                color: "#555",
                marginTop: 0,
              }}
            >
              Your personal AI assistant for posture, technique,
              and injury-free practice.
            </p>

            <p style={{ marginTop: 12 }}>
              Whether you’re practicing an instrument, sitting at
              a desk, or dealing with long-term tension,
              PostureMind helps you understand what good posture
              actually looks and feels like, and how to improve
              it.
            </p>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.2fr",
            gap: 32,
          }}
        >
          {/* LEFT: HOW IT WORKS */}
          <div
            style={{
              background: "#fff",
              borderRadius: 20,
              padding: 24,
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
            }}
          >
            <h2 style={{ marginTop: 0 }}>How it works</h2>

            <ul style={{ paddingLeft: 20, lineHeight: 1.6 }}>
              <li>
                Ask questions about posture, pain, or technique
              </li>
              <li>
                Get clear, practical guidance, not just generic advice
              </li>
              <li>
                Use the <strong>Camera</strong> tab for visual
                posture analysis
              </li>
            </ul>

            <p style={{ marginTop: 20, fontWeight: 600 }}>
              Not sure where to start?
            </p>

            <div
              style={{
                background: "#f3f5f9",
                borderRadius: 12,
                padding: 16,
                fontSize: "0.95rem",
                lineHeight: 1.6,
              }}
            >
              <div>“Is my shoulder posture okay for violin?”</div>
              <div>
                “Why does my lower back hurt when I sit?”
              </div>
              <div>
                “What should good piano posture feel like?”
              </div>
            </div>
          </div>

          {/* RIGHT: CHAT */}
          <div
            style={{
              background: "#fff",
              borderRadius: 20,
              padding: 24,
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Ask me anything</h2>

            <p
              style={{
                marginTop: -6,
                marginBottom: 16,
                color: "#666",
                fontSize: "0.95rem",
              }}
            >
              I’ll help you diagnose issues, improve posture, and
              build better habits.
            </p>

            <ChatBox />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
