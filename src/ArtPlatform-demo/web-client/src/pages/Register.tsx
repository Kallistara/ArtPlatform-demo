import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth-client';
import { profileApi } from '../api/profile-client';

/**
 * Страница регистрации
 * отправка данных { username, password, confirmPassword } на бэк
 * редирект на /login при успехе
 */

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgType, setMsgType] = useState<'info' | 'error'>('info');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const navigate = useNavigate();

  // Парсинг ошибок
  const parseError = (e: unknown) => {
    if (!e) return 'Неизвестная ошибка';
    if (typeof e === 'string') return e;
    if (e instanceof Error) return e.message;
    const anyE = e as any;
    return anyE?.response?.data?.Error ?? anyE?.response?.data?.error ?? anyE?.response?.data?.message ?? 'Неизвестная ошибка';
  };

  // Проверка доступности username 
  async function checkUsername() {
    if (username.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    try {
      // Отправляем данные на бэк
      const res = await profileApi.checkUsername(username);

      // Доступность (bool)
      const available = res?.data?.available;
      setUsernameAvailable(Boolean(available));
    } catch (err) {
      console.error('Ошибка проверки username', err);
      setUsernameAvailable(null);
    }
  }

  // Основная функция обработки формы
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (password !== confirmPassword) {
      setMsgType('error');
      setMsg('Пароли не совпадают');
      return;
    }
    if (password.length < 6) {
      setMsgType('error');
      setMsg('Пароль должен быть не менее 6 символов');
      return;
    }
    if (usernameAvailable === false) {
      setMsgType('error');
      setMsg('Username занят — выберите другой');
      return;
    }

    setLoading(true);
    try {
      // ОТправляем данные на бэк
      await authApi.register({ username, password, confirmPassword });
      setMsgType('info');
      setMsg('Регистрация прошла успешно. Перенаправление на страницу входа...');
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err: unknown) {
      setMsgType('error');
      setMsg(`Ошибка регистрации: ${parseError(err)}`);
    } finally {
      setLoading(false);
    }
  }

return (
  // Основной контейнер системы
  <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
    
    {/* Фоновые круги */}
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute -top-48 -left-48 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      <div className="absolute -top-48 -right-48 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
      <div className="absolute -bottom-48 -right-48 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-500"></div>
    </div>

      {/* Контент с вертикальной прокруткой */}
      <div className="relative h-full overflow-y-auto">
        <div className="min-h-full flex items-center justify-center p-4">
          <div className="w-full max-w-md my-8">

          {/* Главная карточка формы */}
          <div className="card bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-lg shadow-2xl border border-gray-700/50">
            <div className="card-body p-8">

              {/* Заголовок с иконкой */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                  </svg>
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Регистрация в ArtPlatform
                </h1>
                {/* Подзаголовок */}
                <p className="text-gray-400 mt-2">Погрузитесь в мир цифрового искусства</p>
              </div>

              {/* Сообщения об успехе/ошибках */}
              {msg && (
                <div className={`alert ${msgType === 'info' ? 'alert-info' : 'alert-error'} shadow-lg mb-6 animate-fade-in`}>
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

              {/* Форма регистрации */}
              <form onSubmit={handleSubmit} className="space-y-6">

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
                      className="input input-bordered w-full bg-gray-800/50 border-gray-600 text-white pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                      placeholder="artist_digital"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setUsernameAvailable(null);
                      }}
                      onBlur={checkUsername}
                      required
                      disabled={loading}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                    </div>
                  </div>
                  
                  {/* Индикатор проверки доступности username */}
                  {usernameAvailable !== null && username.length >= 3 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${usernameAvailable ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                      <span className={`text-sm ${usernameAvailable ? 'text-green-400' : 'text-red-400'}`}>
                        {usernameAvailable ? 'Имя доступно' : 'Имя занято'}
                      </span>
                    </div>
                  )}
                  
                  {username.length > 0 && username.length < 3 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className="text-sm text-yellow-400">
                        Минимум 3 символа
                      </span>
                    </div>
                  )}
                </div>

                {/* Поле пароля */}
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
                      className="input input-bordered w-full bg-gray-800/50 border-gray-600 text-white pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                      placeholder="Минимум 6 символов"
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
                  
                  {/* Индикатор длины пароля */}
                  {password.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${password.length >= 6 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className={`text-sm ${password.length >= 6 ? 'text-green-400' : 'text-red-400'}`}>
                        {password.length >= 6 ? 'Достаточно символов' : `Требуется еще ${6 - password.length} симв.`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Поле подтверждения пароля */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-gray-300 font-semibold flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                      </svg>
                      Подтвердите пароль
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      className="input input-bordered w-full bg-gray-800/50 border-gray-600 text-white pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                      placeholder="Повторите пароль"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                      </svg>
                    </div>
                  </div>
                  
                  {/* Индикатор совпадения паролей */}
                  {confirmPassword.length > 0 && password.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${password === confirmPassword ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                      <span className={`text-sm ${password === confirmPassword ? 'text-green-400' : 'text-red-400'}`}>
                        {password === confirmPassword ? 'Пароли совпадают' : 'Пароли не совпадают'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Кнопка регистрации */}
                <div className="form-control mt-8">
                  <button
                    type="submit"
                    className={`btn btn-lg w-full bg-gradient-to-r from-blue-600 to-cyan-500 border-0 text-white font-bold hover:from-blue-700 hover:to-cyan-600 transform hover:-translate-y-0.5 transition-all duration-300 ${loading ? 'loading' : ''}`}
                    disabled={loading || usernameAvailable === false}
                  >
                    {loading ? '' : (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                        Зарегистрироваться
                      </span>
                    )}
                  </button>
                </div>
              </form>

              {/* Разделитель */}
              <div className="divider my-4">
                <span className="text-gray-400 px-4">Уже есть аккаунт?</span>
              </div>

              {/* Ссылка на вход (login) */}
              <div className="text-center mt-2">
                <button 
                  onClick={() => navigate('/login')} 
                  className="btn btn-outline btn-lg w-full border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500 hover:text-white transition-all duration-300"
                  >
                    <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                        </svg>
                        Войти в аккаунт
                        </span>
                </button>
              </div>

              {/* Дополнительная информация */}
              <div className="text-center mt-6">
                <p className="text-sm text-gray-500">
                  Регистрируясь, вы соглашаетесь с нашими условиями использования и политикой конфиденциальности
                </p>
              </div>
            </div>
          </div>

          {/* Декоративные элементы внизу */}
          <div className="flex justify-center mt-8 gap-4">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-75"></div>
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce delay-150"></div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
