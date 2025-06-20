import React, { useState, useEffect } from "react";
import "../styles/Sidebar.css";
import { Link, useLocation } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import QrCodeIcon from "@mui/icons-material/QrCode";
import BuildIcon from "@mui/icons-material/Build";
import AssessmentIcon from "@mui/icons-material/Assessment";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import ReceiptIcon from '@mui/icons-material/Receipt';
import axios from "axios";
import { Badge } from "@mui/material";

function Sidebar({ onToggle }) {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const userRole = localStorage.getItem('userRole');
  
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      if (!mobile) {
        setIsOpen(true);
      }
    };
    handleResize();

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const response = await axios.get('http://localhost:1337/notifications', {
          headers: { 'user-id': localStorage.getItem('userId') }
        });
        setUnreadNotifications(response.data.length);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotificationCount();
    const interval = setInterval(fetchNotificationCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Communicate sidebar state to parent component
  useEffect(() => {
    if (onToggle) {
      onToggle(isOpen);
    }
  }, [isOpen, onToggle]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleBackdropClick = (e) => {
    if (isMobile && isOpen) {
      setIsOpen(false);
    }
  };

  const isActive = (path) => {
    return location.pathname === path ? "active" : "";
  };

  const handleLogout = () => {
    localStorage.clear();
  };

  return (
    <>
      {/* Mobile toggle button */}
      {isMobile && (
        <div className="toggle-btn" onClick={toggleSidebar}>
          {isOpen ? <CloseIcon /> : <MenuIcon />}
        </div>
      )}

      {/* Backdrop for mobile */}
      {isMobile && isOpen && (
        <div className="sidebar-backdrop" onClick={handleBackdropClick}></div>
      )}

      <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
        <h2>LaundroTrack</h2>
        
        <div className="menu-items">
          <div className={`menu ${isActive("/home")}`}>
            <HomeIcon className="icon" />
            <Link to="/home" className="link" onClick={() => isMobile && setIsOpen(false)}>
              <p>Home</p>
            </Link>
          </div>

          {(userRole === 'admin' || userRole === 'staff') && (
            <div className={`menu ${isActive("/reports")}`}>
              <AssessmentIcon className="icon" />
              <Link to="/reports" className="link" onClick={() => isMobile && setIsOpen(false)}>
                <p>Reports</p>
              </Link>
            </div>
          )}

          {userRole === 'admin' && (
            <div className={`menu ${isActive("/manage-users")}`}>
              <ManageAccountsIcon className="icon" />
              <Link to="/manage-users" className="link" onClick={() => isMobile && setIsOpen(false)}>
                <p>Manage Users</p>
              </Link>
            </div>
          )}

          {userRole === 'customer' && (
            <div className={`menu ${isActive("/my-orders")}`}>
              <ReceiptIcon className="icon" />
              <Link to="/my-orders" className="link" onClick={() => isMobile && setIsOpen(false)}>
                <p>My Orders</p>
              </Link>
            </div>
          )}

          <div className={`menu ${isActive("/profile")}`}>
            <AccountCircleIcon className="icon" />
            <Link to="/profile" className="link" onClick={() => isMobile && setIsOpen(false)}>
              <p>Profile</p>
            </Link>
          </div>

          {userRole === 'admin' && (
            <div className={`menu ${isActive("/settings")}`}>
              <SettingsIcon className="icon" />
              <Link to="/settings" className="link" onClick={() => isMobile && setIsOpen(false)}>
                <p>Settings</p>
              </Link>
            </div>
          )}

          <hr />
          <div className="menu">
            <LogoutIcon className="icon" />
            <Link to="/login" className="link" onClick={() => {
              handleLogout();
              isMobile && setIsOpen(false);
            }}>
              <p>Logout</p>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default Sidebar;