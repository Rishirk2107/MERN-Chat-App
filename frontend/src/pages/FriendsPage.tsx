import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import '../assets/styles.css';
import toast from 'react-hot-toast';

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
      toast.success('Friend request sent');
    } catch (err) {
      console.error('Error sending request', err);
      toast.error('Error sending request');
    }
  };

  const acceptRequest = async (requester: string) => {
    try {
      await api.post('/friends/accept', { email, requester });
      toast.success('Friend request accepted');
      fetchIncoming();
    } catch (err) {
      console.error('Error accepting request', err);
      toast.error('Error accepting request');
    }
  };

  return (
    <div className="max-w-3xl mx-auto text-slate-100">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-100">Friends</h1>
      </div>

      <section className="mb-8">
        <h3 className="text-sm font-medium mb-2 text-slate-300">Search by name</h3>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Enter name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 p-2 bg-slate-800 border border-slate-700 rounded text-slate-100"
          />
          <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded">{loading ? 'Searching...' : 'Search'}</button>
        </form>

        <div className="mt-4 space-y-3">
          {results.length === 0 && <p className="text-sm text-slate-400">No results</p>}
          {results.map(r => (
            <div key={r.email} className="flex justify-between items-center p-3 bg-slate-800 rounded shadow-sm border border-slate-700">
              <div>
                <div className="font-medium text-slate-100">{r.name}</div>
                <div className="text-xs text-slate-400">{r.email}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => sendRequest(r.email)} className="px-3 py-1 border border-slate-600 rounded text-sm text-slate-100">Send</button>
                <button className="px-3 py-1 bg-indigo-600 text-white rounded text-sm" onClick={() => window.location.href = `/app/friends/chat/${encodeURIComponent(r.email)}`}>Chat</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-medium mb-2 text-slate-300">Incoming Requests</h3>
        <div className="space-y-3">
          {incoming.length === 0 && <p className="text-sm text-slate-400">No incoming requests</p>}
          {incoming.map(req => (
            <div key={req._id} className="flex justify-between items-center p-3 bg-slate-800 rounded shadow-sm border border-slate-700">
              <div>
                <div className="font-medium text-slate-100">{req.requester}</div>
                <div className="text-xs text-slate-400">{new Date(req.createdAt).toLocaleString()}</div>
              </div>
              <div>
                <button onClick={() => acceptRequest(req.requester)} className="px-3 py-1 bg-green-600 text-white rounded text-sm">Accept</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default FriendsPage;
