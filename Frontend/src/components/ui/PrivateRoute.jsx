import { Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/firebase';
import { motion } from 'framer-motion';

export default function PrivateRoute({ children }) {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center min-h-screen"
      >
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </motion.div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}