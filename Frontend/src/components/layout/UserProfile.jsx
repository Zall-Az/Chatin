import { useState, useEffect } from 'react';
import { auth } from '../firebase/firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../Context/ToastContext';

const UserProfile = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

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
      toast.success('Logout berhasil. Sampai jumpa kembali!');
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Terjadi kesalahan saat logout.');
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
        return username.substring(username.length - 2).toUpperCase();
      } else {
        return username.toUpperCase();
      }
    }
  };

  return (
    <div className="relative">
      {user ? (
        // User is logged in (same as before)
        <>
          <button
            onClick={toggleDropdown}
            className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden border border-emerald-200 transition-transform hover:scale-105"
          >
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-emerald-600 font-medium">
                {getInitials()}
              </div>
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-100 rounded-lg shadow-xl z-10 overflow-hidden">
              <div className="p-4 border-b bg-gradient-to-r from-emerald-50 to-teal-50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-emerald-200">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-emerald-600 font-medium">
                        {getInitials()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.displayName || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
              </div>
              <div className="p-2">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        // Enhanced login/sign up dropdown
        <>
          <button
            onClick={toggleDropdown}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center transition-all hover:from-emerald-200 hover:to-teal-200 hover:shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </button>

          {/* Modern dropdown for non-logged in users */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-lg shadow-xl z-10 overflow-hidden">
              <div className="p-2 space-y-1">
                <a
                  href="/login"
                  className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Login
                </a>
                <a
                  href="/register"
                  className="flex items-center px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Sign Up
                </a>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserProfile;