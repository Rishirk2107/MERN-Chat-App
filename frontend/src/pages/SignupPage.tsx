import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import '../assets/styles.css';

const SignupPage: React.FC = () => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [stateField, setStateField] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/user/signup', { name, username, email, password, mobileNumber, dob, gender, state: stateField, country });
      const data = response.data;
      if (data.Message === 1) {
        navigate('/login');
      } else {
        setError(data.error || 'Signup failed.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'There was a problem with your signup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-800 via-blue-600 to-blue-900 px-4 md:px-8">
      <div className="w-full max-w-full md:max-w-5xl lg:max-w-6xl bg-white rounded-2xl shadow-xl p-6 md:p-12 text-gray-900 relative mx-2 md:mx-4">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full p-4 shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-3A2.25 2.25 0 008.25 5.25V9m7.5 0v10.5A2.25 2.25 0 0113.5 21h-3a2.25 2.25 0 01-2.25-2.25V9m7.5 0H8.25" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-center mb-8 mt-6">Sign Up</h1>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="mobile">Mobile Number</label>
            <input
              id="mobile"
              type="tel"
              placeholder="e.g. +1-555-555-5555"
              value={mobileNumber}
              onChange={e => setMobileNumber(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="dob">Date of Birth</label>
            <input
              id="dob"
              type="date"
              value={dob}
              onChange={e => setDob(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="gender">Gender</label>
            <select id="gender" value={gender} onChange={e => setGender(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50">
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="state">State</label>
            <input id="state" value={stateField} onChange={e => setStateField(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="country">Country</label>
            <input id="country" value={country} onChange={e => setCountry(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2" htmlFor="bio">Bio</label>
            <textarea id="bio" rows={3} value={''} readOnly className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700" placeholder="(optional)" />
          </div>
          <button type="submit" disabled={loading} className="md:col-span-2 w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg shadow hover:scale-105 transition-transform duration-150">
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>
          {error && <div className="md:col-span-2 text-sm text-red-500 text-center mt-2">{error}</div>}
        </form>
        <div className="mt-6 text-center text-sm text-gray-500">
          Already have an account? <a href="/login" className="text-purple-600 hover:underline">Login</a>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
