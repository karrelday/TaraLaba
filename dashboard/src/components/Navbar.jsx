import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import NotificationIcon from './NotificationIcon';
import Aurora from '../components/Aurora'; // <-- Import Aurora here
import BlurText from "../components/BlurText";
import axios from 'axios';
import '../styles/Navbar.css';

const Navbar = () => {
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(null);
  const location = useLocation();

  // Get page title based on current route
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Order Management Dashboard';
      case '/home':
        return 'Home';
      case '/orderstatus':
        return 'Order Status';
      case '/notifications':
        return 'Notifications';
      case '/profile':
        return 'Profile';
      default:
        return '';
    }
  };

  // Fetch user data
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      const fetchUser = async () => {
        try {
          const response = await axios.get(`http://192.168.9.27:1337/user/${userId}`);
          setUser(response.data);
        } catch (error) {
          console.error("Error fetching user:", error);
        }
      };
      fetchUser();
    }
  }, []);

  // Fetch notifications only if not on login/signup and userId exists
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (location.pathname !== '/login' && location.pathname !== '/signup' && userId) {
      const fetchNotifications = async () => {
        try {
          const response = await axios.get("http://192.168.9.27:1337/notifications", {
            headers: { 'user-id': userId }
          });
          setNotifications(response.data);
        } catch (error) {
          console.error("Error fetching notifications:", error);
        }
      };
      fetchNotifications();
    }
  }, [location.pathname]);

  return (
    <>
      <div className="navbar">
        <div className="navbar-left">
         
        </div>
        <div className="navbar-right">
          {user && (
            <div className="user-greeting">
              Hello, {user.name || 'User'}
            </div>
          )}
          {/* Only show NotificationIcon if not on login or signup page */}
          {location.pathname !== '/login' && location.pathname !== '/signup' && (
            <NotificationIcon notifications={notifications} />
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;