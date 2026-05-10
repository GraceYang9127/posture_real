import { useState, useRef, useEffect } from "react";
import { useChat } from "../context/ChatContext";

function ChatBox() {
  const { messages, setMessages } = useChat();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

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
        { role: "assistant", content: "Network error. Please try again." },
      ]);
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        background: "#ffffff",
        overflow: "hidden",
      }}
    >
      {/* Messages */}
      <div
        style={{
          height: 320,
          overflowY: "auto",
          padding: "12px 14px",
          background: "#f7f8fa",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {messages.length === 0 && !loading && (
          <p
            style={{
              color: "#888",
              fontSize: 13,
              margin: "auto",
              textAlign: "center",
            }}
          >
            Ask a question about posture, technique, or your analysis.
          </p>
        )}

        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent: isUser ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "78%",
                  padding: "8px 12px",
                  borderRadius: 14,
                  borderBottomRightRadius: isUser ? 4 : 14,
                  borderBottomLeftRadius: isUser ? 14 : 4,
                  background: isUser ? "#3b82f6" : "#ffffff",
                  color: isUser ? "#ffffff" : "#1f2937",
                  border: isUser ? "none" : "1px solid #e5e7eb",
                  fontSize: 14,
                  lineHeight: 1.45,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  boxShadow: "0 1px 1px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    opacity: 0.7,
                    marginBottom: 2,
                  }}
                >
                  {isUser ? "You" : "AI"}
                </div>
                {msg.content}
              </div>
            </div>
          );
        })}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                padding: "8px 12px",
                borderRadius: 14,
                borderBottomLeftRadius: 4,
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                fontSize: 14,
                fontStyle: "italic",
                color: "#666",
              }}
            >
              AI is typing…
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: 10,
          borderTop: "1px solid #e5e7eb",
          background: "#ffffff",
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question..."
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
          style={{
            flex: 1,
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: 8,
            fontSize: 14,
            outline: "none",
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{
            padding: "8px 16px",
            border: "none",
            borderRadius: 8,
            background:
              loading || !input.trim() ? "#9ca3af" : "#3b82f6",
            color: "#fff",
            fontWeight: 600,
            fontSize: 14,
            cursor:
              loading || !input.trim() ? "not-allowed" : "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatBox;
