import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="flex justify-end items-center p-6">
        <Link to="/login">
          <button className="px-6 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition">Login</button>
        </Link>
      </header>
      <main className="flex flex-col items-center justify-center flex-1 text-center px-4">
        <h1 className="text-4xl font-bold mb-4 text-blue-700">MERN Chat App</h1>
        <p className="text-lg max-w-2xl mb-8 text-gray-700">
          Welcome to the MERN Chat App! This platform lets you chat securely with friends, create groups, and discuss anonymously. Built with MongoDB, Express, React, and Node.js, it offers real-time messaging, group management, and privacy features. Whether you want to connect with friends or join public discussions, our app makes communication easy and fun.
        </p>
        <div className="mt-4 text-gray-500">
          <span>To get started, click Login at the top right.</span>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
