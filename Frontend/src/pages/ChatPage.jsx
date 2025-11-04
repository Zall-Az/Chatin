// src/pages/ChatPage.jsx - CLEAN VERSION (NO DEBUG)
import React, { useEffect } from 'react';
import Sidebar from '../components/chat/Sidebar';
import ChatHeader from '../components/chat/ChatHeader';
import MessageList from '../components/chat/MessageList';
import ChatInput from '../components/chat/ChatInput';
import useChatLogic from '../components/hooks/useChatLogic';
import { FiArrowLeft, FiArrowRight, FiMenu, FiX } from 'react-icons/fi';

const ChatinPage = () => {
  const {
    // Basic chat states
    messages,
    inputMessage,
    setInputMessage,
    handleSendMessage,
    isSidebarOpen,
    toggleSidebar,
    isLoading,
    typingIndex,
    displayedText,
    messageEndRef,
    chatHistory,
    searchQuery,
    setSearchQuery,
    startNewChat,
    isSending,
    
    // Enhanced chat history states
    realChatHistory,
    continueChat,
    isLoadingHistory,
    
    // Debug functions (keep for console logging only)
    refreshChatHistory,
    debugChatHistory,
    needsHistoryRefresh,
    userId,
    currentUser
  } = useChatLogic();

  // Keep minimal console logging for development (optional)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('ChatPage - Total chats:', Object.values(realChatHistory).flat().length);
    }
  }, [realChatHistory]);

  // Keep keyboard shortcuts for development only
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const handleKeyPress = (e) => {
        // Ctrl + Shift + D untuk debug
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
          e.preventDefault();
          if (debugChatHistory) {
            debugChatHistory();
          }
        }
        // Ctrl + Shift + R untuk refresh history
        if (e.ctrlKey && e.shiftKey && e.key === 'R') {
          e.preventDefault();
          if (refreshChatHistory) {
            refreshChatHistory();
          }
        }
      };

      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [debugChatHistory, refreshChatHistory]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* REMOVED: Debug floating panel */}
      
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative">
        {/* Mobile Sidebar Toggle Button */}
        <button 
          className="md:hidden absolute z-10 top-4 left-4 p-2 bg-emerald-600 rounded-full text-white shadow-md"
          onClick={toggleSidebar}
        >
          {isSidebarOpen ? <FiX size={18} /> : <FiMenu size={18} />}
        </button>
        
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
            onClick={toggleSidebar}
          ></div>
        )}

        {/* Sidebar Component */}
        <div 
          className={`fixed md:relative z-30 h-full bg-white border-r border-gray-200 transition-all duration-300 ease-in-out overflow-hidden ${
            isSidebarOpen ? 'left-0' : '-left-full md:left-0'
          } ${isSidebarOpen ? 'w-64' : 'w-0 md:w-0'}`}
        >
          <Sidebar 
            // Basic props
            isSidebarOpen={isSidebarOpen}
            chatHistory={chatHistory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            startNewChat={startNewChat}
            toggleSidebar={toggleSidebar}
            
            // Enhanced props untuk real chat history
            realChatHistory={realChatHistory}
            continueChat={continueChat}
            isLoadingHistory={isLoadingHistory}
            
            // Debug props (keep for functionality but won't show UI)
            refreshChatHistory={refreshChatHistory}
            debugChatHistory={debugChatHistory}
          />
        </div>

        {/* Desktop Sidebar Toggle Button */}
        <button 
          className="hidden md:flex absolute z-10 h-12 w-6 bg-emerald-600 items-center justify-center text-white rounded-r-md top-1/2 transform -translate-y-1/2 hover:bg-emerald-700 transition-all duration-300"
          style={{ 
            left: isSidebarOpen ? '256px' : '0',
            transition: 'left 0.3s ease-in-out'
          }}
          onClick={toggleSidebar}
        >
          {isSidebarOpen ? <FiArrowLeft size={16} /> : <FiArrowRight size={16} />}
        </button>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-50 md:ml-0">
          <div className="flex-1 overflow-y-auto p-3 md:p-4">
            <div className="max-w-3xl mx-auto pt-14 md:pt-0">
              {/* Chat Header with Welcome Message */}
              <ChatHeader />

              {/* Message List */}
              <MessageList 
                messages={messages}
                typingIndex={typingIndex}
                displayedText={displayedText}
                messageEndRef={messageEndRef}
              />
            </div>
          </div>

          {/* Chat Input Area */}
          <ChatInput 
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
            handleSendMessage={handleSendMessage}
            isLoading={isLoading}
            isSending={isSending}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatinPage;