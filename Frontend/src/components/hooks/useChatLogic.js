import { useState, useRef, useEffect } from 'react';
import { useAuth } from './useAuth';

const API_URL = "http://localhost:8000";

const useChatLogic = () => {
  const { currentUser, loading: authLoading } = useAuth();
  
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      content: 'Hai! Ada yang bisa aku bantu?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [typingIndex, setTypingIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const messageEndRef = useRef(null);
  const bottomRef = useRef(null);


  // Enhanced chat history
  const [currentChatId, setCurrentChatId] = useState(null);
  const [realChatHistory, setRealChatHistory] = useState({
    today: [],
    yesterday: [],
    last7days: [],
    older: []
  });
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [needsHistoryRefresh, setNeedsHistoryRefresh] = useState(false);

  const userId = currentUser?.uid || null;
  const isLoggedIn = !!currentUser;

  // 🔥 DEBUG: User ID debugging
  useEffect(() => {
    if (currentUser) {
      console.log('🔍 FINAL USER DEBUG INFO:');
      console.log('  UID:', currentUser.uid);
      console.log('  Email:', currentUser.email);
      console.log('  🎯 This is the CORRECT User ID that will be used');
      console.log('  Test URL:', `${API_URL}/api/chat/history/${currentUser.uid}`);
    }
  }, [currentUser]);

  // Load chat history from backend
  const loadChatHistory = async () => {
    if (!userId) {
      console.log('⚠️ No userId - skipping chat history load');
      setRealChatHistory({ today: [], yesterday: [], last7days: [], older: [] });
      return;
    }

    try {
      setIsLoadingHistory(true);
      const url = `${API_URL}/api/chat/history/${userId}`;
      
      console.log('🔄 LOADING CHAT HISTORY:');
      console.log('  URL:', url);
      console.log('  User ID:', userId);
      console.log('  User Email:', currentUser?.email);
      
      const response = await fetch(url);
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      if (response.ok) {
        const history = await response.json();
        console.log('✅ Raw backend response:', history);
        
        setRealChatHistory(history);
        
        // Detailed logging
        const totalChats = Object.values(history).flat().length;
        console.log('📊 Chat history summary:', {
          today: history.today?.length || 0,
          yesterday: history.yesterday?.length || 0,
          last7days: history.last7days?.length || 0,
          older: history.older?.length || 0,
          total: totalChats
        });
        
        if (totalChats > 0) {
          console.log('🎉 SUCCESS! Chat history loaded successfully!');
        } else {
          console.log('⚠️ No chats found - but this is normal for new users');
        }
        
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to load chat history:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
      }
    } catch (error) {
      console.error('❌ Network error loading chat history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load messages from specific chat
  const loadChatMessages = async (chatId) => {
    if (!userId || !chatId) return;

    try {
      console.log('📖 Loading messages for chat:', chatId);
      const response = await fetch(`${API_URL}/api/chat/${chatId}/messages?user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        const formattedMessages = data.messages.map(msg => ({
          type: msg.role === 'user' ? 'user' : 'bot',
          content: msg.content,
          timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        setMessages(formattedMessages);
        setCurrentChatId(chatId);
        console.log('✅ Chat messages loaded:', chatId, `(${formattedMessages.length} messages)`);
      } else {
        console.error('❌ Failed to load chat messages:', response.status);
      }
    } catch (error) {
      console.error('❌ Error loading chat messages:', error);
    }
  };

  // Load chat history when user changes
  useEffect(() => {
    if (!authLoading) {
      if (userId) {
        console.log('🔐 User logged in:', currentUser.email);
        console.log('🚀 Starting to load chat history...');
        loadChatHistory();
      } else {
        console.log('👤 Guest user - no chat history');
        setRealChatHistory({ today: [], yesterday: [], last7days: [], older: [] });
        setCurrentChatId(null);
      }
    }
  }, [userId, authLoading]);

  // Auto-refresh history ketika ada perubahan
  useEffect(() => {
    if (needsHistoryRefresh && userId) {
      const refreshTimer = setTimeout(() => {
        console.log('🔄 Auto-refreshing chat history...');
        loadChatHistory();
        setNeedsHistoryRefresh(false);
      }, 2000);

      return () => clearTimeout(refreshTimer);
    }
  }, [needsHistoryRefresh, userId]);

  // Auto-scroll ke pesan terbaru
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, displayedText]);

  // Animasi ketikan bot
  useEffect(() => {
    if (typingIndex >= 0 && typingIndex < messages.length) {
      const message = messages[typingIndex];
      if (message.type === 'bot') {
        if (displayedText.length < message.content.length) {
          const timer = setTimeout(() => {
            setDisplayedText(message.content.substring(0, displayedText.length + 1));
          }, 5);
          return () => clearTimeout(timer);
        } else {
          setTypingIndex(-1);
        }
      }
    }
  }, [typingIndex, displayedText, messages]);

  // Get bot response
  const getBotResponse = async (userInput) => {
    try {
      const requestBody = { 
        user_message: userInput,
        format_response: true
      };

      if (userId) {
        requestBody.user_id = userId;
        if (currentChatId) {
          requestBody.chat_id = currentChatId;
        }
      }

      console.log('🚀 SENDING REQUEST TO BACKEND:');
      console.log('  User ID:', userId);
      console.log('  Request Body:', requestBody);
      console.log('  URL:', `${API_URL}/ask/`);

      const response = await fetch(`${API_URL}/ask/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📨 Backend response:', data);
      
      // Update current chat ID jika dapat dari backend
      if (data.chat_id && !currentChatId && userId) {
        setCurrentChatId(data.chat_id);
        setNeedsHistoryRefresh(true);
        console.log('✅ New chat session created:', data.chat_id);
        console.log('🔍 Should be saved under user:', userId);
      }
      
      return data.response;
    } catch (error) {
      console.error('❌ Error in getBotResponse:', error);
      return 'Maaf, terjadi kesalahan saat menghubungi server. Silakan coba lagi nanti.';
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (inputMessage.trim() === '' || isLoading) return;

    const userMessage = {
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    const userMessageText = inputMessage;
    setInputMessage('');
    setIsSending(true);
    setIsLoading(true);

    console.log('💬 User message sent:', userMessageText);

    setTimeout(() => {
      setIsSending(false);

      const loadingMessage = {
        type: 'bot',
        content: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isLoading: true
      };
      setMessages(prev => [...prev, loadingMessage]);

      getBotResponse(userMessageText).then(response => {
        setIsLoading(false);

        setMessages(prev => {
          const newMessages = prev.filter(msg => !msg.isLoading);
          const botMessage = {
            type: 'bot',
            content: response,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          const result = [...newMessages, botMessage];
          setTypingIndex(result.length - 1);
          setDisplayedText('');
          return result;
        });

        // 🔥 PENTING: Refresh history setelah bot response
        if (userId) {
          setTimeout(() => {
            console.log('🔄 Refreshing chat history after bot response...');
            loadChatHistory();
          }, 1500);
        }

      }).catch(error => {
        setIsLoading(false);
        console.error("❌ Error getting bot response:", error);
        
        setMessages(prev => {
          const newMessages = prev.filter(msg => !msg.isLoading);
          const errorMessage = {
            type: 'bot',
            content: 'Maaf, terjadi kesalahan saat menghubungi server. Silakan coba lagi nanti.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          const result = [...newMessages, errorMessage];
          setTypingIndex(result.length - 1);
          setDisplayedText('');
          return result;
        });
      });
    }, 500);
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Start new chat
  const startNewChat = () => {
    const initialBotMessage = {
      type: 'bot',
      content: 'Hai! Ada yang bisa ChatinAja bantu?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([initialBotMessage]);
    setCurrentChatId(null);
    setTypingIndex(0);
    setDisplayedText('');
    
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }

    if (userId) {
      console.log('🆕 New chat started for user:', currentUser.email);
    } else {
      console.log('👤 New guest chat started');
    }
  };

  // Continue chat from history
  const continueChat = (chatId) => {
    if (!userId) {
      console.log('⚠️ Cannot continue chat - user not logged in');
      return;
    }
    
    loadChatMessages(chatId);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
    console.log('🔄 Continuing chat:', chatId);
  };

  // Filter chat history
  const filteredChatHistory = chatHistory.filter(chat =>
    chat.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get user display info
  const getUserDisplayInfo = () => {
    if (!currentUser) return null;
    
    return {
      name: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
      email: currentUser.email,
      photoURL: currentUser.photoURL,
      uid: currentUser.uid
    };
  };

  // Manual refresh function
  const refreshChatHistory = async () => {
    if (userId) {
      console.log('🔄 Manual refresh chat history triggered...');
      await loadChatHistory();
    } else {
      console.log('⚠️ Cannot refresh - user not logged in');
    }
  };

  // Debug function
  const debugChatHistory = () => {
    console.log('🐛 DEBUG Chat History State:', {
      userId,
      currentUser: currentUser?.email,
      realChatHistory,
      isLoadingHistory,
      currentChatId,
      needsHistoryRefresh,
      totalChats: Object.values(realChatHistory).flat().length
    });
  };

  return {
    // State original
    messages,
    setMessages,
    inputMessage,
    setInputMessage,
    isMenuOpen,
    setIsMenuOpen,
    isSidebarOpen,
    setIsSidebarOpen,
    chatHistory,
    setChatHistory,
    searchQuery,
    setSearchQuery,
    isLoading,
    setIsLoading,
    isSending,
    setIsSending,
    typingIndex,
    setTypingIndex,
    displayedText,
    setDisplayedText,
    messageEndRef,
    
    // Fungsi original
    handleSendMessage,
    toggleSidebar,
    startNewChat,
    filteredChatHistory,

    // Enhanced state dan fungsi
    currentChatId,
    userId,
    realChatHistory,
    isLoadingHistory,
    loadChatHistory,
    continueChat,
    
    // Auth related
    currentUser,
    authLoading,
    isLoggedIn,
    getUserDisplayInfo,

    // Debug functions
    refreshChatHistory,
    debugChatHistory,
    needsHistoryRefresh
  };
};

export default useChatLogic;