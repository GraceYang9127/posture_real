import { useState } from "react";

function ChatBox() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessages([...newMessages, { role: "assistant", content: data.reply }]);
      } else {
        setMessages([...newMessages, { role: "assistant", content: "Error: failed to get response" }]);
      }
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <div style={{
      border: "1px solid #ccc",
      padding: "1rem",
      borderRadius: "8px",
      maxWidth: "400px",
      marginTop: "2rem"
    }}>
      <div style={{
        height: "200px",
        overflowY: "auto",
        marginBottom: "1rem",
        background: "#f9f9f9",
        padding: "0.5rem",
        borderRadius: "4px"
      }}>
        {messages.map((msg, idx) => (
          <p key={idx} style={{ textAlign: msg.role === "user" ? "right" : "left" }}>
            <strong>{msg.role === "user" ? "You:" : "AI:"}</strong> {msg.content}
          </p>
        ))}
        {loading && <p>AI is typing...</p>}
      </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ flex: 1 }}
          placeholder="Type your question..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default ChatBox;
