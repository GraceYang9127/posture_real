import { useState, useRef, useEffect } from "react";
import { useChat } from "../context/ChatContext";

function ChatBox() {
  const { messages, setMessages } = useChat(); // 🔑 global chat state
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input };
    const newMessages = [...messages, userMessage];

    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: newMessages }),
        }
      );

      const data = await response.json();

      if (response.ok && data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry — something went wrong getting a response.",
          },
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Network error. Please try again.",
        },
      ]);
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: "1rem",
        borderRadius: "8px",
        maxWidth: "400px",
        marginTop: "2rem",
        background: "#ffffff",
      }}
    >
      {/* Messages */}
      <div
        style={{
          height: "200px",
          overflowY: "auto",
          marginBottom: "1rem",
          background: "#f9f9f9",
          padding: "0.5rem",
          borderRadius: "4px",
        }}
      >
        {messages.length === 0 && (
          <p style={{ color: "#777", fontSize: 13 }}>
            Ask a question about posture, technique, or your analysis.
          </p>
        )}

        {messages.map((msg, idx) => (
          <p
            key={idx}
            style={{
              textAlign: msg.role === "user" ? "right" : "left",
              margin: "6px 0",
            }}
          >
            <strong>{msg.role === "user" ? "You:" : "AI:"}</strong>{" "}
            {msg.content}
          </p>
        ))}

        {loading && (
          <p style={{ fontStyle: "italic", color: "#666" }}>
            AI is typing…
          </p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ flex: 1 }}
          placeholder="Type your question..."
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
        />
        <button onClick={sendMessage} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatBox;
