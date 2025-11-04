import React from 'react';
import LoadingDots from './LoadingDots';
import ReactMarkdown from 'react-markdown';
// 1. Impor plugin GFM
import remarkGfm from 'remark-gfm';

const MessageItem = ({ message, isTyping, displayedText }) => {
  // 2. Definisikan komponen kustom untuk mengontrol tampilan Markdown
  const markdownComponents = {
    // Untuk daftar poin-poin (tanda hubung -)
    ul: ({ node, ...props }) => (
      <ul className="list-disc pl-5 my-2" {...props} />
    ),
    // Untuk daftar bernomor (1., 2.)
    ol: ({ node, ...props }) => (
      <ol className="list-decimal pl-5 my-2" {...props} />
    ),
    // Agar tidak ada jarak vertikal antar paragraf di dalam satu pesan
    p: ({ node, ...props }) => <p className="mb-1" {...props} />,
  };

  return (
    <div 
      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div 
        className={`max-w-[85%] sm:max-w-[75%] rounded-lg px-3 py-2 md:px-4 md:py-3 ${
          message.type === 'user' 
            ? 'bg-emerald-600 text-white rounded-br-none' 
            : 'bg-white text-gray-800 shadow-sm rounded-bl-none'
        }`}
      >
        {message.isLoading ? (
          <LoadingDots />
        ) : (
          <div className="text-sm text-left">
            {/* PERUBAHAN: Judul statis "Chatbot Pintar" sudah dihapus */}
            <ReactMarkdown
              components={markdownComponents}
              remarkPlugins={[remarkGfm]}
            >
              {isTyping ? displayedText : message.content}
            </ReactMarkdown>
          </div>
        )}
        <div 
          className={`text-xs mt-1 ${
            message.type === 'user' ? 'text-emerald-100 text-right' : 'text-gray-500'
          }`}
        >
          {message.timestamp}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
