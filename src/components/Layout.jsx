import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';

function Layout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      alert('Der opstod en fejl ved logud.');
    }
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <img 
            src="/logo_white.png" 
            alt="Piblo Logo" 
            className="sidebar-logo"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'block';
            }}
          />
          <div style={{ 
            width: '80px', 
            height: '80px', 
            margin: '0 auto 15px',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '40px'
          }}>
            🏠
          </div>
          <div className="sidebar-title">Piblo</div>
        </div>
        
        <nav className="sidebar-nav">
          <NavLink
            to="/sager"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            Sager
          </NavLink>
          <NavLink
            to="/timeregistrering"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            Timeregistrering
          </NavLink>
          <NavLink
            to="/indstillinger"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            Indstillinger
          </NavLink>
        </nav>
        
        <div className="sidebar-footer">
          <button className="btn-logout" onClick={handleLogout}>
            Log ud
          </button>
        </div>
      </aside>
      
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;