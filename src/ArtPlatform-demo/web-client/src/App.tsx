import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Register from './pages/Register';
import Login from './pages/Login';
import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword';
import SearchPage from './pages/SearchPage';
import PublicProfile from './pages/PublicProfile';
import AdminRoles from './pages/AdminRoles';
import Home from './pages/Home';

export default function App() {
  return (
    <Routes>
      {/* Страницы без общего layout (шапки и футера) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
      
      {/* Страницы с общим layout */}
      <Route path="/" element={<Home />} />
      <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
      <Route path="/user/:userId" element={<PublicProfile />} />
      <Route path="/admin/roles" element={<ProtectedRoute requiredRole="Admin"><AdminRoles /></ProtectedRoute>} />
    </Routes>
  );
}