import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <div className="page">
      <h1>Welcome to the Chat App</h1>
      <div className="form-container">
        <Link to="/login">Login</Link>
        <Link to="/signup">Signup</Link>
        <Link to="/rooms">Rooms</Link>
        <Link to="/group-route">Group Route</Link>
      </div>
    </div>
  );
};

export default HomePage;
