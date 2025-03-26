import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './sidebar.layout.css';
import { FaHome, FaFileAlt, FaChevronDown, FaCog, FaUserTie } from 'react-icons/fa';
import { AiFillDashboard } from "react-icons/ai";

const Sidebar = ({ username, isAdmin, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false); // State for reports dropdown
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  
  const location = useLocation(); // Get the current location

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleReportsDropdown = () => {
    setIsReportsOpen(!isReportsOpen);
  };

  // Close the mobile menu when the location changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <>
      <div className={`sidebar ${isMobileMenuOpen ? 'open' : ''} ${isHovered ? 'hovered' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="logo">
          <Link to="/" onClick={toggleMobileMenu}>
            Tracer
          </Link>
        </div>
        <nav className="nav">
          <Link to="/admin-dashboard" onClick={toggleMobileMenu}>
            <AiFillDashboard className="nav-icon" />
            <span className="nav-text">Dash</span>
          </Link>
          {/* Add Agents Nav Item 
          <Link to="/merchants" onClick={toggleMobileMenu}>
            <FaUserTie className="nav-icon" />
            <span className="nav-text">Merchants</span>
          </Link>*/}
          {/* Add Merchants Nav Item */}
          <Link to="/agents" onClick={toggleMobileMenu}>
            <FaUserTie className="nav-icon" />
            <span className="nav-text">Agents</span>
          </Link>
          <Link to="/reports/all" onClick={toggleMobileMenu}>
            <FaFileAlt className="nav-icon" />
            <span className="nav-text">Reports</span>
          </Link>
          {/*}
          <div className="dropdown" onClick={toggleReportsDropdown}>
            <div className="dropdown-toggle">
              <FaFileAlt className="nav-icon" />
              <span className="nav-text">Reports</span>
              <FaChevronDown className={`chevron ${isReportsOpen ? 'open' : ''}`} />
            </div>
            {isReportsOpen && (
              <div className="dropdown-menu">
                <Link to="/reports/billing" className="dropdown-item">
                  Billing Reports
                </Link>
                <Link to="/reports/ar" className="dropdown-item">
                  AR Reports
                </Link>
                <Link to="/reports/processor" className="dropdown-item">
                  Processor Reports
                </Link>
              </div>
            )}
          </div>
              */}
        </nav>
        <div className="sidebar-footer">
          {username ? (
            <>
              <div className="profile-section">
                <Link to={`/user-settings/${username}`} className="connected profile-link">
                  <div className="wallet-info">
                    <FaCog className="settings-icon" />
                    <span>{username}</span>
                  </div>
                </Link>
              </div>
              <button onClick={onLogout} className="logout-button">
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="pill-button">
              Login
            </Link>
          )}
          <div className="theme-toggle-container">
            <label className="switch">
              <input
                type="checkbox"
                checked={theme === 'dark'}
                onChange={toggleTheme}
              />
              <span className="slider round"></span>
            </label>
            <span className="theme-label">Dark Mode</span>
          </div>
        </div>
        {isMobileMenuOpen && <div className="overlay show" onClick={toggleMobileMenu}></div>}
      </div>
      <div className="hamburger" onClick={toggleMobileMenu}>
        <div className="line"></div>
        <div className="line"></div>
        <div className="line"></div>
      </div>
    </>
  );
};

export default Sidebar;
