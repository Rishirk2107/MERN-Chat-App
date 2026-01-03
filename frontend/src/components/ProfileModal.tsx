import React from 'react';
import { useEffect } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  user: any;
  onLogout: () => void;
};

const ProfileModal: React.FC<Props> = ({ open, onClose, user, onLogout }) => {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const displayName = user ? (user.name || user.username || 'Unknown') : 'Unknown';
  const username = user ? (user.username || '') : '';
  const email = user ? (user.email || '') : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative bg-slate-800 text-slate-100 rounded-lg w-96 shadow-lg overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-500 rounded-md flex items-center justify-center text-white font-semibold text-lg">{String((displayName || 'U')[0]).toUpperCase()}</div>
            <div>
              <div className="font-semibold">{displayName}</div>
              <div className="text-xs text-slate-300">{username}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white">✕</button>
        </div>

        <div className="p-4">
          <div className="text-sm text-slate-300 mb-2">Profile details</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-slate-400">Name</div>
            <div className="text-slate-100">{displayName}</div>
            <div className="text-slate-400">Username</div>
            <div className="text-slate-100">{username || '—'}</div>
            <div className="text-slate-400">Email</div>
            <div className="text-slate-100">{email || '—'}</div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button onClick={onClose} className="px-3 py-1 border border-slate-600 rounded text-sm">Close</button>
            <button onClick={() => { onLogout(); onClose(); }} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm">Logout</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
