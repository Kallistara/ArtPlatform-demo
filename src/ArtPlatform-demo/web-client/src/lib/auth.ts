export const TOKEN_KEY = 'accessToken';
export const USER_ID_KEY = 'userId';

// === Базовые функции (уже есть у вас) ===
export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function saveUserId(userId: string) {
  localStorage.setItem(USER_ID_KEY, userId);
}

export function getUserId(): string | null {
  return localStorage.getItem(USER_ID_KEY);
}

// Вытащить userId (sub) из JWT
export function getUserIdFromToken(): string | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub ?? payload.sub?.toString() ?? null;
  } catch {
    return null;
  }
}

// === НОВЫЕ ФУНКЦИИ ДЛЯ РОЛЕЙ ===

// Вытащить роль из JWT
export function getUserRoleFromToken(): string | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    // Проверяем разные возможные ключи для роли
    return (
      payload.role || 
      payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
      payload['role'] ||
      null
    );
  } catch {
    return null;
  }
}

// Проверка, является ли пользователь админом
export function isAdmin(): boolean {
  const role = getUserRoleFromToken();
  return role === 'Admin';
}

// Проверка, является ли пользователь контент-мейкером или админом
export function isContentCreator(): boolean {
  const role = getUserRoleFromToken();
  return role === 'ContentCreator' || role === 'Admin';
}

// Проверка, имеет ли пользователь указанную роль
export function hasRole(requiredRole: string): boolean {
  const userRole = getUserRoleFromToken();
  if (!userRole) return false;
  
  // Админ имеет все роли
  if (userRole === 'Admin') return true;
  
  return userRole === requiredRole;
}

// Получить все данные пользователя из токена
export function getUserFromToken(): {
  userId: string | null;
  username: string | null;
  role: string | null;
} {
  const token = getToken();
  if (!token) {
    return { userId: null, username: null, role: null };
  }
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      userId: payload.sub || null,
      username: payload.username || payload['username'] || null,
      role: payload.role || 
            payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 
            null
    };
  } catch {
    return { userId: null, username: null, role: null };
  }
}