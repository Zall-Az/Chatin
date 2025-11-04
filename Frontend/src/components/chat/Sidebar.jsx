import React, { useState, useEffect } from 'react';
import { 
  FiPlus, FiSearch, FiMessageSquare, FiUser,
  FiX, FiLogOut, FiClock, FiCalendar
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '../Context/ToastContext';
import chatinLogo from "../../assets/chatin.png";

const Sidebar = ({ 
  isSidebarOpen, 
  chatHistory, 
  searchQuery, 
  setSearchQuery, 
  startNewChat, 
  toggleSidebar,
  realChatHistory = { today: [], yesterday: [], last7days: [], older: [] },
  continueChat,
  isLoadingHistory = false,
  refreshChatHistory,
  debugChatHistory
}) => {
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null); // <-- DIUBAH (1): State baru ditambahkan
  const navigate = useNavigate();
  const toast = useToast();

  // Gabungkan chat history dengan prioritas real history
  const getAllChats = () => {
    const allChats = [];
    
    if (realChatHistory.today?.length > 0) {
      allChats.push(...realChatHistory.today.map(chat => ({
        ...chat,
        category: 'Hari Ini',
        isReal: true
      })));
    }
    
    if (realChatHistory.yesterday?.length > 0) {
      allChats.push(...realChatHistory.yesterday.map(chat => ({
        ...chat,
        category: 'Kemarin',
        isReal: true
      })));
    }
    
    if (realChatHistory.last7days?.length > 0) {
      allChats.push(...realChatHistory.last7days.map(chat => ({
        ...chat,
        category: '7 Hari Terakhir',
        isReal: true
      })));
    }
    
    if (allChats.length === 0 && chatHistory?.length > 0) {
      allChats.push(...chatHistory.map(chat => ({
        title: chat,
        isReal: false,
        category: 'Chat History'
      })));
    }
    
    return allChats;
  };

  // Filter chat history based on search query
  const filteredChatHistory = getAllChats().filter(chat => 
    chat.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.toLowerCase?.().includes(searchQuery.toLowerCase())
  );

  // Group filtered chats by category
  const groupedChats = filteredChatHistory.reduce((groups, chat) => {
    const category = chat.category || 'Other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(chat);
    return groups;
  }, {});

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const totalChats = getAllChats().length;
      console.log('Sidebar - Total chats loaded:', totalChats);
    }
  }, [realChatHistory]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const toggleDropdown = () => {
    setShowDropdown((prev) => !prev);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      if (toast && toast.success) {
        toast.success('Logout berhasil!');
      }
      setShowDropdown(false);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      if (toast && toast.error) {
        toast.error('Terjadi kesalahan saat logout.');
      }
    }
  };

  const getInitials = () => {
    if (!user) return '';
    
    if (user.displayName) {
      return user.displayName
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    } else {
      const email = user.email || '';
      const username = email.split('@')[0];
      if (username.length >= 2) {
        return username.substring(0, 2).toUpperCase();
      } else {
        return username.toUpperCase();
      }
    }
  };

  // <-- DIUBAH (2): Fungsi handleChatClick diperbarui
  const handleChatClick = (chat) => {
    setActiveChatId(chat.id); // Set chat yang aktif

    if (chat.isReal && chat.id && continueChat) {
      continueChat(chat.id);
    } else {
      startNewChat();
    }
    
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Hari Ini':
        return <FiClock size={12} className="text-green-500" />;
      case 'Kemarin':
        return <FiCalendar size={12} className="text-blue-500" />;
      case '7 Hari Terakhir':
        return <FiCalendar size={12} className="text-orange-500" />;
      default:
        return <FiMessageSquare size={12} className="text-gray-500" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with Logo and Close Button for Mobile */}
      <div className="flex justify-between items-center p-3">
        <a href="/" className="flex items-center ml-14">
          <img src={chatinLogo} alt="Chatin Logo" className="h-7 w-auto" />
        </a>
        <div className="flex items-center gap-2">
          <button 
            className="md:hidden text-gray-500 hover:text-gray-700" 
            onClick={toggleSidebar}
          >
            <FiX size={20} />
          </button>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="px-3 pb-3">
        <button 
          // <-- DIUBAH (3): onClick untuk New Chat diperbarui
          onClick={() => {
            startNewChat();
            setActiveChatId(null); // Reset highlight saat buat chat baru
          }}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-md text-sm transition-colors"
        >
          <FiPlus size={16} />
          New Chat
        </button>
      </div>

      {/* Chat History with Search */}
      <div className="px-3 pb-3 flex-grow overflow-y-auto">
        <div className="relative mb-2">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            placeholder="Search chats..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:border-emerald-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {isLoadingHistory && (
          <div className="flex items-center justify-center py-4">
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-emerald-600"></div>
              Loading history...
            </div>
          </div>
        )}

        <div className="space-y-3">
          {Object.keys(groupedChats).length === 0 && !isLoadingHistory ? (
            <div className="text-xs text-gray-500 text-center py-4">
              {user ? (
                <div>
                  <div>No chat history yet</div>
                  <div className="mt-2 text-gray-400">
                    Send a message to create your first chat!
                  </div>
                </div>
              ) : (
                'Login to see chat history'
              )}
            </div>
          ) : (
            Object.entries(groupedChats).map(([category, chats]) => (
              <div key={category}>
                <div className="flex items-center gap-1 px-2 py-1 mb-1">
                  {getCategoryIcon(category)}
                  <span className="text-xs font-medium text-gray-600">{category}</span>
                  <span className="text-xs text-gray-400">({chats.length})</span>
                </div>
                
                <div className="space-y-1">
                  {chats.map((chat, index) => (
                    <div 
                      key={chat.id || index}
                      // <-- DIUBAH (4): className dibuat dinamis
                      className={`flex items-center p-2 text-sm rounded-md cursor-pointer transition-colors ${
                        activeChatId === chat.id
                          ? 'bg-emerald-100 text-emerald-800 font-semibold'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => handleChatClick(chat)}
                    >
                      <FiMessageSquare className="text-gray-500 mr-2 flex-shrink-0" size={14} />
                      <span className="truncate flex-1">
                        {chat.title || chat}
                      </span>
                      {chat.messageCount && (
                        <span className="ml-2 text-xs text-gray-400">
                          {chat.messageCount}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* User Profile Section */}
      <div className="px-3 py-3 border-t border-gray-200">
        {user ? (
          <div className="relative">
            <div 
              className="flex items-center cursor-pointer"
              onClick={toggleDropdown}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden mr-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-medium">
                    {getInitials()}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {user.displayName || user.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email || ''}</p>
              </div>
            </div>

            {showDropdown && (
              <div className="absolute bottom-full left-0 mb-2 w-full bg-white border rounded-md shadow-lg z-10">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  <FiLogOut size={14} className="mr-2" />
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <div 
            className="flex items-center cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mr-2">
              <FiUser className="text-emerald-600" size={14} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Login / Register</p>
              <p className="text-xs text-gray-500">Tap to sign in</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;