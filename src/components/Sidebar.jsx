import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FileText, Users, PieChart, Database, FileBox, LogOut, User, Compass, X } from 'lucide-react';

const Sidebar = ({ isOpen = false, onClose }) => {
  const { currentUser, logout } = useAuth();
  
  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} />, roles: ['admin', 'researcher', 'viewer'] },
    { name: 'Bảng hỏi khảo sát', path: '/surveys', icon: <FileText size={20} />, roles: ['admin', 'researcher', 'viewer'] },
    { name: 'Phản hồi', path: '/responses', icon: <Database size={20} />, roles: ['admin', 'researcher', 'viewer'] },
    { name: 'Phân tích thống kê', path: '/analytics', icon: <PieChart size={20} />, roles: ['admin', 'researcher', 'viewer'] },
    { name: 'Bản đồ phân cụm', path: '/clustering', icon: <Compass size={20} />, roles: ['admin', 'researcher', 'viewer'] },
    { name: 'Kho tài liệu', path: '/documents', icon: <FileBox size={20} />, roles: ['admin', 'researcher', 'viewer'] },
    { name: 'Hồ sơ cá nhân', path: '/profile', icon: <User size={20} />, roles: ['admin', 'researcher', 'viewer'] },
    { name: 'Người dùng', path: '/users', icon: <Users size={20} />, roles: ['admin'] },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'is-open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">ER</div>
        <div>
          <h2 className="sidebar-title">EduResearch</h2>
          <p className="sidebar-subtitle">Hệ thống nghiên cứu</p>
        </div>
        <button type="button" className="sidebar-close-btn" aria-label="Đóng menu" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      
      <nav className="sidebar-menu">
        <div className="sidebar-group-label">
          Tổng quan
        </div>
        {navItems.filter(item => item.roles.includes(currentUser.role)).map((item) => {
          if (item.name === 'Bảng hỏi khảo sát') {
             return (
               <React.Fragment key="group-research">
                  <div className="sidebar-group-label" style={{ marginTop: '1rem' }}>
                    Nghiên cứu
                  </div>
                  <NavLink 
                    to={item.path} 
                    className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </NavLink>
               </React.Fragment>
             )
          }
          if (item.name === 'Người dùng') {
             return (
               <React.Fragment key="group-admin">
                  <div className="sidebar-group-label" style={{ marginTop: '1rem' }}>
                    Quản trị
                  </div>
                  <NavLink 
                    to={item.path} 
                    className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </NavLink>
               </React.Fragment>
             )
          }
          return (
            <NavLink 
              key={item.path}
              to={item.path} 
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <NavLink 
          to="/profile"
          className="sidebar-user"
          title="Xem hồ sơ & Đổi mật khẩu"
          onClick={onClose}
        >
          <div className="sidebar-user-avatar">
            {(currentUser?.name || 'U').substring(0,2).toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{currentUser?.name || 'Người dùng'}</div>
            <div className="sidebar-user-role">{currentUser?.role} • Hồ sơ</div>
          </div>
        </NavLink>
        <button 
          onClick={logout}
          className="btn btn-danger-soft"
          style={{ width: '100%' }}
        >
          <LogOut size={16} />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
