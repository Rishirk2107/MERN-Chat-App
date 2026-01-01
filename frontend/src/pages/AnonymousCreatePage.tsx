import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

const AnonymousCreatePage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = localStorage.getItem('email');
    if (!email) {
      toast.error('Please login first');
      return;
    }
    try {
      const response = await api.post('/create/discussion', { topic: title, email });
      if (response.data.Message) {
        navigate(`/anonymous-discussion?room=${response.data.topicId}`);
      } else {
        toast.error('Error creating discussion');
      }
    } catch (error) {
      console.error('Error creating discussion:', error);
      toast.error('Error creating discussion');
    }
  };

  return (
    <div className="page">
      <h1>Create Anonymous Discussion</h1>
      <form className="form-container" onSubmit={handleSubmit}>
        <input
          type="text"
          className="discussion-title"
          placeholder="Discussion Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          className="discussion-name"
          placeholder="Discussion Name/Content"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <button type="submit">Create Discussion</button>
      </form>
    </div>
  );
};

export default AnonymousCreatePage;
