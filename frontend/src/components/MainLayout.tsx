import React, { useEffect, useState, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import '../assets/styles.css';
import CreateGroupModal from './CreateGroupModal';
// import ProfileModal from './ProfileModal';
import toast from 'react-hot-toast';

// Utility: detect mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  React.useEffect(() => {
    function onResize() {
      setIsMobile(window.innerWidth <= 768);
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isMobile;
}

type Room = { name: string; roomid: string; admin?: string };


const MainLayout: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();
  // For mobile: track if chat is open
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const userid = localStorage.getItem('userid') || (user ? String(user.userid) : '') || '';

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
  let isChatRoute = false;
  if (location.pathname.startsWith('/app/friends/chat/')) {
    isChatRoute = true;
    const parts = location.pathname.split('/');
    const friendId = decodeURIComponent(parts[parts.length - 1]);
    // Find friend by id
    const friend = friends.find(f => String(f.id) === String(friendId));
    headerTitle = friend ? (friend.name || friend.username || String(friend.id)) : friendId;
  } else if (location.pathname.startsWith('/app/group/room/')) {
    isChatRoute = true;
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



  // Mobile: show only sidebar if not in chat, only chat if in chat
  if (isMobile) {
    // If on a chat route, show chat interface, else show sidebar
    return (
      <div className="flex h-screen bg-gradient-to-br from-blue-800 via-blue-600 to-blue-900 text-slate-100 relative">
        {/* Sidebar (lists) */}
        {!isChatRoute && (
          <aside className="w-full bg-white/10 backdrop-blur-lg border-b border-slate-700 flex flex-col shadow-xl z-10">
            <div className="overflow-auto">
              <div className="p-6 border-b border-slate-700 flex items-center gap-2">
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-full p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-6a2.25 2.25 0 01-2.25-2.25V6.75" />
                  </svg>
                </div>
                <div className="text-2xl font-bold text-indigo-400 tracking-wide">Chat App</div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="text-base font-semibold text-slate-200">Friends</h5>
                  <button onClick={() => navigate('/app/friends')} className="ml-2 p-2 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow hover:scale-105 transition-transform duration-150" title="Add / Search Friends">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <div className="mb-3">
                  <input
                    placeholder="Search friends"
                    className="w-full px-3 py-2 rounded bg-white/5 text-slate-100 placeholder:text-slate-400 focus:outline-none"
                    onChange={() => { /* optional filter */ }}
                  />
                </div>
                <div className="flex flex-col gap-3 mt-3">
                  {friends.map((f) => (
                    <Link key={String(f.id)} to={`/app/friends/chat/${encodeURIComponent(String(f.id))}`} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition">
                      <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">{(f.name || f.username || String(f.id))[0]?.toUpperCase()}</div>
                      <div className="text-sm text-slate-100">{f.name || f.username || String(f.id)}</div>
                    </Link>
                  ))}
                </div>
                <h5 className="text-base font-semibold mt-8 mb-4 text-slate-200">Groups</h5>
                <div className="flex flex-col gap-3">
                  {rooms.map(r => (
                    <Link key={r.roomid} to={`/app/group/room/${r.roomid}`} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition">
                      <div className="w-9 h-9 bg-slate-700 rounded-full flex items-center justify-center text-white">{(r.name || 'G')[0]?.toUpperCase()}</div>
                      <div className="text-sm text-slate-100">{r.name}</div>
                    </Link>
                  ))}
                  <button onClick={() => setShowCreate(true)} className="text-sm text-slate-100/90 bg-transparent hover:bg-white/5 px-3 py-2 rounded-lg text-left transition">+ Create</button>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-700">
              <div onClick={() => navigate('/profile')} className="cursor-pointer bg-gradient-to-br from-blue-600 to-purple-600 hover:from-purple-600 hover:to-blue-600 p-3 rounded-lg flex items-center gap-3 shadow-lg transition" id="profile-area">
                <div className="w-10 h-10 bg-white/80 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg shadow">{(user && (user.username || user.name) ? String((user.username || user.name)[0]).toUpperCase() : 'U')}</div>
                <div className="flex-1 text-sm text-white">
                  <div className="font-semibold">{user ? (user.username || user.name) : 'Unknown'}</div>
                  <div className="text-xs text-blue-200">Profile</div>
                </div>
              </div>
            </div>
            <CreateGroupModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={async () => {
              try {
                const res = await api.post('/admin/rooms', { userid });
                setRooms(res.data.rooms || []);
              } catch (err) { console.error(err); }
            }} />
          </aside>
        )}
        {/* Chat interface (main) */}
        {isChatRoute && (
          <main className="flex-1 flex flex-col bg-white/10 backdrop-blur-xl absolute inset-0 z-20">
            <header className="bg-white/20 backdrop-blur-lg border-b border-slate-700 p-6 flex items-center gap-4 shadow">
              <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-blue-600 text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-2xl font-bold text-blue-700 drop-shadow-lg">{headerTitle}</h2>
            </header>
            <section className="flex-1 overflow-hidden">
              <div className="h-full overflow-auto p-2">
                <Outlet />
              </div>
            </section>
          </main>
        )}
      </div>
    );
  }

  // Desktop: show both sidebar and chat
  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-800 via-blue-600 to-blue-900 text-slate-100">
      {/* ...existing code for desktop sidebar and main... */}
      <aside className="w-72 bg-white/10 backdrop-blur-lg border-r border-slate-700 flex flex-col shadow-xl">
        {/* ...existing code... */}
        <div className="overflow-auto">
          <div className="p-6 border-b border-slate-700 flex items-center gap-2">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-full p-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-6a2.25 2.25 0 01-2.25-2.25V6.75" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-indigo-400 tracking-wide">Chat App</div>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-base font-semibold text-slate-200">Friends</h5>
              <button onClick={() => navigate('/app/friends')} className="ml-2 p-2 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow hover:scale-105 transition-transform duration-150" title="Add / Search Friends">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="mb-3">
              <input
                placeholder="Search friends"
                className="w-full px-3 py-2 rounded bg-white/5 text-slate-100 placeholder:text-slate-400 focus:outline-none"
                onChange={() => { /* optional filter */ }}
              />
            </div>
            <div className="flex flex-col gap-2 mt-3">
              {friends.map((f) => {
                const isActive = location.pathname === `/app/friends/chat/${encodeURIComponent(String(f.id))}`;
                return (
                  <Link key={String(f.id)} to={`/app/friends/chat/${encodeURIComponent(String(f.id))}`}
                    className={`flex items-center gap-3 p-3 rounded-lg transition font-medium ${isActive ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-white/5 hover:bg-white/10 text-slate-100'}`}
                  >
                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">{(f.name || f.username || String(f.id))[0]?.toUpperCase()}</div>
                    <div className="text-sm">{f.name || f.username || String(f.id)}</div>
                  </Link>
                );
              })}
            </div>
            <h5 className="text-base font-semibold mt-8 mb-4 text-slate-200">Groups</h5>
            <div className="flex flex-col gap-2">
              {rooms.map(r => {
                const isActive = location.pathname === `/app/group/room/${r.roomid}`;
                return (
                  <Link key={r.roomid} to={`/app/group/room/${r.roomid}`}
                    className={`flex items-center gap-3 p-3 rounded-lg transition font-medium ${isActive ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg' : 'bg-white/5 hover:bg-white/10 text-slate-100'}`}
                  >
                    <div className="w-9 h-9 bg-slate-700 rounded-full flex items-center justify-center text-white">{(r.name || 'G')[0]?.toUpperCase()}</div>
                    <div className="text-sm">{r.name}</div>
                  </Link>
                );
              })}
              <button onClick={() => setShowCreate(true)} className="text-sm text-slate-100/90 bg-transparent hover:bg-white/5 px-3 py-2 rounded-lg text-left transition mt-2">+ Create</button>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-slate-700">
          <div onClick={() => navigate('/profile')} className="cursor-pointer bg-gradient-to-br from-blue-600 to-purple-600 hover:from-purple-600 hover:to-blue-600 p-3 rounded-lg flex items-center gap-3 shadow-lg transition" id="profile-area">
            <div className="w-10 h-10 bg-white/80 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg shadow">{(user && (user.username || user.name) ? String((user.username || user.name)[0]).toUpperCase() : 'U')}</div>
            <div className="flex-1 text-sm text-white">
              <div className="font-semibold">{user ? (user.username || user.name) : 'Unknown'}</div>
              <div className="text-xs text-blue-200">Profile</div>
            </div>
          </div>
        </div>
        <CreateGroupModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={async () => {
          try {
            const res = await api.post('/admin/rooms', { userid });
            setRooms(res.data.rooms || []);
          } catch (err) { console.error(err); }
        }} />
      </aside>
      <main className="flex-1 flex flex-col bg-white/10 backdrop-blur-xl">
        <header className="bg-white/20 backdrop-blur-lg border-b border-slate-700 p-6 flex items-center justify-between shadow">
          <h2 className="text-2xl font-bold text-blue-700 drop-shadow-lg">{headerTitle}</h2>
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
          <div className="h-full overflow-auto p-8">
            <Outlet />
          </div>
        </section>
      </main>
    </div>
  );
};

export default MainLayout;
