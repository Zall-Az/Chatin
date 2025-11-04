import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/Context/ToastContext';
import Navbar from './components/layout/Navbarr';
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import AuthPage from './pages/AuthPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './index.css';
import './App.css';

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route 
            path="/" 
            element={
              <>
                <Navbar />
                <HomePage />
              </>
            } 
          />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
          <Route 
            path="/chat" 
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;