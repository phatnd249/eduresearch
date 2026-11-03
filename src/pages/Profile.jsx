import React, { useState, useEffect } from 'react';
import { User, Lock, Mail, Building2, Shield, KeyRound, CheckCircle, AlertCircle, Save, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import Toast from '../components/Toast';
import { Skeleton } from '../components/Skeleton';

const Profile = () => {
  const { currentUser, updateCurrentUser, loading } = useAuth();

  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'password'

  // Profile info state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    unit: '',
    phone: '0912 345 678',
    title: 'Nghiên cứu viên cao cấp',
  });

  // Password state
  const [pwdData, setPwdData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  // Show/hide passwords
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  // Toast
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 3500);
  };

  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        name: currentUser.name || '',
        email: currentUser.email || '',
        unit: currentUser.unit || 'Trường Đại học Sư phạm TP.HCM',
      }));
    }
  }, [currentUser]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Họ và tên không được để trống', 'error');
      return;
    }
    try {
      setSavingInfo(true);
      const res = await authAPI.updateProfile({
        name: formData.name.trim(),
        unit: formData.unit.trim(),
        email: formData.email.trim(),
      });
      if (updateCurrentUser) {
        updateCurrentUser({
          name: formData.name.trim(),
          unit: formData.unit.trim(),
        });
      }
      showToast('Cập nhật hồ sơ cá nhân thành công!');
    } catch (err) {
      showToast(err.message || 'Lỗi khi cập nhật hồ sơ', 'error');
    } finally {
      setSavingInfo(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!pwdData.oldPassword) {
      showToast('Vui lòng nhập mật khẩu hiện tại', 'error');
      return;
    }
    if (!pwdData.newPassword || pwdData.newPassword.length < 6) {
      showToast('Mật khẩu mới phải có ít nhất 6 ký tự', 'error');
      return;
    }
    if (pwdData.newPassword !== pwdData.confirmPassword) {
      showToast('Mật khẩu xác nhận không khớp', 'error');
      return;
    }

    try {
      setSavingPwd(true);
      await authAPI.changePassword({
        oldPassword: pwdData.oldPassword,
        newPassword: pwdData.newPassword,
      });
      showToast('Đổi mật khẩu thành công! Mật khẩu mới đã được áp dụng.');
      setPwdData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      showToast(err.message || 'Lỗi khi đổi mật khẩu', 'error');
    } finally {
      setSavingPwd(false);
    }
  };

  const roleLabel = currentUser?.role === 'admin' 
    ? 'Quản trị viên cấp cao (Super Admin)' 
    : (currentUser?.role === 'researcher' ? 'Nghiên cứu viên chính' : 'Người xem dữ liệu');

  const roleBadgeColor = currentUser?.role === 'admin' 
    ? { bg: '#FEE2E2', color: '#DC2626', border: '#FECACA' }
    : { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' };

  if (loading && !currentUser) {
    return (
      <div style={{ animation: 'fadeIn 0.3s ease' }}>
        <div style={{ marginBottom: '2rem' }}>
          <Skeleton width="220px" height="2rem" style={{ marginBottom: '0.5rem' }} />
          <Skeleton width="400px" height="1rem" />
        </div>

        <div className="card" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Skeleton width="84px" height="84px" borderRadius="50%" />
          <div style={{ flex: 1 }}>
            <Skeleton width="240px" height="1.75rem" style={{ marginBottom: '0.5rem' }} />
            <Skeleton width="180px" height="1rem" style={{ marginBottom: '0.75rem' }} />
            <Skeleton width="140px" height="1.5rem" borderRadius="var(--radius-full)" />
          </div>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          <Skeleton width="160px" height="1.5rem" style={{ marginBottom: '1.5rem' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div>
              <Skeleton width="100px" height="1rem" style={{ marginBottom: '0.5rem' }} />
              <Skeleton width="100%" height="2.5rem" borderRadius="var(--radius-md)" />
            </div>
            <div>
              <Skeleton width="100px" height="1rem" style={{ marginBottom: '0.5rem' }} />
              <Skeleton width="100%" height="2.5rem" borderRadius="var(--radius-md)" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Hồ sơ người dùng</h1>
        <p style={{ color: 'var(--text-muted)' }}>Quản lý thông tin học thuật, đơn vị công tác và cấu hình bảo mật tài khoản</p>
      </div>

      {/* BANNER THÔNG TIN NGƯỜI DÙNG */}
      <div className="card" style={{ padding: '2rem', marginBottom: '2rem', background: 'linear-gradient(to right, #FFFFFF, #F8FAFC)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #4F46E5, #3B82F6)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.25rem',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
          }}>
            {(formData.name || 'U').charAt(0).toUpperCase()}
          </div>

          <div style={{ flex: 1, minWidth: '240px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{formData.name || 'Người dùng'}</h2>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: '700',
                padding: '0.2rem 0.6rem',
                borderRadius: '12px',
                backgroundColor: roleBadgeColor.bg,
                color: roleBadgeColor.color,
                border: `1px solid ${roleBadgeColor.border}`
              }}>
                {roleLabel}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Mail size={16} />
                <span>{formData.email}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Building2 size={16} />
                <span>{formData.unit}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Shield size={16} color="#10B981" />
                <span style={{ color: '#059669', fontWeight: '500' }}>Tài khoản đã xác thực</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TABS ĐIỀU HƯỚNG */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
        >
          <User size={18} />
          Thông tin cá nhân
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('password')}
          className={`tab-btn ${activeTab === 'password' ? 'active' : ''}`}
        >
          <KeyRound size={18} />
          Đổi mật khẩu &amp; Bảo mật
        </button>
      </div>

      {/* TAB 1: THÔNG TIN CÁ NHÂN */}
      {activeTab === 'info' && (
        <div className="card" style={{ maxWidth: '720px' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Cập nhật thông tin học thuật</h3>
          <form onSubmit={handleUpdateProfile}>
            <div className="form-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Họ và tên <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nhập họ và tên..."
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Địa chỉ Email
                </label>
                <input
                  type="email"
                  className="input"
                  value={formData.email}
                  disabled
                  style={{ backgroundColor: '#F3F4F6', color: '#6B7280', cursor: 'not-allowed' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email dùng để đăng nhập hệ thống</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Đơn vị / Cơ quan công tác
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="Khoa, Phòng ban, Viện nghiên cứu..."
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Chức danh nghiên cứu
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Chức vụ, học hàm, học vị..."
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <button type="submit" className="btn btn-primary" disabled={savingInfo} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={16} />
                {savingInfo ? 'Đang lưu...' : 'Lưu thông tin'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: ĐỔI MẬT KHẨU */}
      {activeTab === 'password' && (
        <div className="card" style={{ maxWidth: '600px' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Đổi mật khẩu tài khoản</h3>
          
          <div style={{ padding: '0.875rem 1rem', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.825rem', color: '#1E40AF', lineHeight: '1.5' }}>
            Mật khẩu mới phải có tối thiểu 6 ký tự. Hãy sử dụng kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt để đảm bảo an toàn dữ liệu đề tài.
          </div>

          <form onSubmit={handleChangePassword}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Mật khẩu hiện tại <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showOldPwd ? 'text' : 'password'}
                    className="input"
                    value={pwdData.oldPassword}
                    onChange={(e) => setPwdData({ ...pwdData, oldPassword: e.target.value })}
                    placeholder="Nhập mật khẩu đang sử dụng..."
                    style={{ paddingRight: '2.5rem', width: '100%' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPwd(prev => !prev)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      background: 'none',
                      border: 'none',
                      padding: '0.25rem',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 'var(--radius-sm)'
                    }}
                    title={showOldPwd ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    aria-label={showOldPwd ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    tabIndex="-1"
                  >
                    {showOldPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Mật khẩu mới <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showNewPwd ? 'text' : 'password'}
                    className="input"
                    value={pwdData.newPassword}
                    onChange={(e) => setPwdData({ ...pwdData, newPassword: e.target.value })}
                    placeholder="Ít nhất 6 ký tự..."
                    style={{ paddingRight: '2.5rem', width: '100%' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd(prev => !prev)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      background: 'none',
                      border: 'none',
                      padding: '0.25rem',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 'var(--radius-sm)'
                    }}
                    title={showNewPwd ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    aria-label={showNewPwd ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    tabIndex="-1"
                  >
                    {showNewPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Xác nhận mật khẩu mới <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showConfirmPwd ? 'text' : 'password'}
                    className="input"
                    value={pwdData.confirmPassword}
                    onChange={(e) => setPwdData({ ...pwdData, confirmPassword: e.target.value })}
                    placeholder="Nhập lại mật khẩu mới..."
                    style={{ paddingRight: '2.5rem', width: '100%' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPwd(prev => !prev)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      background: 'none',
                      border: 'none',
                      padding: '0.25rem',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 'var(--radius-sm)'
                    }}
                    title={showConfirmPwd ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    aria-label={showConfirmPwd ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    tabIndex="-1"
                  >
                    {showConfirmPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <button type="submit" className="btn btn-primary" disabled={savingPwd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={16} />
                {savingPwd ? 'Đang cập nhật...' : 'Xác nhận đổi mật khẩu'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Profile;
