import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { roleApi } from '../api/role-client';
import { getUserIdFromToken } from '../lib/auth';
import Layout from '../components/Layout';

interface RoleUser {
  userId: string;
  role: string;
  assignedBy?: string;
  assignedAt: string;
}

export default function AdminRoles() {
  const [usersByRole, setUsersByRole] = useState<Record<string, RoleUser[]>>({ 
    Admin: [], 
    ContentCreator: [], 
    User: [] 
  });
  const [selectedRole, setSelectedRole] = useState('User');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const currentUserId = getUserIdFromToken();
  const navigate = useNavigate();

  const parseError = (e: unknown) => {
    if (!e) return 'Неизвестная ошибка';
    if (typeof e === 'string') return e;
    if (e instanceof Error) return e.message;
    const anyE = e as any;
    return anyE?.response?.data?.error ?? anyE?.response?.data?.message ?? String(anyE);
  };

  async function loadUsersByRole() {
    setLoading(true);
    setMessage(null);
    try {
      const roles = ['Admin', 'ContentCreator', 'User'];
      const results: Record<string, RoleUser[]> = { Admin: [], ContentCreator: [], User: [] };

      await Promise.all(roles.map(async (r) => {
        try {
          const res = await roleApi.getByRole(r);
          results[r] = res.data || [];
        } catch {
          results[r] = [];
        }
      }));

      setUsersByRole(results);
    } catch {
      setMessage({ text: 'Ошибка загрузки пользователей', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsersByRole();
  }, []);

  async function handleChangeRole(userId: string, currentRole: string, newRole: string) {
    if (currentRole === newRole) return;
    
    if (!confirm(`Изменить роль пользователя ${userId} с "${currentRole}" на "${newRole}"?`)) return;
    
    if (!currentUserId) { 
      setMessage({ text: 'Не удалось определить текущего пользователя', type: 'error' }); 
      return; 
    }

    try {
      await roleApi.assignRole(userId, { role: newRole, assignedBy: currentUserId });
      setMessage({ text: `Роль изменена на "${newRole}" для пользователя ${userId}`, type: 'success' });
      await loadUsersByRole();
    } catch (err) {
      setMessage({ text: `Ошибка: ${parseError(err)}`, type: 'error' });
    }
  }

  async function handleRemoveRole(userId: string, userRole: string) {
    if (!confirm(`Удалить роль "${userRole}" у пользователя ${userId}?`)) return;
    if (!currentUserId) { 
      setMessage({ text: 'Не удалось определить текущего пользователя', type: 'error' }); 
      return; 
    }

    try {
      await roleApi.removeRole(userId, currentUserId);
      setMessage({ text: `Роль удалена у пользователя ${userId}`, type: 'success' });
      await loadUsersByRole();
    } catch {
      setMessage({ text: 'Не удалось удалить роль', type: 'error' });
    }
  }

  const filteredUsers = (usersByRole[selectedRole] || []).filter(u =>
    !searchTerm || 
    u.userId.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.assignedBy || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roleStats = {
    Admin: usersByRole.Admin.length,
    ContentCreator: usersByRole.ContentCreator.length,
    User: usersByRole.User.length,
    Total: usersByRole.Admin.length + usersByRole.ContentCreator.length + usersByRole.User.length
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Уведомления */}
        {message && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} shadow-lg mb-6`}>
            <div>
              {message.type === 'success' ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              )}
              <span>{message.text}</span>
            </div>
          </div>
        )}

        {/* Заголовок страницы */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-3">Панель администратора</h1>
          <p className="text-xl text-gray-400">Управление пользователями платформы</p>
        </div>

        {/* Основная таблица */}
        <div className="card bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-lg shadow-2xl border border-gray-700/50 mb-8">
          <div className="card-body p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
              <div>
                <h2 className="card-title text-2xl text-white mb-3">Управление ролями пользователей</h2>
                <p className="text-gray-400">Выберите роль для просмотра и редактирования пользователей</p>
              </div>
              <button 
                onClick={loadUsersByRole} 
                className={`btn mt-4 md:mt-0 h-12 px-6 bg-gradient-to-r from-gray-700 to-gray-800 border border-gray-600 text-gray-300 hover:from-gray-600 hover:to-gray-700 hover:border-gray-500 hover:text-white hover:shadow-lg ${loading ? 'loading' : ''}`} 
                disabled={loading}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Обновить
              </button>
            </div>

            {/* Табы для выбора роли */}
            <div className="flex space-x-2 mb-8 p-1 bg-gray-800/50 rounded-xl">
              {['Admin', 'ContentCreator', 'User'].map((r) => (
                <button 
                  key={r} 
                  className={`flex-1 py-4 px-5 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 ${
                    selectedRole === r 
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`} 
                  onClick={() => setSelectedRole(r)}
                >
                  <span className="font-semibold text-base">
                    {r === 'Admin' ? 'Администраторы' : 
                     r === 'ContentCreator' ? 'Создатели контента' : 
                     'Пользователи'}
                  </span>
                  {/* УВЕЛИЧЕННЫЕ КРУЖОЧКИ - добавлены классы min-w-10 и px-3 */}
                  <span className={`badge ${
                    r === 'Admin' ? 'badge-error' : 
                    r === 'ContentCreator' ? 'badge-warning' : 
                    'badge-success'
                  } badge-lg min-w-10 px-3 flex items-center justify-center`}>
                    {roleStats[r as keyof typeof roleStats]}
                  </span>
                </button>
              ))}
            </div>

            {/* Поиск */}
            <div className="form-control mb-8">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Поиск по User ID или назначившему..." 
                  className="input input-bordered w-full pl-12 bg-gray-800/50 border-gray-600 text-white h-12 text-base" 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                />
                <svg className="w-5 h-5 absolute left-4 top-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                {searchTerm && (
                  <button 
                    className="absolute right-4 top-3.5 text-gray-500 hover:text-white" 
                    onClick={() => setSearchTerm('')}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Загрузка */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="inline-block animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-purple-500 mb-6"></div>
                <p className="text-gray-400 text-xl">Загрузка пользователей...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-6">📋</div>
                <h3 className="text-2xl font-semibold text-white mb-4">Пользователи не найдены</h3>
                <p className="text-gray-400 text-lg mb-8">
                  {searchTerm 
                    ? 'Попробуйте изменить поисковый запрос' 
                    : `Нет пользователей с выбранной ролью`
                  }
                </p>
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="btn btn-outline border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-700 px-8 py-3"
                >
                  Сбросить поиск
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr className="border-gray-700">
                      <th className="bg-gray-800/50 text-gray-300 text-base font-semibold py-4 px-3 w-40">User ID</th>
                      <th className="bg-gray-800/50 text-gray-300 text-base font-semibold py-4 px-3 w-32">Роль</th>
                      <th className="bg-gray-800/50 text-gray-300 text-base font-semibold py-4 px-3 w-36">Дата назначения</th>
                      <th className="bg-gray-800/50 text-gray-300 text-base font-semibold py-4 px-3 w-24 max-w-24">Назначил</th>
                      <th className="bg-gray-800/50 text-gray-300 text-base font-semibold py-4 px-3 w-44">Изменить роль</th>
                      <th className="bg-gray-800/50 text-gray-300 text-base font-semibold py-4 px-3 w-32">Удалить</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.userId} className="border-gray-700 hover:bg-gray-800/30 transition-colors">
                        <td className="py-4 px-3 w-40">
                          <div className="break-words font-mono text-sm text-gray-300">
                            {u.userId}
                            {u.userId === currentUserId && (
                              <span className="badge badge-primary badge-xs ml-2">Вы</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-3 w-32">
                          <span className={`badge ${
                            u.role === 'Admin' ? 'badge-error' : 
                            u.role === 'ContentCreator' ? 'badge-warning' : 
                            'badge-success'
                          } badge-lg px-3 py-2 text-sm font-semibold`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-4 px-3 w-36">
                          <div className="text-gray-300 text-sm">
                            {new Date(u.assignedAt).toLocaleDateString('ru-RU')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(u.assignedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        {/* ОГРАНИЧЕННАЯ ШИРИНА и ПЕРЕНОС ТЕКСТА для колонки Назначил */}
                        <td className="py-4 px-3 w-24 max-w-24">
                          <div className="text-gray-300 text-sm break-words hyphens-auto">
                            {u.assignedBy || <span className="text-gray-500">Система</span>}
                          </div>
                        </td>
                        <td className="py-4 px-3 w-44">
                          <select 
                            className="select select-bordered w-full bg-gray-800/70 border border-gray-600 text-white text-base h-10 min-h-0 hover:border-indigo-500 focus:border-indigo-500 focus:outline-none"
                            value={u.role}
                            onChange={(e) => handleChangeRole(u.userId, u.role, e.target.value)}
                          >
                            <option value="Admin">Admin</option>
                            <option value="ContentCreator">ContentCreator</option>
                            <option value="User">User</option>
                          </select>
                        </td>
                        <td className="py-4 px-3 w-32">
                          {u.userId !== currentUserId && (
                            <button 
                              className="btn btn-error btn-sm h-9 px-3 gap-1 bg-gradient-to-r from-red-600 to-rose-600 border-0 hover:from-red-700 hover:to-rose-700 hover:shadow-lg text-xs" 
                              onClick={() => handleRemoveRole(u.userId, u.role)}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                              Удалить
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Статистика внизу */}
            {filteredUsers.length > 0 && (
              <div className="mt-10 pt-8 border-t border-gray-700/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div className="text-gray-400 text-lg mb-4 md:mb-0">
                    Показано <span className="text-white font-semibold">{filteredUsers.length}</span> из{' '}
                    <span className="text-white font-semibold">{usersByRole[selectedRole]?.length ?? 0}</span> пользователей
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-400">
                      Всего пользователей: <span className="text-white font-semibold">{roleStats.Total}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Блок статистики */}
        <div className="mb-8">
          <div className="card bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-lg shadow-2xl border border-gray-700/50">
            <div className="card-body p-7">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2 justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Статистика по ролям
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex flex-col items-center justify-center p-5 bg-gradient-to-r from-red-600/10 to-rose-600/10 rounded-xl border border-red-500/20 text-center">
                  <div className="text-4xl font-bold text-red-400 mb-2">{roleStats.Admin}</div>
                  <div className="text-gray-200 text-lg font-semibold">Администраторы</div>
                  <div className="text-gray-400 text-sm mt-1">Высший уровень доступа</div>
                </div>
                <div className="flex flex-col items-center justify-center p-5 bg-gradient-to-r from-yellow-600/10 to-amber-600/10 rounded-xl border border-yellow-500/20 text-center">
                  <div className="text-4xl font-bold text-yellow-400 mb-2">{roleStats.ContentCreator}</div>
                  <div className="text-gray-200 text-lg font-semibold">Контент креаторы</div>
                  <div className="text-gray-400 text-sm mt-1">Могут публиковать контент</div>
                </div>
                <div className="flex flex-col items-center justify-center p-5 bg-gradient-to-r from-green-600/10 to-emerald-600/10 rounded-xl border border-green-500/20 text-center">
                  <div className="text-4xl font-bold text-green-400 mb-2">{roleStats.User}</div>
                  <div className="text-gray-200 text-lg font-semibold">Пользователи</div>
                  <div className="text-gray-400 text-sm mt-1">Базовый уровень доступа</div>
                </div>
                <div className="flex flex-col items-center justify-center p-5 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-xl border border-indigo-500/30 text-center">
                  <div className="text-4xl font-bold text-white mb-2">{roleStats.Total}</div>
                  <div className="text-gray-200 text-lg font-semibold">Всего пользователей</div>
                  <div className="text-gray-400 text-sm mt-1">На платформе</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Блок с описанием ролей */}
        <div className="mb-8">
          <div className="card bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-lg shadow-2xl border border-gray-700/50">
            <div className="card-body p-7">
              <h3 className="text-2xl font-bold text-white mb-6 text-center">Описание ролей и их возможностей</h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="p-6 bg-gradient-to-br from-red-600/10 to-rose-600/10 rounded-xl border border-red-500/20">
                  <div className="flex flex-col items-center mb-5">
                    <div className="badge badge-error badge-lg p-3 mb-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-bold text-white text-center">Администраторы</h4>
                  </div>
                  <div className="text-gray-300 space-y-3">
                    <p className="text-base text-center">
                      Полный доступ ко всем функциям системы.
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Назначение ролей пользователям
                      </li>
                      <li className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Управление пользователями платформы
                      </li>
                      <li className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Контроль контента платформы
                      </li>
                      <li className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Доступ к системным настройкам
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="p-6 bg-gradient-to-br from-yellow-600/10 to-amber-600/10 rounded-xl border border-yellow-500/20">
                  <div className="flex flex-col items-center mb-5">
                    <div className="badge badge-warning badge-lg p-3 mb-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-bold text-white text-center">Контент креаторы</h4>
                  </div>
                  <div className="text-gray-300 space-y-3">
                    <p className="text-base text-center">
                      Расширенные возможности для публикации и управления контентом.
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Публикация работ, товаров и проектов
                      </li>
                      <li className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Доступ к статистике просмотров и продаж
                      </li>
                      <li className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Управление своим портфолио
                      </li>
                      <li className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Возможность продавать свои работы
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="p-6 bg-gradient-to-br from-green-600/10 to-emerald-600/10 rounded-xl border border-green-500/20">
                  <div className="flex flex-col items-center mb-5">
                    <div className="badge badge-success badge-lg p-3 mb-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-bold text-white text-center">Пользователи</h4>
                  </div>
                  <div className="text-gray-300 space-y-3">
                    <p className="text-base text-center">
                      Базовые возможности для взаимодействия с платформой.
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Просмотр и поиск контента
                      </li>
                      <li className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Покупка работ и товаров
                      </li>
                      <li className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Комментирование и оценка контента
                      </li>
                      <li className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Подписка на других пользователей
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Декоративные элементы */}
        <div className="flex justify-center gap-4 mt-12">
          <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce delay-75"></div>
          <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce delay-150"></div>
        </div>
      </div>
    </Layout>
  );
}