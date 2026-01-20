import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileApi } from '../api/profile-client';
import { isLoggedIn } from '../lib/auth';
import Layout from '../components/Layout';

export default function ChangePassword() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Проверка, авторизован ли пользователь
  const loggedIn = isLoggedIn();

  if (!loggedIn) {
    // Если не авторизован, перенаправляем на страницу входа
    navigate('/login');
    return null;
  }

  const parseError = (e: unknown) => {
    if (!e) return 'Неизвестная ошибка';
    if (typeof e === 'string') return e;
    if (e instanceof Error) return e.message;
    const anyE = e as any;
    // Пытаемся получить сообщение об ошибке из разных полей ответа сервера
    return anyE?.response?.data?.message ?? 
           anyE?.response?.data?.error ?? 
           anyE?.response?.data?.Error ?? 
           anyE?.response?.data ?? 
           'Ошибка';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Валидация
    if (!currentPassword.trim()) {
      setError('Введите текущий пароль');
      return;
    }

    if (!newPassword.trim()) {
      setError('Введите новый пароль');
      return;
    }

    if (newPassword.length < 6) {
      setError('Новый пароль должен содержать минимум 6 символов');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Новый пароль и подтверждение не совпадают');
      return;
    }

    setLoading(true);

    try {
      // Отправляем данные в формате, который ожидает бэкенд (PascalCase)
      await profileApi.changePassword({
        CurrentPassword: currentPassword.trim(),
        NewPassword: newPassword.trim()
      });

      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Автоматически перенаправляем через 3 секунды
      setTimeout(() => {
        navigate('/profile');
      }, 3000);
    } catch (err) {
      console.error('Ошибка смены пароля:', err);
      const errorMessage = parseError(err);
      setError(`Ошибка смены пароля: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/profile');
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        {/* Заголовок страницы */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Смена пароля</h1>
          <p className="text-gray-400">Введите текущий пароль и новый пароль для изменения</p>
        </div>

        {/* Карточка с формой */}
        <div className="card bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-lg shadow-2xl border border-gray-700/50">
          <div className="card-body p-8">
            {success ? (
              <div className="text-center py-8">
                <div className="mb-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">Пароль успешно изменен!</h2>
                <p className="text-gray-300 mb-8">
                  Вы будете перенаправлены на страницу профиля через 3 секунды...
                </p>
                <button 
                  onClick={() => navigate('/profile')} 
                  className="btn btn-primary px-8 py-3"
                >
                  Вернуться в профиль
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Уведомления об ошибках */}
                {error && (
                  <div className="alert alert-error shadow-lg">
                    <div>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                      </svg>
                      <span>{error}</span>
                    </div>
                  </div>
                )}

                {/* Текущий пароль */}
                <div className="form-control">
                  <label className="label mb-2">
                    <span className="label-text text-gray-300 font-semibold text-lg">Текущий пароль</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="password" 
                      className="input input-bordered w-full pl-12 bg-gray-800/50 border-gray-600 text-white h-14 text-base"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Введите текущий пароль"
                      disabled={loading}
                    />
                    <svg className="w-6 h-6 absolute left-4 top-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>

                {/* Новый пароль */}
                <div className="form-control">
                  <label className="label mb-2">
                    <span className="label-text text-gray-300 font-semibold text-lg">Новый пароль</span>
                    <span className="label-text-alt text-gray-500 text-sm">минимум 6 символов</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="password" 
                      className="input input-bordered w-full pl-12 bg-gray-800/50 border-gray-600 text-white h-14 text-base"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Введите новый пароль"
                      disabled={loading}
                    />
                    <svg className="w-6 h-6 absolute left-4 top-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                </div>

                {/* Подтверждение нового пароля */}
                <div className="form-control">
                  <label className="label mb-2">
                    <span className="label-text text-gray-300 font-semibold text-lg">Подтверждение нового пароля</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="password" 
                      className="input input-bordered w-full pl-12 bg-gray-800/50 border-gray-600 text-white h-14 text-base"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Повторите новый пароль"
                      disabled={loading}
                    />
                    <svg className="w-6 h-6 absolute left-4 top-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                </div>

                {/* Кнопки */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <button 
                    type="submit" 
                    className={`btn flex-1 h-14 text-lg font-medium bg-gradient-to-r from-cyan-500 to-blue-500 border-0 text-white hover:from-cyan-600 hover:to-blue-600 hover:shadow-lg ${loading ? 'loading' : ''}`}
                    disabled={loading}
                  >
                    {loading ? 'Изменение...' : 'Изменить пароль'}
                  </button>
                  <button 
                    type="button" 
                    onClick={handleCancel}
                    className="btn btn-outline h-14 border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-700 text-lg"
                    disabled={loading}
                  >
                    Отмена
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Подсказки по паролю */}
        {!success && (
          <div className="mt-8 p-5 bg-gray-800/30 rounded-xl border border-gray-700/50">
            <h3 className="text-base font-semibold text-gray-300 mb-3">Требования к паролю:</h3>
            <ul className="text-sm text-gray-400 space-y-2">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Минимум 6 символов
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Рекомендуется использовать буквы, цифры и специальные символы
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Не используйте простые и распространенные пароли
              </li>
            </ul>
          </div>
        )}

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