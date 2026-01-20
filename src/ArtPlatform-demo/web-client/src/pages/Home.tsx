import React from 'react';
import { Link } from 'react-router-dom';
import { getToken } from '../lib/auth';
import Layout from '../components/Layout';

export default function Home() {
  const token = getToken();

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center max-w-4xl">
          <div className="mb-10">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-8">
              Добро пожаловать в <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">ArtPlatform</span>
            </h1>
            <p className="text-xl text-gray-300 mb-10 px-4">
              Платформа для художников, дизайнеров и творческих людей. Создавайте, делитесь и вдохновляйтесь.
            </p>
          </div>
          
          {/* Карточки с увеличенными паддингами */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-14">
            <div className="card bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-lg shadow-2xl border border-gray-700/50 hover:border-indigo-500/50 transition-all duration-300">
              <div className="card-body p-8">
                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-5 mx-auto">
                  <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 text-center">Творите</h3>
                <p className="text-gray-400 text-center leading-relaxed">
                  Публикуйте свои работы, получайте обратную связь от сообщества и развивайтесь как художник
                </p>
              </div>
            </div>
            
            <div className="card bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-lg shadow-2xl border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300">
              <div className="card-body p-8">
                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-5 mx-auto">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 text-center">Сообщество</h3>
                <p className="text-gray-400 text-center leading-relaxed">
                  Находите единомышленников, подписывайтесь на любимых авторов, общайтесь и делитесь идеями
                </p>
              </div>
            </div>
            
            <div className="card bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-lg shadow-2xl border border-gray-700/50 hover:border-pink-500/50 transition-all duration-300">
              <div className="card-body p-8">
                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-pink-500/20 to-rose-500/20 flex items-center justify-center mb-5 mx-auto">
                  <svg className="w-8 h-8 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 text-center">Коллекции</h3>
                <p className="text-gray-400 text-center leading-relaxed">
                  Собирайте любимые работы в тематические коллекции, делитесь ими и создавайте вдохновляющие подборки
                </p>
              </div>
            </div>
          </div>

          {/* Кнопки с улучшенным оформлением */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            {!token ? (
              <>
                <Link 
                  to="/register" 
                  className="btn btn-primary px-10 py-4 text-lg font-medium bg-gradient-to-r from-indigo-600 to-purple-600 border-0 hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                >
                  <span className="flex items-center justify-center gap-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                    </svg>
                    Начать
                  </span>
                </Link>
                <Link 
                  to="/login" 
                  className="btn px-10 py-4 text-lg font-medium bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 text-gray-300 hover:from-gray-700 hover:to-gray-800 hover:border-gray-600 hover:text-white hover:shadow-lg transition-all duration-300"
                >
                  <span className="flex items-center justify-center gap-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                    </svg>
                    Вход
                  </span>
                </Link>
              </>
            ) : (
              <>
                <Link 
                  to="/profile" 
                  className="btn btn-primary px-10 py-4 text-lg font-medium bg-gradient-to-r from-indigo-600 to-purple-600 border-0 hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                >
                  <span className="flex items-center justify-center gap-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    Мой профиль
                  </span>
                </Link>
                <Link 
                  to="/search" 
                  className="btn btn-primary px-10 py-4 text-lg font-medium bg-gradient-to-r from-indigo-600 to-purple-600 border-0 hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                >
                  <span className="flex items-center justify-center gap-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                    Найти людей
                  </span>
                </Link>
              </>
            )}
          </div>

          {/* Декоративные элементы */}
          <div className="mt-16">
            <div className="flex justify-center gap-3 mb-4">
              <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse"></div>
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse delay-150"></div>
              <div className="w-3 h-3 bg-pink-500 rounded-full animate-pulse delay-300"></div>
            </div>
            <p className="text-gray-500 text-sm">
              Присоединяйтесь к творческим людям
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}