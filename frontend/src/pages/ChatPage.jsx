import ChatBox from "../components/Chatbox";

function ChatPage() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>AI Music Assistant</h1>
      <p>Ask me anything about instruments, posture, or playing techniques!</p>
      <ChatBox />
    </div>
  );
}

export default ChatPage;
