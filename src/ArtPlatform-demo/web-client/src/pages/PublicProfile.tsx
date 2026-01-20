import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { profileApi } from '../api/profile-client';
import { roleApi } from '../api/role-client';
import { getUserIdFromToken, isLoggedIn } from '../lib/auth';
import Layout from '../components/Layout';

interface ProfileData {
  userId: string;
  userName?: string;
  displayName?: string;
  bio?: string;
  contact?: any;
  createdAt?: string;
  updatedAt?: string;
}

interface RoleData {
  userId: string;
  role: string;
  assignedBy?: string;
  assignedAt: string;
}

interface ContactInfo {
  email?: string;
  website?: string;
  telegram?: string;
  otherContact?: string;
}

export default function PublicProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [role, setRole] = useState<RoleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  const currentUserId = getUserIdFromToken();
  const loggedIn = isLoggedIn();

  useEffect(() => {
    async function loadData() {
      if (!userId) {
        setError('ID пользователя не указан');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setIsOwnProfile(userId === currentUserId);

      try {
        const profileRes = await profileApi.getProfile(userId);
        setProfile(profileRes.data);

        try {
          const roleRes = await roleApi.getRole(userId);
          setRole(roleRes.data);
        } catch {
          setRole(null);
        }
      } catch (err: any) {
        if (err?.response?.status === 404) {
          setError('Пользователь не найден');
        } else {
          setError(`Ошибка загрузки: ${err?.response?.data?.message || err.message || 'Неизвестная ошибка'}`);
        }
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [userId, currentUserId]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mb-4"></div>
            <p className="text-gray-300 text-xl">Загрузка профиля...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !profile) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="alert alert-error shadow-lg">
            <div>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
              <div>
                <h3 className="font-bold text-white">Профиль не найден</h3>
                <div className="text-gray-300">{error}</div>
              </div>
            </div>
            <div className="flex-none">
              <button 
                className="btn btn-outline border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-700" 
                onClick={() => navigate('/search')}
              >
                Вернуться к поиску
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Преобразуем контакты в правильный формат
  let contactInfo: ContactInfo = {};
  if (profile.contact) {
    if (typeof profile.contact === 'object') {
      contactInfo = profile.contact;
    } else {
      try {
        const parsed = JSON.parse(String(profile.contact));
        contactInfo = typeof parsed === 'object' ? parsed : { otherContact: String(profile.contact) };
      } catch {
        contactInfo = { otherContact: String(profile.contact) };
      }
    }
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Основная карточка профиля */}
        <div className="card bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-lg shadow-2xl border border-gray-700/50">
          <div className="card-body p-8">
            <div className="flex flex-col md:flex-row items-start gap-8 mb-8">
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
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                      {profile.displayName || profile.userName}
                    </h1>
                    <p className="text-gray-400 text-lg">@{profile.userName}</p>
                  </div>
                  
                  <div className="mt-4 md:mt-0">
                    {/* Блок с ролью */}
                    {role && (
                      <div className="px-5 py-3 bg-gradient-to-r from-indigo-500/40 to-purple-500/40 border-2 border-indigo-400/50 rounded-xl shadow-lg">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                          </svg>
                          <span className="text-lg font-semibold text-white">{role.role}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Информация о дате регистрации */}
                {profile.createdAt && (
                  <div className="flex items-center gap-2 text-gray-400 mb-6">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <span>На платформе с {new Date(profile.createdAt).toLocaleDateString('ru-RU')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Биография */}
            {profile.bio && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                  О себе
                </h3>
                <div className="text-gray-300 bg-gray-800/30 rounded-lg p-4 border border-gray-700/50 whitespace-pre-line">
                  {profile.bio}
                </div>
              </div>
            )}

            {/* Контакты */}
            {contactInfo && Object.keys(contactInfo).length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  Контакты
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {contactInfo.email && (
                    <div className="flex items-center gap-2 text-gray-400 bg-gray-800/30 rounded-lg p-3 border border-gray-700/50">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                      </svg>
                      <span>{contactInfo.email}</span>
                    </div>
                  )}
                  {contactInfo.website && (
                    <div className="flex items-center gap-2 text-gray-400 bg-gray-800/30 rounded-lg p-3 border border-gray-700/50">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
                      </svg>
                      <a href={contactInfo.website} className="text-indigo-400 hover:text-indigo-300" target="_blank" rel="noopener noreferrer">
                        {contactInfo.website}
                      </a>
                    </div>
                  )}
                  {contactInfo.telegram && (
                    <div className="flex items-center gap-2 text-gray-400 bg-gray-800/30 rounded-lg p-3 border border-gray-700/50">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                      </svg>
                      <span>{contactInfo.telegram}</span>
                    </div>
                  )}
                  {contactInfo.otherContact && (
                    <div className="flex items-center gap-2 text-gray-400 bg-gray-800/30 rounded-lg p-3 border border-gray-700/50">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path>
                      </svg>
                      <span>{contactInfo.otherContact}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <button 
            onClick={() => navigate('/search')} 
            className="btn btn-outline border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-700"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            Найти других пользователей
          </button>
          
          {loggedIn && !isOwnProfile && (
            <button className="btn btn-primary">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
              </svg>
              Написать сообщение
            </button>
          )}
        </div>

        {/* Декоративные элементы */}
        <div className="flex justify-center gap-4 mt-12">
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-75"></div>
          <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce delay-150"></div>
        </div>
      </div>
    </Layout>
  );
}