import React from 'react';
import { FiSend, FiSquare } from 'react-icons/fi';

const ChatInput = ({ inputMessage, setInputMessage, handleSendMessage, isLoading, isSending }) => {
  return (
    <div className="border-t border-gray-200 bg-white p-3 md:p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-emerald-500">
          <input
            type="text"
            placeholder="Ketik pesan Anda..."
            className="flex-1 px-3 md:px-4 py-2 text-sm md:text-base focus:outline-none"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={isLoading}
          />
          <div className="border-l border-gray-300 h-full flex items-center px-2">
            <button
              className={`p-2 rounded-md transition-colors ${
                inputMessage.trim() === '' 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-emerald-600 hover:bg-emerald-50'
              } ${isLoading ? 'cursor-not-allowed' : ''}`}
              onClick={handleSendMessage}
              disabled={inputMessage.trim() === '' || isLoading}
            >
              {isSending ? (
                <FiSquare className={`w-4 h-4 md:w-5 md:h-5 ${inputMessage.trim() === '' ? 'text-gray-400' : 'text-emerald-600'}`} />
              ) : (
                <FiSend className={`w-4 h-4 md:w-5 md:h-5 ${inputMessage.trim() === '' ? 'text-gray-400' : 'text-emerald-600'}`} />
              )}
            </button>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500 text-center">
          Q&A Sistem Penjaminan Mutu Untuk Program Studi
        </div>
      </div>
    </div>
  );
};

export default ChatInput;