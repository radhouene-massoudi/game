import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ClockGame from './games/ClockGame';
import GameSelection from './pages/GameSelection';
import Login from './pages/Login';
import Home from './pages/Home';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/home" element={<ProtectedRoute element={<Home />} />} />
      <Route path="/games" element={<ProtectedRoute element={<GameSelection />} />} />
      <Route path="/clock" element={<ProtectedRoute element={<ClockGame />} />} />
    </Routes>
  );
}

export default App;