import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

const CreateGroupModal: React.FC<Props> = ({ open, onClose, onCreated }) => {
  const [groupName, setGroupName] = useState('');
  const [users, setUsers] = useState<{ userid: number; username: string; name: string }[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    const fetchUsers = async () => {
      try {
        const res = await api.post('/users/list');
        setUsers(res.data.users || []);
      } catch (err) {
        console.error('Error fetching users for modal', err);
      }
    };
    fetchUsers();
  }, [open]);

  const toggle = (email: string, checked: boolean) => {
    if (checked) setSelected(prev => [...prev, email]);
    else setSelected(prev => prev.filter(p => p !== email));
  };

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const email = user ? user.email : null;
    if (!email) return toast.error('Please login');
    try {
      await api.post('/rooms/create', { name: groupName, selectedEmails: selected, email });
      toast.success('Group created');
      setGroupName('');
      setSelected([]);
      onCreated && onCreated();
      onClose();
    } catch (err) {
      console.error('Error creating group', err);
      toast.error('Error creating group');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="bg-slate-800 text-slate-100 rounded-lg shadow-lg w-full max-w-2xl z-50 p-6">
        <h3 className="text-lg font-semibold mb-4">Create Group</h3>
        <form onSubmit={submit} className="space-y-4">
          <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Group name" className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-slate-100" required />

          <div className="grid grid-cols-2 gap-2 max-h-56 overflow-auto">
            {users.map(u => (
              <label key={u.userid} className="flex items-center gap-2 p-2 bg-slate-800 rounded border border-slate-700">
                <input type="checkbox" onChange={(e) => toggle(u.username, e.target.checked)} className="w-4 h-4" />
                <div>
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-slate-400">{u.username}</div>
                </div>
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded border-slate-600">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 rounded text-white">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
