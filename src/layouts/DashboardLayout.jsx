import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Building2, ChevronRight, Menu } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

const ROUTE_NAMES = {
  '/': 'Tổng quan hệ thống',
  '/dashboard': 'Tổng quan hệ thống',
  '/surveys': 'Khảo sát & Bảng hỏi',
  '/responses': 'Dữ liệu phản hồi',
  '/analytics': 'Phân tích thống kê & Định tính',
  '/users': 'Quản lý tài khoản',
  '/profile': 'Hồ sơ người dùng & Bảo mật',
  '/settings': 'Cấu hình hệ thống',
  '/clustering': 'Bản đồ phân cụm',
  '/documents': 'Kho tài liệu',
};

const DashboardLayout = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentPath = location.pathname;
  const currentPageTitle = ROUTE_NAMES[currentPath] || 'Không gian nghiên cứu';

  const roleLabel = currentUser?.role === 'admin' ? 'Super Admin' : (currentUser?.role === 'researcher' ? 'Nghiên cứu viên' : 'Người xem');
  const roleBadgeStyle = currentUser?.role === 'admin'
    ? { backgroundColor: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA' }
    : (currentUser?.role === 'researcher'
      ? { backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }
      : { backgroundColor: '#F3F4F6', color: '#4B5563', border: '1px solid #E5E7EB' });

  const initialLetter = (currentUser?.name || currentUser?.email || 'U').charAt(0).toUpperCase();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle('sidebar-lock', sidebarOpen);
    return () => document.body.classList.remove('sidebar-lock');
  }, [sidebarOpen]);

  return (
    <div className="dashboard-shell">
      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Đóng menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="dashboard-content">
        <header className="dashboard-header">
          <div className="dashboard-header-left">
            <button
              type="button"
              className="mobile-menu-btn"
              aria-label="Mở menu"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>

            <div className="dashboard-breadcrumb">
              <span className="dashboard-brand-crumb">EduResearch</span>
              <ChevronRight size={14} />
              <span className="dashboard-page-title">{currentPageTitle}</span>
            </div>

            <div className="dashboard-header-divider hide-on-mobile" />

            <div className="year-badge hide-on-mobile">
              <span className="year-badge-dot" />
              Năm học 2026 - 2027
            </div>
          </div>

          <div className="dashboard-header-right">
            <div className="unit-chip hide-on-tablet">
              <Building2 size={16} color="var(--primary)" />
              <span>{currentUser?.unit || 'Trường Đại học Sư phạm TP.HCM'}</span>
            </div>

            <div className="dashboard-header-divider hide-on-tablet" />

            <Link
              to="/profile"
              className="header-user"
              title="Xem hồ sơ & Đổi mật khẩu"
            >
              <div className="header-avatar">
                {initialLetter}
              </div>

              <div className="header-user-meta hide-on-mobile">
                <div className="header-user-name-row">
                  <span className="header-user-name">
                    {currentUser?.name || 'Administrator'}
                  </span>
                  <span className="header-role-badge" style={roleBadgeStyle}>
                    {roleLabel}
                  </span>
                </div>
                <span className="header-user-email">
                  {currentUser?.email || 'admin@eduresearch.com'}
                </span>
              </div>
            </Link>
          </div>
        </header>

        <main className="dashboard-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
