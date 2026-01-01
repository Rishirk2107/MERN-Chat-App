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
        navigate('/group-route');
      }
    } catch (err) {
      setError('There was a problem with your login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Login</h1>
        <form className="form-container" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        {error && <div style={{ color: 'var(--error-color)', marginTop: 8 }}>{error}</div>}
      </form>
      </div>
    </div>
  );
};

export default LoginPage;
