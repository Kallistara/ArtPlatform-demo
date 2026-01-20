import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { profileApi } from '../api/profile-client';
import Layout from '../components/Layout';

interface SearchResult {
  userId: string;
  userName?: string;
  displayName?: string;
  bio?: string;
  role?: string;
  createdAt?: string;
}

export default function SearchPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseError = (e: unknown) => {
    if (!e) return 'Неизвестная ошибка';
    if (typeof e === 'string') return e;
    if (e instanceof Error) return e.message;
    const anyE = e as any;
    return anyE?.response?.data?.message ?? anyE?.response?.data?.error ?? 'Ошибка';
  };

  // если в URL задан q, выполняем поиск сразу
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const urlQuery = searchParams.get('q');
    if (urlQuery) {
      setQuery(urlQuery);
      performSearch(urlQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  async function performSearch(searchQuery: string) {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setResults([]);
      setSearchPerformed(false);
      return;
    }

    setLoading(true);
    setError(null);
    setSearchPerformed(true);

    try {
      const res = await profileApi.searchProfiles(trimmed);
      // Фильтруем пользователей с ролью Unauthorize
      const users: SearchResult[] = (res.data || []).filter(user => 
        user.role !== 'Unauthorized' && user.role !== 'unauthorized'
      );
      setResults(users);
    } catch (err: unknown) {
      setError(`Ошибка поиска: ${parseError(err)}`);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query)}`, { replace: true });
    performSearch(query);
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Уведомления об ошибках */}
        {error && (
          <div className="alert alert-error shadow-lg mb-6">
            <div>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Заголовок страницы */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Поиск пользователей</h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Ищите по имени, никнейму или описанию
          </p>
        </div>

        {/* Карточка поиска */}
        <div className="card bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-lg shadow-2xl border border-gray-700/50 mb-10">
          <div className="card-body p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="form-control">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Введите имя, никнейм или описание..."
                    className="input input-bordered w-full pl-14 pr-32 bg-gray-800/50 border-gray-600 text-white text-lg py-5 h-16 text-base"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <svg className="w-6 h-6 absolute left-5 top-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                  <button 
                    type="submit" 
                    className={`btn absolute right-2 top-2 h-12 px-8 min-h-0 bg-gradient-to-r from-cyan-500 to-blue-500 border-0 text-white hover:from-cyan-600 hover:to-blue-600 hover:shadow-lg ${loading ? 'loading' : ''}`} 
                    disabled={loading}
                  >
                    <span className="text-base font-medium">
                      {loading ? 'Поиск...' : 'Найти'}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {searchPerformed ? (
          <div className="card bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-lg shadow-2xl border border-gray-700/50">
            <div className="card-body p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                <div>
                  <h2 className="card-title text-2xl text-white mb-3">
                    Результаты поиска
                    {results.length > 0 && (
                      <span className="badge badge-primary badge-lg ml-4 px-3 py-2 text-base">{results.length}</span>
                    )}
                  </h2>
                  {query && (
                    <div className="text-gray-400 text-lg">
                      По запросу: <span className="font-semibold text-white">"{query}"</span>
                    </div>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="inline-block animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-purple-500 mb-6"></div>
                  <p className="text-gray-400 text-xl">Выполняется поиск...</p>
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-16">
                  <svg className="w-24 h-24 mx-auto text-gray-500 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <h3 className="text-2xl font-semibold text-white mb-4">Ничего не найдено</h3>
                  <p className="text-gray-400 text-lg mb-8">Попробуйте изменить поисковый запрос</p>
                  <button 
                    onClick={() => { 
                      setQuery(''); 
                      setResults([]); 
                      setSearchPerformed(false); 
                      navigate('/search'); 
                    }} 
                    className="btn btn-outline border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-700 px-8 py-3 text-base"
                  >
                    Сбросить поиск
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {results.map((user) => (
                      <div 
                        key={user.userId} 
                        className="card bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-lg shadow-xl border border-gray-700/50 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                      >
                        <div className="card-body p-6">
                          <div className="flex items-start gap-5 mb-5">
                            {/* Аватар пользователя */}
                            <div className="flex-shrink-0">
                              <div className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                                <span className="text-xl font-bold text-white">
                                  {(user.displayName?.[0] || user.userName?.[0] || 'U').toUpperCase()}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <h3 className="card-title text-lg text-white truncate mb-1">
                                    {user.displayName || user.userName}
                                  </h3>
                                  <p className="text-gray-400 text-sm truncate">@{user.userName}</p>
                                </div>
                                {user.role && (
                                  <div className="ml-4">
                                    <span className={`badge ${
                                      user.role === 'Admin' ? 'badge-error' : 
                                      user.role === 'ContentCreator' ? 'badge-warning' : 
                                      'badge-success'
                                    } text-xs px-2 py-1`}>
                                      {user.role}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Описание профиля */}
                          {user.bio && (
                            <p className="text-gray-300 text-sm line-clamp-3 mb-5 p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
                              {user.bio}
                            </p>
                          )}

                          <div className="card-actions justify-end">
                            <button 
                              onClick={() => navigate(`/user/${user.userId}`)} 
                              className="btn btn-outline border-gray-600 text-gray-300 hover:border-indigo-500 hover:text-indigo-300 hover:bg-indigo-500/10 px-5 py-2 text-sm"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Посмотреть профиль
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Статистика поиска */}
                  <div className="mt-12 pt-8 border-t border-gray-700/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                      <div className="text-gray-400 text-lg mb-6 md:mb-0">
                        Найдено <span className="text-white font-semibold">{results.length}</span> пользователей
                      </div>
                      <div className="flex gap-4">
                        <button 
                          onClick={() => { 
                            setQuery(''); 
                            setResults([]); 
                            setSearchPerformed(false); 
                            navigate('/search'); 
                          }} 
                          className="btn btn-primary px-8 py-3"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Новый поиск
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          /* Подсказки для поиска (показываются когда нет активного поиска) */
          <div className="mt-16">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-white mb-10">Как искать пользователей</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <div className="card bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-lg shadow-xl border border-gray-700/50 hover:border-indigo-500/50 transition-all duration-300">
                  <div className="card-body p-6">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-full">
                        <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    </div>
                    <h4 className="text-xl font-bold text-white mb-3 text-center">По имени</h4>
                    <p className="text-gray-400 text-base text-center leading-relaxed">
                      Ищите по имени пользователя или отображаемому имени
                    </p>
                  </div>
                </div>
                <div className="card bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-lg shadow-xl border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300">
                  <div className="card-body p-6">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-full">
                        <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                      </div>
                    </div>
                    <h4 className="text-xl font-bold text-white mb-3 text-center">По описанию</h4>
                    <p className="text-gray-400 text-base text-center leading-relaxed">
                      Используйте ключевые слова из описания профиля
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-16">
              <h4 className="text-2xl font-bold text-white mb-6">Популярные запросы</h4>
              <div className="flex flex-wrap justify-center gap-3">
                <button 
                  onClick={() => { setQuery('дизайн'); performSearch('дизайн'); }}
                  className="badge badge-outline text-gray-300 border-gray-600 hover:border-indigo-500 hover:text-indigo-300 px-4 py-2 text-sm"
                >
                  дизайн
                </button>
                <button 
                  onClick={() => { setQuery('художник'); performSearch('художник'); }}
                  className="badge badge-outline text-gray-300 border-gray-600 hover:border-indigo-500 hover:text-indigo-300 px-4 py-2 text-sm"
                >
                  художник
                </button>
                <button 
                  onClick={() => { setQuery('digital'); performSearch('digital'); }}
                  className="badge badge-outline text-gray-300 border-gray-600 hover:border-indigo-500 hover:text-indigo-300 px-4 py-2 text-sm"
                >
                  digital
                </button>
                <button 
                  onClick={() => { setQuery('test'); performSearch('test'); }}
                  className="badge badge-outline text-gray-300 border-gray-600 hover:border-indigo-500 hover:text-indigo-300 px-4 py-2 text-sm"
                >
                  test
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Декоративные элементы */}
        <div className="flex justify-center gap-4 mt-20">
          <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce delay-75"></div>
          <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce delay-150"></div>
        </div>
      </div>
    </Layout>
  );
}