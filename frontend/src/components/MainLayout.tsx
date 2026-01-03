import React, { useEffect, useState, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import '../assets/styles.css';
import CreateGroupModal from './CreateGroupModal';
// import ProfileModal from './ProfileModal';
import toast from 'react-hot-toast';

type Room = { name: string; roomid: string; admin?: string };
type Friend = { requester?: string; recipient?: string; email?: string; name?: string };

const MainLayout: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const location = useLocation();
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const userid = localStorage.getItem('userid') || (user ? String(user.userid) : '') || '';
    const email = user ? user.email : '';
  const navigate = useNavigate();

  useEffect(() => {
    if (!userid) return;
    api.post('/admin/rooms', { userid }).then(res => {
      setRooms(res.data.rooms || []);
    }).catch(console.error);

    api.post('/friends/list', { userid }).then(res => {
      const items = res.data.friends || [];
      const myId = Number(userid);
      const list = items.map((f: any) => {
        const requesterId = Number(f.requester?.userid ?? f.requester);
        const isRequester = requesterId === myId;
        const other = isRequester ? f.recipient : f.requester;
        return {
          id: other?.userid ?? other,
          username: other?.username,
          name: other?.name,
          email: other?.email,
        };
      });
      setFriends(list);
    }).catch(console.error);
  }, [userid]);

  // derive header info from location
  let headerTitle = 'Select a chat';
  let currentRoomId = '';
  if (location.pathname.startsWith('/app/friends/chat/')) {
    const parts = location.pathname.split('/');
    const friendId = decodeURIComponent(parts[parts.length - 1]);
    // Find friend by id
    const friend = friends.find(f => String(f.id) === String(friendId));
    headerTitle = friend ? (friend.name || friend.username || String(friend.id)) : friendId;
  } else if (location.pathname.startsWith('/app/group/room/')) {
    const parts = location.pathname.split('/');
    const rid = parts[parts.length - 1];
    currentRoomId = rid;
    const r = rooms.find(x => x.roomid === rid);
    headerTitle = r ? r.name : rid;
  }

  const isGroup = currentRoomId && currentRoomId !== '' && !currentRoomId.startsWith('dm:');
  const currentRoom = rooms.find(r => r.roomid === currentRoomId);
    const isAdmin = isGroup && !!currentRoom && String(currentRoom.admin) === String(userid);
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

  // const [showProfile, setShowProfile] = useState(false);

  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userid');
    } catch (e) { /* ignore */ }
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100">
      <aside className="w-72 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="overflow-auto">
          <div className="p-4 border-b border-slate-700">
            <div className="text-xl font-bold text-indigo-400">Chat App</div>
          </div>

          <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-sm font-semibold text-slate-300">Friends</h5>
            <button onClick={() => navigate('/app/friends')} className="ml-2 p-1 rounded hover:bg-slate-700 text-slate-100" title="Add / Search Friends">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div className="flex flex-col gap-2">
              {friends.map((f) => (
                <Link key={String(f.id)} to={`/app/friends/chat/${encodeURIComponent(String(f.id))}`} className="text-sm text-slate-200 hover:bg-slate-700 p-2 rounded">{f.name || f.username || String(f.id)}</Link>
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
        </div>

        <div className="p-4 border-t border-slate-700">
          <div onClick={() => navigate('/app/profile')} className="cursor-pointer bg-slate-700 hover:bg-slate-600 p-3 rounded flex items-center gap-3" id="profile-area">
            <div className="w-10 h-10 bg-indigo-500 rounded-md flex items-center justify-center text-white font-semibold">{(user && (user.username || user.name) ? String((user.username || user.name)[0]).toUpperCase() : 'U')}</div>
            <div className="flex-1 text-sm text-slate-100">
              <div className="font-semibold">{user ? (user.username || user.name) : 'Unknown'}</div>
              <div className="text-xs text-slate-300">Profile</div>
            </div>
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
                                await api.post('/groups/delete', { selectedRooms: [currentRoomId] });
                                toast.success('Group deleted');
                                const res = await api.post('/admin/rooms', { userid });
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
      {/* ProfileModal removed */}

      <CreateGroupModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={async () => {
        try {
          const res = await api.post('/admin/rooms', { userid });
          setRooms(res.data.rooms || []);
        } catch (err) { console.error(err); }
      }} />
    </div>
  );
};

export default MainLayout;
