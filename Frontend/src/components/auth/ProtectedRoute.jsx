import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../firebase/firebase';
import { useToast } from '../Context/ToastContext';

const ProtectedRoute = ({ children }) => {
  const [status, setStatus] = useState('checking'); // 'checking' | 'authenticated' | 'unauthenticated'
  const toast = useToast();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setStatus('authenticated');
      } else {
        setStatus('unauthenticated');
        // Only show toast if not already on login page
        if (!window.location.pathname.includes('/login')) {
          toast.info('Session expired. Please login again.');
        }
      }
    });

    return unsubscribe;
  }, []);

  if (status === 'checking') {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;