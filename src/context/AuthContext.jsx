import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { authAPI } from '../services/api';
import { isTokenExpired, getTokenRemainingTime } from '../utils/token';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const expiryTimerRef = useRef(null);

  // Hàm đăng xuất toàn diện, có thể truyền lý do đăng xuất (ví dụ: hết hạn token)
  const logout = useCallback((reason = '') => {
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }

    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('token');

    if (reason) {
      sessionStorage.setItem('auth_notice', reason);
    }
  }, []);

  // Thiết lập bộ đếm tự động đăng xuất khi token chạm mốc thời gian hết hạn
  const scheduleTokenExpiry = useCallback((authToken) => {
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }

    if (!authToken) return;

    if (isTokenExpired(authToken)) {
      logout('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
      return;
    }

    const remainingMs = getTokenRemainingTime(authToken);
    // Hẹn giờ đăng xuất tự động khi hết hạn (hoặc tối đa ~24 ngày cho giới hạn setTimeout)
    if (remainingMs > 0 && remainingMs < 2147483647) {
      expiryTimerRef.current = setTimeout(() => {
        logout('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.');
      }, remainingMs);
    }
  }, [logout]);

  const login = (userData, authToken) => {
    setCurrentUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    sessionStorage.removeItem('auth_notice');
    scheduleTokenExpiry(authToken);
  };

  const updateCurrentUser = (userData) => {
    setCurrentUser(prev => ({ ...prev, ...userData }));
  };

  // Lắng nghe sự kiện token hết hạn từ các tầng mạng (api.js) và kiểm tra khi đổi tab / mở lại máy
  useEffect(() => {
    const handleAuthExpired = (event) => {
      const reason = event.detail?.message || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      logout(reason);
    };

    const handleVisibilityOrFocus = () => {
      const curToken = localStorage.getItem('token');
      if (curToken && isTokenExpired(curToken)) {
        logout('Phiên đăng nhập đã hết hạn trong thời gian chờ.');
      }
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [logout]);

  // Kiểm tra token và lấy thông tin người dùng khi khởi động ứng dụng
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      // Kiểm tra ngay token đã hết hạn chưa trước khi gửi request
      if (isTokenExpired(token)) {
        logout('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        setLoading(false);
        return;
      }

      // Kích hoạt bộ đếm thời gian hết hạn
      scheduleTokenExpiry(token);

      try {
        const data = await authAPI.getMe();
        setCurrentUser(data.user);
      } catch (error) {
        console.error('Error fetching user:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token, logout, scheduleTokenExpiry]);

  return (
    <AuthContext.Provider value={{ currentUser, token, login, logout, updateCurrentUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
