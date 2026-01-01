import React from 'react';
import { Routes, Route } from 'react-router-dom';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import GroupRoutePage from './pages/GroupRoutePage';
import HomePage from './pages/HomePage';
import CreateGroupPage from './pages/CreateGroupPage';
import RoomsPage from './pages/RoomsPage';
import DeleteGroupPage from './pages/DeleteGroupPage';
import AddUserPage from './pages/AddUserPage';
import RemoveUsersPage from './pages/RemoveUsersPage';
import AnonymousRedirectPage from './pages/AnonymousRedirectPage';
import AnonymousCreatePage from './pages/AnonymousCreatePage';
import AnonymousDiscussionPage from './pages/AnonymousDiscussionPage';
import LoginAdminPage from './pages/LoginAdminPage';
import CreatorDiscussionPage from './pages/CreatorDiscussionPage';
import NotFoundPage from './pages/NotFoundPage';

const App: React.FC = () => {
  return (
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login-admin" element={<LoginAdminPage />} />
        <Route path="/rooms" element={<RoomsPage />} />
        <Route path="/group-route" element={<GroupRoutePage />} />
        <Route path="/create-group" element={<CreateGroupPage />} />
        <Route path="/delete-group" element={<DeleteGroupPage />} />
        <Route path="/add-user" element={<AddUserPage />} />
        <Route path="/remove-users" element={<RemoveUsersPage />} />
        <Route path="/anonymous-redirect" element={<AnonymousRedirectPage />} />
        <Route path="/anonymous-create" element={<AnonymousCreatePage />} />
        <Route path="/anonymous-discussion" element={<AnonymousDiscussionPage />} />
        <Route path="/creator-discussion" element={<CreatorDiscussionPage />} />
        <Route path="/group/room/:roomId" element={<CreatorDiscussionPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
  );
};

export default App;
