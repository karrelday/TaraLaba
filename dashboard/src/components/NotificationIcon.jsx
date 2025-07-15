import React, { useState, useEffect, useRef } from 'react';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CloseIcon from '@mui/icons-material/Close';
import Badge from '@mui/material/Badge';
import '../styles/NotificationIcon.css';

const NotificationIcon = ({ notifications = [], onRemoveNotification }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Remove notification handler
  const handleRemoveNotification = (index) => {
    if (typeof onRemoveNotification === "function") {
      onRemoveNotification(index);
    }
  };

  return (
    <div className="notification-container" ref={dropdownRef}>
      <div className="notification-icon" onClick={toggleDropdown}>
        <Badge badgeContent={notifications.length} color="error">
          <NotificationsIcon />
        </Badge>
      </div>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
          </div>

          <div className="notification-list">
            {notifications.length > 0 ? (
              notifications.map((notification, index) => (
                <div key={notification._id || index} className="notification-item">
                  <div className="notification-avatar">
                    {notification.avatar ? (
                      <img src={notification.avatar} alt="avatar" />
                    ) : (
                      <div className="default-avatar" />
                    )}
                  </div>
                  <div className="notification-content">
                    <div className="notification-text">
                      {notification.message}
                    </div>
                    <div className="notification-time">
                      {notification.time}
                    </div>
                  </div>
                  <button
                    className="notification-close"
                    onClick={() => handleRemoveNotification(index)}
                  >
                    <CloseIcon fontSize="small" />
                  </button>
                </div>
              ))
            ) : (
              <div className="no-notifications">No new notifications</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationIcon;