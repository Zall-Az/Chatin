// components/Chat/ChatBody.jsx
import { useState, useRef, useEffect } from "react";
import ChatBubble from "./ChatBubble";
import ChatInput from "./ChatInput";

const ChatBody = ({ colors }) => {
  // ▼ Copy-paste state dan logika dari Chat.jsx ▼
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: "Halo! Saya asisten AI...", 
      sender: "bot" 
    }
  ]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* Daftar pesan */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <ChatBubble 
            key={msg.id} 
            message={msg} 
            colors={colors} 
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput 
        colors={colors} 
        setMessages={setMessages} 
      />
    </div>
  );
};

export default ChatBody;