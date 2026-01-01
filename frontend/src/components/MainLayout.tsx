import React, { useEffect, useState, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import '../assets/styles.css';
import CreateGroupModal from './CreateGroupModal';
import toast from 'react-hot-toast';

type Room = { name: string; roomid: string; admin?: string };
type Friend = { requester?: string; recipient?: string; email?: string; name?: string };

const MainLayout: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const location = useLocation();
  const email = localStorage.getItem('email') || '';
  const navigate = useNavigate();

  useEffect(() => {
    if (!email) return;
    api.post('/admin/getrooms', { email }).then(res => {
      setRooms(res.data.rooms || []);
    }).catch(console.error);

    api.post('/friends/list', { email }).then(res => {
      const items = res.data.friends || [];
      // convert accepted friend pairs to friend emails
      const list = items.map((f: any) => ({
        email: f.requester === email ? f.recipient : f.requester
      }));
      setFriends(list);
    }).catch(console.error);
  }, [email]);

  // derive header info from location
  let headerTitle = 'Select a chat';
  let currentRoomId = '';
  if (location.pathname.startsWith('/app/friends/chat/')) {
    const parts = location.pathname.split('/');
    const fe = decodeURIComponent(parts[parts.length - 1]);
    headerTitle = fe;
  } else if (location.pathname.startsWith('/app/group/room/')) {
    const parts = location.pathname.split('/');
    const rid = parts[parts.length - 1];
    currentRoomId = rid;
    const r = rooms.find(x => x.roomid === rid);
    headerTitle = r ? r.name : rid;
  }

  const isGroup = currentRoomId && currentRoomId !== '' && !currentRoomId.startsWith('dm:');
  const currentRoom = rooms.find(r => r.roomid === currentRoomId);
  const isAdmin = isGroup && !!currentRoom && currentRoom.admin === email;
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // close menu on outside click
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setConfirmDelete(false);
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100">
      <aside className="w-72 bg-slate-800 border-r border-slate-700">
        <div className="p-4 border-b border-slate-700">
          <div className="text-xl font-bold text-indigo-400">Chat App</div>
        </div>

        <div className="p-4">
          <h5 className="text-sm font-semibold mb-2 text-slate-300">Friends</h5>
          <div className="flex flex-col gap-2">
            {friends.map((f, i) => (
              <Link key={i} to={`/app/friends/chat/${encodeURIComponent(f.email)}`} className="text-sm text-slate-200 hover:bg-slate-700 p-2 rounded">{f.email}</Link>
            ))}
          </div>

          <h5 className="text-sm font-semibold mt-6 mb-2 text-slate-300">Groups</h5>
          <div className="flex flex-col gap-2">
            {rooms.map(r => (
              <Link key={r.roomid} to={`/app/group/room/${r.roomid}`} className="text-sm text-slate-200 hover:bg-slate-700 p-2 rounded">{r.name}</Link>
            ))}
            <button onClick={() => setShowCreate(true)} className="text-sm text-slate-200 hover:bg-slate-700 p-2 rounded text-left">+ Create</button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-slate-900">
        <header className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">{headerTitle}</h2>
          <div className="relative" ref={menuRef}>
            {isGroup && isAdmin && (
              <>
                <button aria-label="group menu" onClick={() => setMenuOpen(v => !v)} className="p-2 rounded hover:bg-slate-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v.01M12 12v.01M12 18v.01" />
                  </svg>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-slate-800 border border-slate-700 rounded shadow-lg z-50">
                    <ul className="divide-y divide-slate-700">
                      <li>
                        <button onClick={() => { setMenuOpen(false); navigate(`/add-user?group=${encodeURIComponent(currentRoomId)}`); }} className="w-full text-left px-4 py-2 hover:bg-slate-700">Add user</button>
                      </li>
                      <li>
                        <button onClick={() => { setMenuOpen(false); navigate(`/remove-users?group=${encodeURIComponent(currentRoomId)}`); }} className="w-full text-left px-4 py-2 hover:bg-slate-700">Remove users</button>
                      </li>
                      <li>
                        {!confirmDelete ? (
                          <button onClick={() => setConfirmDelete(true)} className="w-full text-left px-4 py-2 hover:bg-slate-700 text-red-400">Delete group</button>
                        ) : (
                          <div className="flex gap-2 p-2">
                            <button onClick={async () => {
                              try {
                                await api.post('/group/delete', { selectedRooms: [currentRoomId] });
                                toast.success('Group deleted');
                                const res = await api.post('/admin/getrooms', { email });
                                setRooms(res.data.rooms || []);
                                setMenuOpen(false);
                                setConfirmDelete(false);
                                navigate('/group-route');
                              } catch (err) {
                                console.error('Error deleting group', err);
                                toast.error('Error deleting group');
                              }
                            }} className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">Confirm</button>
                            <button onClick={() => { setConfirmDelete(false); }} className="px-2 py-1 border border-slate-600 rounded text-sm">Cancel</button>
                          </div>
                        )}
                      </li>
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </header>

        <section className="flex-1 overflow-hidden">
          <div className="h-full overflow-auto p-4">
            <Outlet />
          </div>
        </section>
      </main>
      <CreateGroupModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={async () => {
        try {
          const res = await api.post('/admin/getrooms', { email });
          setRooms(res.data.rooms || []);
        } catch (err) { console.error(err); }
      }} />
    </div>
  );
};

export default MainLayout;
