// web-client/src/pages/Login.tsx
// Обновленная версия, которая не создает горизонтальную прокрутку

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth-client';
import { saveToken } from '../lib/auth';
import { setAuthToken } from '../api/axios';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgType, setMsgType] = useState<'info' | 'error'>('info');
  const navigate = useNavigate();

  const parseError = (e: unknown) => {
    if (!e) return 'Неизвестная ошибка';
    if (typeof e === 'string') return e;
    if (e instanceof Error) return e.message;
    const anyE = e as any;
    return anyE?.response?.data?.Error ?? anyE?.response?.data?.error ?? anyE?.response?.data?.message ?? 'Неизвестная ошибка';
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      const res = await authApi.login({ username, password });
      const token = res?.data?.accessToken ?? res?.data?.AccessToken ?? res?.data?.token;
      if (!token) throw new Error('Токен не получен');

      saveToken(token);
      setAuthToken(token);

      setMsgType('info');
      setMsg('Вход выполнен — перенаправление в профиль...');
      setTimeout(() => navigate('/profile'), 700);
    } catch (err: unknown) {
      setMsgType('error');
      setMsg(`Ошибка входа: ${parseError(err)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    // ОСНОВНОЙ ФИКС: используем fixed inset-0 для полного покрытия
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      
      {/* Фоновые круги - ФИКСИРУЕМ ИХ ПРАВИЛЬНО */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Левый верхний круг - уменьшаем размер и убираем трансформации */}
        <div className="absolute -top-48 -left-48 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        
        {/* Правый верхний круг */}
        <div className="absolute -top-48 -right-48 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        
        {/* Правый нижний круг */}
        <div className="absolute -bottom-48 -right-48 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-500"></div>
      </div>

      {/* Контент с вертикальной прокруткой */}
      <div className="relative h-full overflow-y-auto">
        <div className="min-h-full flex items-center justify-center p-4">
          <div className="w-full max-w-md my-8">
            {/* Главная карточка формы */}
            <div className="card bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-lg shadow-2xl border border-gray-700/50">
              <div className="card-body p-6 md:p-8">
                {/* Заголовок с иконкой */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                  </div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    Вход в ArtPlatform
                  </h1>
                  <p className="text-gray-400 mt-2">Добро пожаловать в мир цифрового искусства</p>
                </div>

                {/* Сообщения об успехе/ошибках */}
                {msg && (
                  <div className={`alert ${msgType === 'info' ? 'alert-info' : 'alert-error'} shadow-lg mb-4 animate-fade-in`}>
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

                {/* Форма входа */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Поле username */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-gray-300 font-semibold flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                        Имя пользователя
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        className="input input-bordered w-full bg-gray-800/50 border-gray-600 text-white pl-10 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                        placeholder="artist_digital"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        disabled={loading}
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Поле для пароля */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-gray-300 font-semibold flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                        </svg>
                        Пароль
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        className="input input-bordered w-full bg-gray-800/50 border-gray-600 text-white pl-10 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Кнопка отправки формы */}
                  <div className="form-control pt-2">
                    <button
                      type="submit"
                      className={`btn btn-lg w-full bg-gradient-to-r from-purple-600 to-blue-500 border-0 text-white font-bold hover:from-purple-700 hover:to-blue-600 transition-all duration-300 ${loading ? 'loading' : ''}`}
                      disabled={loading}
                    >
                      {loading ? '' : (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                          </svg>
                          Войти
                        </span>
                      )}
                    </button>
                  </div>
                </form>

                {/* Разделитель */}
                <div className="divider my-4">
                  <span className="text-gray-400 px-4">ИЛИ</span>
                </div>

                {/* Ссылка на регистрацию */}
                <div className="text-center space-y-3">
                  <p className="text-gray-400">
                    Нет аккаунта?{' '}
                    <a href="/register" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors duration-300">
                      Создать новый
                    </a>
                  </p>
                  <p className="text-xs text-gray-500">
                    Входя в систему, вы соглашаетесь с нашими условиями использования
                  </p>
                </div>
              </div>
            </div>

            {/* Декоративные элементы */}
            <div className="flex justify-center mt-6 gap-4">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-75"></div>
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}