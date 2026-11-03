import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Shield, ShieldCheck, ShieldAlert, X, AlertTriangle, Users as UsersIcon, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { usersAPI } from '../services/api';
import Toast from '../components/Toast';
import { Skeleton, SkeletonTableRows } from '../components/Skeleton';

let cachedUsers = null;

const Users = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState(cachedUsers || []);
  const [loading, setLoading] = useState(!cachedUsers);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);

  // Password visibility state
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'researcher',
    unit: ''
  });

  // Toast
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 3000);
  };

  const fetchUsers = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const result = await usersAPI.getAll();
      setUsers(result);
      cachedUsers = result;
    } catch (error) {
      console.error('Error fetching users:', error);
      if (!silent) showToast('Không thể tải danh sách người dùng', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchUsers(!!cachedUsers);
    }
  }, [currentUser]);

  // Protect route
  if (currentUser?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'researcher',
      unit: ''
    });
    setShowCreatePassword(false);
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      showToast('Vui lòng điền đầy đủ họ tên, email và mật khẩu', 'error');
      return;
    }
    try {
      const created = await usersAPI.create(formData);
      setUsers([created, ...users]);
      setIsCreateOpen(false);
      showToast('Tạo tài khoản người dùng thành công!');
    } catch (err) {
      showToast(err.message || 'Lỗi khi tạo tài khoản', 'error');
    }
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      unit: user.unit || ''
    });
    setShowEditPassword(false);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const updated = await usersAPI.update(selectedUser.id, formData);
      setUsers(users.map(u => u.id === updated.id ? updated : u));
      setIsEditOpen(false);
      setSelectedUser(null);
      showToast('Cập nhật tài khoản thành công!');
    } catch (err) {
      showToast(err.message || 'Lỗi khi cập nhật tài khoản', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (id === currentUser.id) {
      showToast('Bạn không thể tự xóa tài khoản của chính mình!', 'error');
      setDeleteConfirmUser(null);
      return;
    }
    try {
      await usersAPI.delete(id);
      setUsers(users.filter(u => u.id !== id));
      setDeleteConfirmUser(null);
      showToast('Đã xóa người dùng thành công!');
    } catch (err) {
      showToast(err.message || 'Lỗi khi xóa người dùng', 'error');
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return <span className="badge" style={{ backgroundColor: '#FEE2E2', color: '#EF4444' }}>Quản trị viên</span>;
      case 'researcher': return <span className="badge" style={{ backgroundColor: '#EFF6FF', color: '#3B82F6' }}>Nhà nghiên cứu</span>;
      case 'viewer': return <span className="badge" style={{ backgroundColor: '#F3F4F6', color: '#4B5563' }}>Người xem</span>;
      default: return null;
    }
  };

  const adminCount = users.filter(u => u.role === 'admin').length;
  const researcherCount = users.filter(u => u.role === 'researcher').length;
  const viewerCount = users.filter(u => u.role === 'viewer').length;

  return (
    <div>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Quản lý người dùng</h1>
          <p style={{ color: 'var(--text-muted)' }}>Phân quyền truy cập và quản lý tài khoản hệ thống</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={18} />
          Thêm tài khoản
        </button>
      </div>

      <div className="users-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ borderTop: '4px solid #EF4444', padding: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ padding: '0.75rem', backgroundColor: '#FEE2E2', borderRadius: 'var(--radius-md)', color: '#EF4444' }}>
              <ShieldAlert size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Quản trị viên</div>
              {loading && users.length === 0 ? (
                <Skeleton width="45px" height="2rem" style={{ marginTop: '0.25rem' }} />
              ) : (
                <div style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>{adminCount}</div>
              )}
            </div>
          </div>
        </div>
        
        <div className="card" style={{ borderTop: '4px solid #3B82F6', padding: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ padding: '0.75rem', backgroundColor: '#EFF6FF', borderRadius: 'var(--radius-md)', color: '#3B82F6' }}>
              <ShieldCheck size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Nhà nghiên cứu</div>
              {loading && users.length === 0 ? (
                <Skeleton width="45px" height="2rem" style={{ marginTop: '0.25rem' }} />
              ) : (
                <div style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>{researcherCount}</div>
              )}
            </div>
          </div>
        </div>

        <div className="card" style={{ borderTop: '4px solid #4B5563', padding: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ padding: '0.75rem', backgroundColor: '#F3F4F6', borderRadius: 'var(--radius-md)', color: '#4B5563' }}>
              <Shield size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Người xem</div>
              {loading && users.length === 0 ? (
                <Skeleton width="45px" height="2rem" style={{ marginTop: '0.25rem' }} />
              ) : (
                <div style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>{viewerCount}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table className="table" style={{ fontSize: '0.875rem' }}>
            <thead style={{ backgroundColor: '#F9FAFB' }}>
              <tr>
                <th>Họ tên</th>
                <th>Email</th>
                <th style={{ textAlign: 'center' }}>Phân quyền</th>
                <th>Đơn vị công tác</th>
                <th style={{ textAlign: 'center' }}>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            {loading && users.length === 0 ? (
              <SkeletonTableRows columns={6} rows={5} />
            ) : (
              <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div style={{ fontWeight: '600' }}>{user.name}</div>
                    {user.id === currentUser?.id && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: '500' }}>(Bạn đang đăng nhập)</span>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{user.email}</td>
                  <td style={{ textAlign: 'center' }}>{getRoleBadge(user.role)}</td>
                  <td>{user.unit || 'Chưa cập nhật'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge" style={{ backgroundColor: '#D1FAE5', color: '#10B981', border: '1px solid #A7F3D0' }}>
                      Hoạt động
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <button 
                        className="btn-outline"
                        style={{ padding: '0.375rem', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }} 
                        title="Chỉnh sửa người dùng"
                        onClick={() => handleOpenEdit(user)}
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="btn-outline"
                        style={{ 
                          padding: '0.375rem', 
                          borderRadius: 'var(--radius-md)', 
                          color: user.id === currentUser?.id ? '#D1D5DB' : 'var(--danger)',
                          cursor: user.id === currentUser?.id ? 'not-allowed' : 'pointer'
                        }} 
                        title={user.id === currentUser?.id ? 'Không thể tự xóa' : 'Xóa người dùng'}
                        disabled={user.id === currentUser?.id}
                        onClick={() => setDeleteConfirmUser(user)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
        </div>
      </div>

      {/* Modal Thêm người dùng */}
      {isCreateOpen && (
        <div className="modal-backdrop" onClick={() => setIsCreateOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Thêm người dùng mới</h2>
              <button className="modal-close-btn" onClick={() => setIsCreateOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Họ và tên *</label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="VD: TS. Nguyễn Văn A"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email đăng nhập *</label>
                  <input 
                    type="email" 
                    className="input" 
                    placeholder="email@eduresearch.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mật khẩu khởi tạo *</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input 
                      type={showCreatePassword ? 'text' : 'password'} 
                      className="input" 
                      placeholder="Nhập mật khẩu"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      style={{ paddingRight: '2.5rem', width: '100%' }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCreatePassword(prev => !prev)}
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
                      title={showCreatePassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      aria-label={showCreatePassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      tabIndex="-1"
                    >
                      {showCreatePassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="form-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Vai trò (Role)</label>
                    <select 
                      className="input"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="researcher">Nhà nghiên cứu (Researcher)</option>
                      <option value="viewer">Người xem (Viewer)</option>
                      <option value="admin">Quản trị viên (Admin)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Đơn vị / Khoa / Viện</label>
                    <input 
                      type="text" 
                      className="input" 
                      placeholder="VD: Khoa CNTT"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsCreateOpen(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-primary">
                  Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chỉnh sửa người dùng */}
      {isEditOpen && selectedUser && (
        <div className="modal-backdrop" onClick={() => setIsEditOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Chỉnh sửa người dùng: {selectedUser.name}</h2>
              <button className="modal-close-btn" onClick={() => setIsEditOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Họ và tên *</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input 
                    type="email" 
                    className="input" 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mật khẩu mới (bỏ trống nếu giữ nguyên)</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input 
                      type={showEditPassword ? 'text' : 'password'} 
                      className="input" 
                      placeholder="Nhập mật khẩu mới để đổi"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      style={{ paddingRight: '2.5rem', width: '100%' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(prev => !prev)}
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
                      title={showEditPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      aria-label={showEditPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      tabIndex="-1"
                    >
                      {showEditPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="form-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Vai trò</label>
                    <select 
                      className="input"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="researcher">Nhà nghiên cứu (Researcher)</option>
                      <option value="viewer">Người xem (Viewer)</option>
                      <option value="admin">Quản trị viên (Admin)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Đơn vị công tác</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsEditOpen(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-primary">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xác nhận xóa */}
      {deleteConfirmUser && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirmUser(null)}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-body" style={{ textAlign: 'center', paddingTop: '2rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#FEE2E2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <AlertTriangle size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Xác nhận xóa tài khoản?</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Bạn có chắc chắn muốn xóa tài khoản <strong>{deleteConfirmUser.name}</strong> ({deleteConfirmUser.email}) không? Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button className="btn btn-outline" onClick={() => setDeleteConfirmUser(null)}>
                Hủy bỏ
              </button>
              <button 
                className="btn" 
                style={{ backgroundColor: '#EF4444', color: 'white' }}
                onClick={() => handleDelete(deleteConfirmUser.id)}
              >
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
