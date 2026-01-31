import React from "react";
import ChatBox from "../components/Chatbox";
import postures from "../assets/images/postures.jpg";

const Home = () => {
  return (
    <div style={{ padding: "2rem" }}>
      <div
        style={{
          display: "flex",
          gap: "2.5rem",
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        {/* LEFT: Landing + Overview */}
        <div style={{ flex: "1 1 340px", maxWidth: "560px" }}>
          <img
            src={postures}
            alt="Healthy posture examples"
            style={{
              width: "100%",
              maxWidth: "420px",
              height: "auto",
              marginBottom: "1.25rem",
              borderRadius: "12px",
            }}
          />

          <h1 style={{ marginBottom: "0.5rem" }}>
            Welcome to PostureMind
          </h1>

          <p style={{ marginTop: 0, fontSize: "1.05rem" }}>
            Your personal AI assistant for posture, technique, and injury-free practice.
          </p>

          <p style={{ marginTop: "0.75rem" }}>
            Whether you’re practicing an instrument, sitting at a desk, or dealing
            with long-term tension, PostureMind helps you understand what good
            posture actually looks and feels like — and how to improve it.
          </p>

          <h3 style={{ marginTop: "1.25rem", marginBottom: "0.5rem" }}>
            How it works
          </h3>

          <ul style={{ marginTop: 0 }}>
            <li>Ask questions about posture, pain, or technique</li>
            <li>Get clear, practical guidance — not generic advice</li>
            <li>Use the Camera tab for visual posture analysis</li>
          </ul>

          <p style={{ marginTop: "1rem", fontWeight: 500 }}>
            Not sure where to start?
          </p>

          <p style={{ marginTop: 0, opacity: 0.85 }}>
            Try asking:
            <br />
            “Is my shoulder posture okay for violin?”
            <br />
            “Why does my lower back hurt when I sit?”
            <br />
            “What should good piano posture feel like?”
          </p>
        </div>

        {/* RIGHT: Chat */}
        <div style={{ flex: "1 1 340px" }}>
          <h2 style={{ marginTop: 0 }}>Ask me anything</h2>
          <p style={{ marginTop: "-0.5rem", marginBottom: "1rem", opacity: 0.8 }}>
            I’ll help you diagnose issues, improve posture, and build better habits.
          </p>
          <ChatBox />
        </div>
      </div>
    </div>
  );
};

export default Home;
