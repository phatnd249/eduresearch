import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            backgroundColor: 'var(--primary)', 
            borderRadius: '12px', 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: 'white', 
            fontWeight: 'bold',
            fontSize: '1.25rem',
            marginBottom: '1rem'
          }}>
            ER
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>EduResearch</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Hệ thống nghiên cứu khoa học</p>
        </div>
        
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
