import React from 'react';
import MessageItem from './MessageItem';

const MessageList = ({ messages, typingIndex, displayedText, messageEndRef }) => {
  return (
    <div className="space-y-4">
      {messages.map((message, index) => (
        <MessageItem 
          key={index}
          message={message}
          isTyping={index === typingIndex}
          displayedText={index === typingIndex ? displayedText : message.content}
        />
      ))}
      <div ref={messageEndRef} />
    </div>
  );
};

export default MessageList;