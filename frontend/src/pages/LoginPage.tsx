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
        localStorage.setItem('email', email);
        localStorage.setItem('name', data.name);
        navigate('/app');
      }
    } catch (err) {
      setError('There was a problem with your login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="w-full max-w-md bg-gray-800 rounded shadow p-8 text-white">
        <h1 className="text-2xl font-semibold text-center mb-6">Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
          />
          <div className="text-center">
            <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded">{loading ? 'Logging in...' : 'Login'}</button>
          </div>
          {error && <div className="text-sm text-red-400">{error}</div>}
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
