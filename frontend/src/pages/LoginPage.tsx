import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import '../assets/styles.css';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/user/login', { email, password });
      const data = response.data;
      if (data && data.Message === 'User not Registered') {
        setError('User not registered.');
      } else if (data && data.Message === false) {
        setError('Login failed.');
      } else {
        const userObj: any = {
          userid: data.userid,
          username: data.username,
          email: email,
          name: data.name
        };
        // store full user object for new codepaths
        localStorage.setItem('user', JSON.stringify(userObj));
        // store token for authenticated requests
        if (data.token) localStorage.setItem('token', data.token);
        // // keep legacy keys for backward compatibility
        // localStorage.setItem('email', email);
        navigate('/app');
      }
    } catch (err) {
      setError('There was a problem with your login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-800 via-blue-600 to-blue-900">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-10 text-gray-900 relative">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full p-4 shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75V15a3.75 3.75 0 01-7.5 0v-2.25m7.5 0a3.75 3.75 0 00-7.5 0m7.5 0V9a3.75 3.75 0 00-7.5 0v3.75m7.5 0a3.75 3.75 0 01-7.5 0" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-center mb-8 mt-6">Login</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50 text-gray-900"
            />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow hover:scale-105 transition-transform duration-150">
            {loading ? 'Logging in...' : 'Login'}
          </button>
          {error && <div className="text-sm text-red-500 text-center mt-2">{error}</div>}
        </form>
        <div className="mt-6 text-center text-sm text-gray-500">
          Don't have an account? <a href="/signup" className="text-blue-600 hover:underline">Sign up</a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
