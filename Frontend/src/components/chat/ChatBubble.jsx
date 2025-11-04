import { motion } from "framer-motion";
import ReactMarkdown from 'react-markdown'; // Tambahkan import ini

const ChatBubble = ({ message, colors }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          message.sender === "user"
            ? `${colors.primary} text-white rounded-br-none`
            : "bg-gray-100 text-gray-800 rounded-bl-none"
        }`}
      >
        {/* Gunakan ReactMarkdown untuk menampilkan konten dengan format */}
        <div className="text-sm md:text-base markdown-content">
          <ReactMarkdown>{message.text}</ReactMarkdown>
        </div>

        <p
          className={`text-xs mt-1 opacity-70 text-right ${
            message.sender === "user" ? "text-green-100" : "text-gray-500"
          }`}
        >
          {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </motion.div>
  );
};

export default ChatBubble;