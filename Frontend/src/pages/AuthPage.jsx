import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import logo from '../assets/chatin.png'; // Sesuaikan path-nya dengan struktur project-mu


const AuthPage = () => {
  const location = useLocation();
  const isLogin = location.pathname === '/login';
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-white to-emerald-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
        <div className="flex justify-center">
            <img src={logo} alt="ChatinAja Logo" className="h-12 w-auto" />
        </div>
          <p className="mt-1 text-sm text-gray-600">
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          {error && (
            <div className="mb-4 p-2 bg-red-50 border-l-4 border-red-400 text-sm text-red-700">
              {error}
            </div>
          )}
          
          {isLogin ? (
            <LoginForm setError={setError} setIsLoading={setIsLoading} isLoading={isLoading} />
          ) : (
            <RegisterForm setError={setError} setIsLoading={setIsLoading} isLoading={isLoading} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;