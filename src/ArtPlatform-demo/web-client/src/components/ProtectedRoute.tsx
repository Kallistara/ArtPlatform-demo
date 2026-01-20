import React from 'react';
import { Navigate } from 'react-router-dom';
import { isLoggedIn, hasRole } from '../lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRole?: string;
}

export default function ProtectedRoute({ 
  children, 
  requireAuth = true,
  requiredRole 
}: ProtectedRouteProps) {
  const isAuthenticated = isLoggedIn();
  
  // Если требуется аутентификация, но пользователь не авторизован
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Если требуется определенная роль, проверяем её
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <div className="alert alert-error shadow-lg">
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.994-.833-2.764 0L4.342 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h3 className="font-bold">Доступ запрещен!</h3>
              <div className="text-xs">Для доступа к этой странице требуется роль: <span className="badge badge-primary">{requiredRole}</span></div>
            </div>
          </div>
          <div className="flex-none">
            <button 
              className="btn btn-sm btn-ghost"
              onClick={() => window.history.back()}
            >
              Назад
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}