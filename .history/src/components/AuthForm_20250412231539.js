import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './AuthForm.css'

const AuthForm = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? '/api/login' : '/api/auth';
    try {
      const response = await api.post(endpoint, { username, password });
      if (isLogin) {
        localStorage.setItem('token', response.data.token);
        onLogin({ name: username }); // Pass user data (e.g., username) to onLogin
        navigate('/portfolio'); // Redirect to explore after login
      } else {
        alert('Account created successfully! Please log in.');
        setIsLogin(true); // Switch to login form after registration
      }
    } catch (err) {
      console.error('Auth error:', err);
      alert(err.response?.data?.error || 'An error occurred');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>{isLogin ? 'Sign In' : 'Sign Up'}</h1>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
        autoComplete="username" // Add autocomplete attribute
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete={isLogin ? 'current-password' : 'new-password'} // Add autocomplete attribute
      />
      <button type="submit">{isLogin ? 'Sign In' : 'Sign Up'}</button>
      <button type="button" onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
      </button>
    </form>
  );
};

export default AuthForm;
