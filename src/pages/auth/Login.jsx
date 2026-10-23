import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI, pingServer } from '../../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isWakingUp, setIsWakingUp] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Tự động gửi ping nhẹ đánh thức Render container ngay khi người dùng vừa mở trang login,
  // đồng thời hiển thị thông báo nếu người dùng vừa bị tự động đăng xuất do hết hạn token
  useEffect(() => {
    pingServer();
    const storedNotice = sessionStorage.getItem('auth_notice');
    if (storedNotice) {
      setNotice(storedNotice);
      sessionStorage.removeItem('auth_notice');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setIsLoading(true);
    setIsWakingUp(false);

    // Nếu sau 3.5s chưa nhận phản hồi -> backend Render đang trong trạng thái khởi động (cold-start)
    const wakingTimer = setTimeout(() => {
      setIsWakingUp(true);
    }, 3500);

    try {
      const data = await authAPI.login({ email, password });
      clearTimeout(wakingTimer);
      login(data.user, data.token);
      navigate('/');
    } catch (err) {
      clearTimeout(wakingTimer);
      setIsWakingUp(false);
      setError(err.message);
    } finally {
      clearTimeout(wakingTimer);
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center' }}>Đăng nhập</h2>
      
      {notice && (
        <div style={{ 
          padding: '0.75rem 1rem', 
          backgroundColor: '#FEF3C7', 
          color: '#92400E', 
          border: '1px solid #FCD34D', 
          borderRadius: 'var(--radius-md)', 
          marginBottom: '1rem', 
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span style={{ fontSize: '1rem' }}>⚠️</span>
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div style={{ padding: '0.75rem', backgroundColor: '#FEE2E2', color: '#EF4444', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Email</label>
          <input 
            type="email" 
            className="input" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@test.com" 
          />
        </div>
        
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>Mật khẩu</label>
            <Link to="/forgot-password" style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>Quên mật khẩu?</Link>
          </div>
          <input 
            type="password" 
            className="input" 
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••" 
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%' }} disabled={isLoading}>
          {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
        </button>

        {isWakingUp && (
          <div style={{
            padding: '0.85rem 1rem',
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.825rem',
            color: '#1E40AF',
            lineHeight: '1.45',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{
              width: '18px',
              height: '18px',
              border: '2px solid #BFDBFE',
              borderTopColor: '#2563EB',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              flexShrink: 0
            }} />
            <div>
              <div style={{ fontWeight: '700', marginBottom: '0.15rem' }}>
                Đang khởi động lại máy chủ...
              </div>
              <div style={{ color: '#3B82F6', fontSize: '0.75rem' }}>
                Máy chủ đám mây đang thức dậy từ trạng thái nghỉ (khoảng 20–40s). Vui lòng không đóng trang!
              </div>
            </div>
          </div>
        )}
      </form>

      <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        Chưa có tài khoản? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '600' }}>Đăng ký ngay</Link>
      </div>
    </div>
  );
};

export default Login;
