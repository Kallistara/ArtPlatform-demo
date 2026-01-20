import React from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getToken, clearToken, getUserFromToken } from '../lib/auth';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const token = getToken();
  const user = token ? getUserFromToken() : null;
  const userRole = user?.role || null;
  const username = user?.username || null;

  function handleLogout() {
    clearToken();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Фоновые круги */}
      <div className="fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-1000"></div>
        <div className="absolute top-3/4 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>
      </div>

      {/* Шапка */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-gray-800/95 via-gray-900/95 to-gray-800/95 backdrop-blur-lg border-b border-gray-700/50 shadow-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link 
                to="/" 
                className="text-gray-300 hover:text-white font-medium transition-colors duration-200 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                ArtPlatform
              </Link>
              <div className="hidden lg:flex items-center space-x-6">
                <Link to="/" className="text-gray-300 hover:text-white font-medium transition-colors duration-200">
                  Главная
                </Link>
                {token && <Link to="/search" className="text-gray-300 hover:text-white font-medium transition-colors duration-200">
                  Поиск
                </Link>}
                {userRole === 'Admin' && <Link to="/admin/roles" className="text-gray-300 hover:text-white font-medium transition-colors duration-200">
                  Админ
                </Link>}
              </div>
            </div>
            <div>
              {token ? (
                <div className="dropdown dropdown-end">
                  <label tabIndex={0} className="btn btn-ghost btn-circle">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
                      {/* Используем первую букву username вместо роли */}
                      <span className="text-lg text-white font-bold">
                        {username?.[0]?.toUpperCase() || userRole?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  </label>
                  <ul tabIndex={0} className="dropdown-content menu p-4 shadow bg-gray-800/95 backdrop-blur-lg rounded-box w-64 mt-4 border border-gray-700/50">
                    <li className="menu-title">
                      <div className="flex items-center gap-3 p-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
                          {/* Используем первую букву username вместо роли */}
                          <span className="text-lg text-white font-bold">
                            {username?.[0]?.toUpperCase() || userRole?.[0]?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">
                            {username || 'Пользователь'}
                          </div>
                          <div className="text-xs px-3 py-1 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 border border-indigo-400/50 rounded-full text-indigo-300">
                            {userRole || 'Пользователь'}
                          </div>
                        </div>
                      </div>
                    </li>
                    <li className="border-t border-gray-700/50 mt-2 pt-2">
                      <Link to="/profile" className="text-gray-300 hover:text-white hover:bg-gray-700/50">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                        Мой профиль
                      </Link>
                    </li>
                    <li>
                      <Link to="/change-password" className="text-gray-300 hover:text-white hover:bg-gray-700/50">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                        </svg>
                        Сменить пароль
                      </Link>
                    </li>
                    <li className="border-t border-gray-700/50 mt-2 pt-2">
                      <button 
                        onClick={handleLogout} 
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                        </svg>
                        Выйти
                      </button>
                    </li>
                  </ul>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Link to="/login" className="btn btn-outline border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-700">
                    Вход
                  </Link>
                  <Link to="/register" className="btn bg-gradient-to-r from-indigo-600 to-purple-600 border-0 text-white hover:from-indigo-700 hover:to-purple-700">
                    Регистрация
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="container mx-auto px-4 py-8 pt-24">
        {children}
      </main>

      {/* Футер - упрощенный */}
      <footer className="border-t border-gray-700/50 mt-12 py-8 bg-gray-800/50 backdrop-blur-lg">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <Link to="/" className="text-xl font-bold text-white">ArtPlatform</Link>
            <p className="text-sm text-gray-400 mt-2">Платформа для творческих людей</p>
          </div>
        </div>
      </footer>
    </div>
  );
}