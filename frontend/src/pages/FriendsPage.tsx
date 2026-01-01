import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import '../assets/styles.css';

type UserResult = { _id?: string; name: string; email: string };
type FriendRequest = { _id: string; requester: string; createdAt: string };

const FriendsPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const email = localStorage.getItem('email') || '';

  useEffect(() => {
    if (!email) return;
    fetchIncoming();
  }, [email]);

  const fetchIncoming = async () => {
    try {
      const res = await api.post('/friends/incoming', { email });
      setIncoming(res.data.requests || []);
    } catch (err) {
      console.error('Error fetching incoming requests', err);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/friends/search', { name: query.trim(), email });
      setResults(res.data.users || []);
    } catch (err) {
      console.error('Search error', err);
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async (targetEmail: string) => {
    try {
      await api.post('/friends/request', { email, targetEmail });
      alert('Friend request sent');
    } catch (err) {
      console.error('Error sending request', err);
      alert('Error sending request');
    }
  };

  const acceptRequest = async (requester: string) => {
    try {
      await api.post('/friends/accept', { email, requester });
      alert('Friend request accepted');
      fetchIncoming();
    } catch (err) {
      console.error('Error accepting request', err);
      alert('Error accepting request');
    }
  };

  return (
    <div className="page">
      <h1>Friends</h1>

      <section style={{ marginBottom: 24 }}>
        <h3>Search by name</h3>
        <form onSubmit={handleSearch} className="form-container">
          <input
            type="text"
            placeholder="Enter name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" disabled={loading}>{loading ? 'Searching...' : 'Search'}</button>
        </form>

        <div style={{ marginTop: 12 }}>
          {results.length === 0 && <p>No results</p>}
          {results.map(r => (
            <div key={r.email} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, background: 'var(--surface-color)', borderRadius: 8, marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{r.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{r.email}</div>
              </div>
              <div>
                <button onClick={() => sendRequest(r.email)}>Send Request</button>
                <button style={{ marginLeft: 8 }} onClick={() => window.location.href = `/friends/chat/${encodeURIComponent(r.email)}`}>Chat</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3>Incoming Requests</h3>
        {incoming.length === 0 && <p>No incoming requests</p>}
        {incoming.map(req => (
          <div key={req._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, background: 'var(--surface-color)', borderRadius: 8, marginBottom: 8 }}>
            <div>
              <div style={{ fontWeight: 600 }}>{req.requester}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{new Date(req.createdAt).toLocaleString()}</div>
            </div>
            <div>
              <button onClick={() => acceptRequest(req.requester)}>Accept</button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default FriendsPage;
