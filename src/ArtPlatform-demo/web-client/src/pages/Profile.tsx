import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileApi } from '../api/profile-client';
import { clearToken, getUserIdFromToken, getUserRoleFromToken } from '../lib/auth';

type UserStats = {
  publishedOrdersCount: number;
  purchasedProductsCount: number;
  activeOrdersCount: number;
};

type ContentCreatorStats = {
  productsCount: number;
  productsSoldCount: number;
  projectsCount: number;
  ordersCompletedCount: number;
  averageRating: number;
  becameCreatorDate?: string;
};

type SocialStats = {
  followersCount: number;
  followingCount: number;
};

type ContactInfo = {
  email?: string;
  website?: string;
  telegram?: string;
  otherContact?: string;
};

type ProfileModel = {
  userId: string;
  userName?: string;
  displayName?: string;
  bio?: string;
  contact?: ContactInfo | string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
  creatorStats?: ContentCreatorStats;
  userStats?: UserStats;
  socialStats?: SocialStats;
};

export default function Profile() {
  const [profile, setProfile] = useState<ProfileModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgType, setMsgType] = useState<'info' | 'error'>('info');

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [contact, setContact] = useState<ContactInfo>({});

  // Состояния для редактирования статистик
  const [editCreatorStats, setEditCreatorStats] = useState(false);
  const [creatorStatsDraft, setCreatorStatsDraft] = useState<ContentCreatorStats>({
    productsCount: 0,
    productsSoldCount: 0,
    projectsCount: 0,
    ordersCompletedCount: 0,
    averageRating: 0,
  });

  const [editUserStats, setEditUserStats] = useState(false);
  const [userStatsDraft, setUserStatsDraft] = useState<UserStats>({
    publishedOrdersCount: 0,
    purchasedProductsCount: 0,
    activeOrdersCount: 0,
  });

  const [editSocialStats, setEditSocialStats] = useState(false);
  const [socialStatsDraft, setSocialStatsDraft] = useState<SocialStats>({
    followersCount: 0,
    followingCount: 0,
  });

  const navigate = useNavigate();
  const userId = getUserIdFromToken();
  
  // Получаем userRole ПЕРЕД использованием
  const userRole = getUserRoleFromToken();
  
  // Теперь можем использовать userRole
  const [currentRole, setCurrentRole] = useState<string | null>(userRole);
  
  // Используем useRef для хранения интервала
  const rolePollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const parseError = (e: unknown) => {
    if (!e) return 'Неизвестная ошибка';
    if (typeof e === 'string') return e;
    if (e instanceof Error) return e.message;
    const anyE = e as any;
    return anyE?.response?.data?.message ?? anyE?.response?.data?.error ?? anyE?.response?.data ?? 'Ошибка';
  };

  async function loadProfile() {
    if (!userId) {
      setMsgType('error');
      setMsg('Пользователь не найден. Войдите в систему.');
      navigate('/login');
      return;
    }

    setLoading(true);
    setMsg(null);
    try {
      const res = await profileApi.getMyProfile();
      const p = res.data as ProfileModel;
      setProfile(p);
      setDisplayName(p.displayName ?? '');
      setBio(p.bio ?? '');

      if (p.contact) {
        if (typeof p.contact === 'object') setContact(p.contact as ContactInfo);
        else {
          try {
            const parsed = JSON.parse(String(p.contact));
            setContact(typeof parsed === 'object' ? parsed : { otherContact: String(p.contact) });
          } catch {
            setContact({ otherContact: String(p.contact) });
          }
        }
      } else setContact({});
      
      if (p.creatorStats) {
        setCreatorStatsDraft({
          productsCount: p.creatorStats.productsCount || 0,
          productsSoldCount: p.creatorStats.productsSoldCount || 0,
          projectsCount: p.creatorStats.projectsCount || 0,
          ordersCompletedCount: p.creatorStats.ordersCompletedCount || 0,
          averageRating: p.creatorStats.averageRating || 0,
          becameCreatorDate: p.creatorStats.becameCreatorDate,
        });
      }

      if (p.userStats) {
        setUserStatsDraft({
          publishedOrdersCount: p.userStats.publishedOrdersCount || 0,
          purchasedProductsCount: p.userStats.purchasedProductsCount || 0,
          activeOrdersCount: p.userStats.activeOrdersCount || 0,
        });
      }

      if (p.socialStats) {
        setSocialStatsDraft({
          followersCount: p.socialStats.followersCount || 0,
          followingCount: p.socialStats.followingCount || 0,
        });
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        setMsgType('error');
        setMsg('Требуется авторизация.');
        clearToken();
        navigate('/login');
      } else {
        setMsgType('error');
        setMsg(`Ошибка загрузки: ${parseError(err)}`);
      }
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  const checkAndUpdateRole = () => {
    try {
      const newRole = getUserRoleFromToken();
      
      // Если роль из токена отличается от текущей
      if (newRole !== currentRole) {
        console.log(`Роль изменилась: ${currentRole} -> ${newRole}`);
        setCurrentRole(newRole);
        
        // Если роль стала отличной от 'unauthorize', останавливаем опрос
        if (newRole && newRole !== 'unauthorize' && rolePollingRef.current) {
          clearInterval(rolePollingRef.current);
          rolePollingRef.current = null;
        }
      }
    } catch (error) {
      console.error('Ошибка при проверке роли:', error);
    }
  };

  useEffect(() => {
    loadProfile();
    
    checkAndUpdateRole();
  
    // Если роль 'unauthorize', запускаем периодическую проверку
    if (currentRole === 'unauthorize' || !currentRole) {
      const interval = setInterval(checkAndUpdateRole, 2000);
      rolePollingRef.current = interval;
        
      // Останавливаем через 30 секунд на всякий случай
      setTimeout(() => {
        if (rolePollingRef.current) {
          clearInterval(rolePollingRef.current);
          rolePollingRef.current = null;
        }
      }, 30000);
    }

    return () => {
      if (rolePollingRef.current) {
        clearInterval(rolePollingRef.current);
        rolePollingRef.current = null;
      }
    };
  }, []);

  async function handleUpdate(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!userId) return;
    setMsg(null);
    try {
      const payload = {
        displayName: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
        contact: Object.keys(contact).length ? contact : undefined
      };
      const res = await profileApi.updateMyProfile(payload);
      setProfile(res.data.profile ?? res.data);
      setMsgType('info');
      setMsg('Профиль обновлён');
      setEditing(false);
    } catch (err) {
      setMsgType('error');
      setMsg(`Ошибка обновления: ${parseError(err)}`);
    }
  }

  async function handleDelete() {
    if (!confirm('Вы уверены? Это действие удалит ваш профиль.')) return;
    try {
      await profileApi.deleteMyProfile();
      setMsgType('info');
      setMsg('Профиль удалён. Выход...');
      clearToken();
      setTimeout(() => {
        navigate('/');
        window.location.reload();
      }, 900);
    } catch (err) {
      setMsgType('error');
      setMsg(`Ошибка удаления: ${parseError(err)}`);
    }
  }

  async function saveCreatorStats() {
    try {
      setProfile(prev => prev ? {
        ...prev,
        creatorStats: creatorStatsDraft
      } : null);
      setMsgType('info');
      setMsg('Статистика контент-креатора обновлена');
      setEditCreatorStats(false);
    } catch (err) {
      setMsgType('error');
      setMsg(`Ошибка: ${parseError(err)}`);
    }
  }

  async function saveUserStats() {
    try {
      setProfile(prev => prev ? {
        ...prev,
        userStats: userStatsDraft
      } : null);
      setMsgType('info');
      setMsg('Статистика заказчика обновлена');
      setEditUserStats(false);
    } catch (err) {
      setMsgType('error');
      setMsg(`Ошибка: ${parseError(err)}`);
    }
  }

  async function saveSocialStats() {
    try {
      setProfile(prev => prev ? {
        ...prev,
        socialStats: socialStatsDraft
      } : null);
      setMsgType('info');
      setMsg('Социальная статистика обновлена');
      setEditSocialStats(false);
    } catch (err) {
      setMsgType('error');
      setMsg(`Ошибка: ${parseError(err)}`);
    }
  }

  // Используем currentRole вместо userRole
  const isContentCreatorOrAdmin = () => {
    const role = currentRole?.toLowerCase();
    return role === 'contentcreator' || role === 'admin';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mb-4"></div>
          <p className="text-gray-300 text-xl">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-2xl text-white mb-2">Профиль не найден</h1>
          <p className="text-gray-400 mb-6">Попробуйте войти снова</p>
          <button 
            onClick={() => navigate('/login')} 
            className="btn btn-primary"
          >
            Войти
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Фоновые круги */}
      <div className="fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-1000"></div>
        <div className="absolute top-3/4 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>
      </div>

      {/* Собственная шапка для страницы профиля */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-gray-800/95 via-gray-900/95 to-gray-800/95 backdrop-blur-lg border-b border-gray-700/50 shadow-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate('/')} 
              className="text-gray-300 hover:text-white font-medium transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              На главную
            </button>
            
            <div className="text-xl font-bold text-white">ArtPlatform</div>
            
            <button 
              onClick={() => { clearToken(); navigate('/login'); }}
              className="text-gray-300 hover:text-white font-medium transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Выйти
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="max-w-6xl mx-auto">
          {/* Уведомления */}
          {msg && (
            <div className={`alert ${msgType === 'info' ? 'alert-success' : 'alert-error'} shadow-lg mb-6`}>
              <div>
                {msgType === 'info' ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                )}
                <span>{msg}</span>
              </div>
            </div>
          )}

          {/* Основная карточка профиля */}
          <div className="card bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-lg shadow-2xl border border-gray-700/50 mb-8">
            <div className="card-body p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
                {/* Аватар */}
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-2xl">
                    <span className="text-4xl text-white font-bold">
                      {profile.displayName?.[0]?.toUpperCase() || profile.userName?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                </div>

                {/* Информация профиля */}
                <div className="flex-grow">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-bold text-white mb-2">
                        {profile.displayName || profile.userName}
                      </h1>
                      <p className="text-gray-400 text-lg">@{profile.userName}</p>
                    </div>
                    
                    <div className="mt-4 md:mt-0">
                      {/* Улучшенный блок с ролью - ИСПОЛЬЗУЕМ currentRole */}
                      <div className="px-5 py-3 bg-gradient-to-r from-indigo-500/40 to-purple-500/40 border-2 border-indigo-400/50 rounded-xl shadow-lg">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                          </svg>
                          <span className="text-lg font-semibold text-white">
                            {currentRole === 'unauthorize' ? 'Ожидание подтверждения...' : currentRole || 'Пользователь'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Дата создания */}
                  {profile.createdAt && (
                    <p className="text-gray-500 text-sm mt-2">
                      <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                      Участник с {new Date(profile.createdAt).toLocaleDateString('ru-RU')}
                    </p>
                  )}
                </div>
              </div>

              {/* Кнопки действий - растянуты по всей ширине */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {!editing ? (
                  <>
                    <button 
                      onClick={() => setEditing(true)} 
                      className="btn btn-primary w-full gap-2 py-3"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                      Редактировать профиль
                    </button>
                    
                    <button 
                      onClick={() => navigate('/change-password')} 
                      className="btn bg-gradient-to-r w-full gap-2 py-3"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                      </svg>
                      Сменить пароль
                    </button>
                    
                    <button 
                      onClick={handleDelete} 
                      className="btn btn-error w-full gap-2 py-3"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                      Удалить профиль
                    </button>
                  </>
                ) : (
                  <div className="col-span-3">
                    <form onSubmit={handleUpdate} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text text-gray-300 font-semibold">Отображаемое имя</span>
                          </label>
                          <input 
                             type="text" 
                             className="input input-bordered w-full bg-gray-800/50 border-gray-600 text-white p-3"
                             value={displayName}
                             onChange={(e) => setDisplayName(e.target.value)}
                             placeholder="только буквы, цифры и _"
                             pattern="[a-zA-Z0-9_]{3,50}"
                             title="Минимум 3 символа, максимум 50. Только буквы, цифры и подчеркивание"
                             required
                           />
                           <div className="label">
                             <span className="label-text-alt text-gray-500">{displayName.length}/50</span>
                           </div>
                        </div>
                        
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text text-gray-300 font-semibold">Email</span>
                          </label>
                          <input 
                            type="email" 
                            className="input input-bordered w-full bg-gray-800/50 border-gray-600 text-white p-3"
                            value={contact.email || ''}
                            onChange={(e) => setContact({ ...contact, email: e.target.value })}
                            placeholder="email@example.com"
                          />
                        </div>
                      </div>
                      
                      <div className="form-control">
                        <label className="label">
                            <span className="label-text text-gray-300 font-semibold">О себе</span>
                        </label>
                        <textarea 
                            className="textarea textarea-bordered w-full bg-gray-800/50 border-gray-600 text-white p-3 h-32"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Расскажите о себе... (максимум 500 символов)"
                            maxLength={500}
                        />
                        <div className="label">
                            <span className="label-text-alt text-gray-500">{bio.length}/500</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text text-gray-300 font-semibold">Веб-сайт</span>
                          </label>
                          <input 
                            type="url" 
                            className="input input-bordered w-full bg-gray-800/50 border-gray-600 text-white p-3"
                            value={contact.website || ''}
                            onChange={(e) => setContact({ ...contact, website: e.target.value })}
                            placeholder="https://example.com"
                          />
                        </div>
                        
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text text-gray-300 font-semibold">Telegram</span>
                          </label>
                          <input 
                            type="text" 
                            className="input input-bordered w-full bg-gray-800/50 border-gray-600 text-white p-3"
                            value={contact.telegram || ''}
                            onChange={(e) => setContact({ ...contact, telegram: e.target.value })}
                            placeholder="@username или ссылка"
                          />
                        </div>
                      </div>
                      
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text text-gray-300 font-semibold">Другие контакты</span>
                        </label>
                        <textarea 
                          className="textarea textarea-bordered w-full bg-gray-800/50 border-gray-600 text-white p-3"
                          value={contact.otherContact || ''}
                          onChange={(e) => setContact({ ...contact, otherContact: e.target.value })}
                          placeholder="Дополнительная контактная информация"
                          rows={2}
                        />
                      </div>
                      
                      <div className="flex gap-3">
                        <button 
                         type="submit" 
                         className="btn btn-primary gap-2 py-3 px-6 text-base font-medium bg-gradient-to-r from-indigo-600 to-purple-600 border-0 hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg transition-all"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                          Сохранить
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setEditing(false)}
                          className="btn py-3 px-6 text-base font-medium bg-gradient-to-r from-gray-700 to-gray-800 border border-gray-600 text-gray-200 hover:from-gray-600 hover:to-gray-700 hover:border-gray-500 hover:shadow-lg transition-all"
                        >
                          Отмена
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>

              {/* Биография и контакты */}
              {!editing && (
                <div className="space-y-6">
                  {profile.bio && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-300 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                        О себе
                      </h3>
                      <p className="text-gray-400 bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">{profile.bio}</p>
                    </div>
                  )}
                  
                  {Object.keys(contact).length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-300 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                        </svg>
                        Контакты
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {contact.email && (
                          <div className="flex items-center gap-2 text-gray-400 bg-gray-800/30 rounded-lg p-3 border border-gray-700/50">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                            </svg>
                            <span>{contact.email}</span>
                          </div>
                        )}
                        {contact.website && (
                          <div className="flex items-center gap-2 text-gray-400 bg-gray-800/30 rounded-lg p-3 border border-gray-700/50">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
                            </svg>
                            <a href={contact.website} className="text-indigo-400 hover:text-indigo-300" target="_blank" rel="noopener noreferrer">
                              {contact.website}
                            </a>
                          </div>
                        )}
                        {contact.telegram && (
                          <div className="flex items-center gap-2 text-gray-400 bg-gray-800/30 rounded-lg p-3 border border-gray-700/50">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
                            </svg>
                            <span>{contact.telegram}</span>
                          </div>
                        )}
                        {contact.otherContact && (
                          <div className="flex items-center gap-2 text-gray-400 bg-gray-800/30 rounded-lg p-3 border border-gray-700/50">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path>
                            </svg>
                            <span>{contact.otherContact}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Статистика в карточках */}
          <div className={`grid gap-6 mb-8 ${isContentCreatorOrAdmin() ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
            
            {/* Карточка статистики контент-креатора (только для контент-креаторов и админов) */}
            {isContentCreatorOrAdmin() && (
              <div className="card bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-lg shadow-xl border border-gray-700/50">
                <div className="card-body p-6">
                  <div className="mb-6">
                    <h3 className="card-title text-lg text-white mb-2">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path>
                      </svg>
                      Статистика контент-креатора
                    </h3>
                  </div>
                  
                  {!editCreatorStats ? (
                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between items-center p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                        <span className="text-gray-400">Товары</span>
                        <span className="text-2xl font-bold text-indigo-400">
                          {profile.creatorStats?.productsCount || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                        <span className="text-gray-400">Продано товаров</span>
                        <span className="text-2xl font-bold text-green-400">
                          {profile.creatorStats?.productsSoldCount || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                        <span className="text-gray-400">Проекты</span>
                        <span className="text-2xl font-bold text-purple-400">
                          {profile.creatorStats?.projectsCount || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                        <span className="text-gray-400">Выполнено заказов</span>
                        <span className="text-2xl font-bold text-yellow-400">
                          {profile.creatorStats?.ordersCompletedCount || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                        <span className="text-gray-400">Средний рейтинг</span>
                        <span className="text-2xl font-bold text-pink-400">
                          {profile.creatorStats?.averageRating?.toFixed(1) || '0.0'}
                        </span>
                      </div>
                      {profile.creatorStats?.becameCreatorDate && (
                        <div className="flex justify-between items-center p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                          <span className="text-gray-400">Дата получения роли</span>
                          <span className="text-lg font-semibold text-gray-300">
                            {new Date(profile.creatorStats.becameCreatorDate).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4 mb-6">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text text-gray-300">Товары</span>
                        </label>
                        <input 
                          type="number" 
                          className="input input-bordered w-full bg-gray-800/50 border-gray-600 text-white"
                          value={creatorStatsDraft.productsCount}
                          onChange={(e) => setCreatorStatsDraft({ 
                            ...creatorStatsDraft, 
                            productsCount: parseInt(e.target.value) || 0 
                          })}
                        />
                      </div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text text-gray-300">Продано товаров</span>
                        </label>
                        <input 
                          type="number" 
                          className="input input-bordered w-full bg-gray-800/50 border-gray-600 text-white"
                          value={creatorStatsDraft.productsSoldCount}
                          onChange={(e) => setCreatorStatsDraft({ 
                            ...creatorStatsDraft, 
                            productsSoldCount: parseInt(e.target.value) || 0 
                          })}
                        />
                      </div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text text-gray-300">Проекты</span>
                        </label>
                        <input 
                          type="number" 
                          className="input input-bordered w-full bg-gray-800/50 border-gray-600 text-white"
                          value={creatorStatsDraft.projectsCount}
                          onChange={(e) => setCreatorStatsDraft({ 
                            ...creatorStatsDraft, 
                            projectsCount: parseInt(e.target.value) || 0 
                          })}
                        />
                      </div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text text-gray-300">Выполнено заказов</span>
                        </label>
                        <input 
                          type="number" 
                          className="input input-bordered w-full bg-gray-800/50 border-gray-600 text-white"
                          value={creatorStatsDraft.ordersCompletedCount}
                          onChange={(e) => setCreatorStatsDraft({ 
                            ...creatorStatsDraft, 
                            ordersCompletedCount: parseInt(e.target.value) || 0 
                          })}
                        />
                      </div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text text-gray-300">Средний рейтинг</span>
                        </label>
                        <input 
                          type="number" 
                          step="0.1"
                          className="input input-bordered w-full bg-gray-800/50 border-gray-600 text-white"
                          value={creatorStatsDraft.averageRating}
                          onChange={(e) => setCreatorStatsDraft({ 
                            ...creatorStatsDraft, 
                            averageRating: parseFloat(e.target.value) || 0 
                          })}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Кнопки редактирования */}
                  <div className="mt-auto">
                    <button 
                      onClick={() => setEditCreatorStats(!editCreatorStats)}
                      className="btn w-full bg-gradient-to-r from-gray-700 to-gray-800 border border-gray-600 text-gray-200 hover:from-gray-600 hover:to-gray-700 hover:border-gray-500 hover:shadow-lg transition-all"
                    >
                      {editCreatorStats ? 'Отменить' : 'Изменить'}
                    </button>
                    {editCreatorStats && (
                      <button 
                        onClick={saveCreatorStats}
                        className="btn w-full mt-3 bg-gradient-to-r from-indigo-600 to-purple-600 border-0 text-white hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg py-3 text-base font-medium"
                      >
                        Сохранить
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Карточка социальной статистики (для всех) */}
            <div className="card bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-lg shadow-xl border border-gray-700/50">
              <div className="card-body p-6">
                <div className="mb-6">
                  <h3 className="card-title text-lg text-white mb-2">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                    </svg>
                    Социальная статистика
                  </h3>
                </div>
                
                {!editSocialStats ? (
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                      <span className="text-gray-400">Подписчики</span>
                      <span className="text-2xl font-bold text-blue-400">
                        {profile.socialStats?.followersCount || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                      <span className="text-gray-400">Подписки</span>
                      <span className="text-2xl font-bold text-green-400">
                        {profile.socialStats?.followingCount || 0}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 mb-6">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-gray-300">Подписчики</span>
                      </label>
                      <input 
                        type="number" 
                        className="input input-bordered w-full bg-gray-800/50 border-gray-600 text-white"
                        value={socialStatsDraft.followersCount}
                        onChange={(e) => setSocialStatsDraft({ 
                          ...socialStatsDraft, 
                          followersCount: parseInt(e.target.value) || 0 
                        })}
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-gray-300">Подписки</span>
                      </label>
                      <input 
                        type="number" 
                        className="input input-bordered w-full bg-gray-800/50 border-gray-600 text-white"
                        value={socialStatsDraft.followingCount}
                        onChange={(e) => setSocialStatsDraft({ 
                          ...socialStatsDraft, 
                          followingCount: parseInt(e.target.value) || 0 
                        })}
                      />
                    </div>
                  </div>
                )}
                
                {/* Кнопки редактирования */}
                <div className="mt-auto">
                  <button 
                    onClick={() => setEditSocialStats(!editSocialStats)}
                    className="btn w-full bg-gradient-to-r from-gray-700 to-gray-800 border border-gray-600 text-gray-200 hover:from-gray-600 hover:to-gray-700 hover:border-gray-500 hover:shadow-lg transition-all"
                  >
                    {editSocialStats ? 'Отменить' : 'Изменить'}
                  </button>
                  {editSocialStats && (
                    <button 
                      onClick={saveSocialStats}
                      className="btn w-full mt-3 bg-gradient-to-r from-indigo-600 to-purple-600 border-0 text-white hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg py-3 text-base font-medium"
                    >
                      Сохранить
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Карточка статистики заказчика (для всех) */}
            <div className="card bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-lg shadow-xl border border-gray-700/50">
              <div className="card-body p-6">
                <div className="mb-6">
                  <h3 className="card-title text-lg text-white mb-2">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                    </svg>
                    Статистика заказчика
                  </h3>
                </div>
                
                {!editUserStats ? (
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                      <span className="text-gray-400">Завершенные заказы</span>
                      <span className="text-2xl font-bold text-indigo-400">
                        {profile.userStats?.publishedOrdersCount || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                      <span className="text-gray-400">Активные заказы</span>
                      <span className="text-2xl font-bold text-yellow-400">
                        {profile.userStats?.activeOrdersCount || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                      <span className="text-gray-400">Куплено товаров</span>
                      <span className="text-2xl font-bold text-green-400">
                        {profile.userStats?.purchasedProductsCount || 0}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 mb-6">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-gray-300">Завершенные заказы</span>
                      </label>
                      <input 
                        type="number" 
                        className="input input-bordered w-full bg-gray-800/50 border-gray-600 text-white"
                        value={userStatsDraft.publishedOrdersCount}
                        onChange={(e) => setUserStatsDraft({ 
                          ...userStatsDraft, 
                          publishedOrdersCount: parseInt(e.target.value) || 0 
                        })}
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-gray-300">Активные заказы</span>
                      </label>
                      <input 
                        type="number" 
                        className="input input-bordered w-full bg-gray-800/50 border-gray-600 text-white"
                        value={userStatsDraft.activeOrdersCount}
                        onChange={(e) => setUserStatsDraft({ 
                          ...userStatsDraft, 
                          activeOrdersCount: parseInt(e.target.value) || 0 
                        })}
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-gray-300">Куплено товаров</span>
                      </label>
                      <input 
                        type="number" 
                        className="input input-bordered w-full bg-gray-800/50 border-gray-600 text-white"
                        value={userStatsDraft.purchasedProductsCount}
                        onChange={(e) => setUserStatsDraft({ 
                          ...userStatsDraft, 
                          purchasedProductsCount: parseInt(e.target.value) || 0 
                        })}
                      />
                    </div>
                  </div>
                )}
                
                {/* Кнопки редактирования */}
                <div className="mt-auto">
                  <button 
                    onClick={() => setEditUserStats(!editUserStats)}
                    className="btn w-full bg-gradient-to-r from-gray-700 to-gray-800 border border-gray-600 text-gray-200 hover:from-gray-600 hover:to-gray-700 hover:border-gray-500 hover:shadow-lg transition-all"
                  >
                    {editUserStats ? 'Отменить' : 'Изменить'}
                  </button>
                  {editUserStats && (
                    <button 
                      onClick={saveUserStats}
                      className="btn w-full mt-3 bg-gradient-to-r from-indigo-600 to-purple-600 border-0 text-white hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg py-3 text-base font-medium"
                    >
                      Сохранить
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Декоративные элементы */}
          <div className="flex justify-center gap-4 mt-12">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-75"></div>
            <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce delay-150"></div>
          </div>
        </div>
      </div>
    </div>
  );
}