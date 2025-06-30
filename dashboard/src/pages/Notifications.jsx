import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, 
  List, 
  ListItem, 
  ListItemText, 
  Typography, 
  IconButton, 
  Badge,
  Paper,
  Container,
  Divider,
  CircularProgress
} from '@mui/material';
import { Check as CheckIcon, Notifications as NotificationsIcon } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const userId = localStorage.getItem('userId');

  const fetchNotifications = async () => {
    if (!userId) {
      console.warn('No userId found in localStorage');
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching notifications for userId:', userId);
      
      const response = await axios.get('http://192.168.9.27:1337/notifications', {
        headers: { 'user-id': userId }
      });
      console.log('Notifications response:', response.data);
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      console.error('Response data:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Refresh notifications when navigating back to this page
  useEffect(() => {
    if (location.state?.refreshNotifications) {
      fetchNotifications();
      // Clear the state to prevent unnecessary refreshes
      navigate(location.pathname, { replace: true });
    }
  }, [location.state]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      console.log('Marking notification as read:', notificationId);
      
      await axios.put(`http://192.168.100.12:1337/notifications/${notificationId}/read`, {}, {
        headers: { 'user-id': userId }
      });
      
      // Update the local state to mark the notification as read
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      console.error('Response data:', error.response?.data);
    }
  };

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: { xs: 2, md: 3 },
          overflow: 'auto',
          height: '100vh'
        }}
      >
        <Container maxWidth="md" sx={{ mt: 2 }}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              borderRadius: 2,
              mb: 4
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              mb: 2
            }}>
              <Typography variant="h4" component="h1">
                Notifications
              </Typography>
              <Badge 
                badgeContent={unreadCount} 
                color="primary"
                sx={{ ml: 2 }}
              >
                <NotificationsIcon fontSize="large" />
              </Badge>
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : notifications.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="textSecondary">
                  No notifications yet
                </Typography>
              </Box>
            ) : (
              <List sx={{ width: '100%' }}>
                {notifications.map((notification) => (
                  <ListItem
                    key={notification._id}
                    sx={{
                      mb: 2,
                      bgcolor: notification.isRead ? 'grey.100' : 'white',
                      borderRadius: 1,
                      border: 1,
                      borderColor: 'grey.300',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: notification.isRead ? 'grey.200' : 'grey.50',
                        transform: 'translateY(-2px)',
                        boxShadow: 1
                      }
                    }}
                    secondaryAction={
                      !notification.isRead && (
                        <IconButton 
                          edge="end" 
                          aria-label="mark as read"
                          onClick={() => handleMarkAsRead(notification._id)}
                          sx={{
                            color: 'primary.main',
                            '&:hover': {
                              bgcolor: 'primary.lighter',
                            }
                          }}
                        >
                          <CheckIcon />
                        </IconButton>
                      )
                    }
                  >
                    <ListItemText
                      primary={notification.message}
                      secondary={new Date(notification.createdAt).toLocaleString()}
                      sx={{
                        '& .MuiListItemText-primary': {
                          color: notification.isRead ? 'text.secondary' : 'text.primary',
                          fontWeight: notification.isRead ? 'normal' : 'medium',
                          fontSize: '1rem',
                          mb: 0.5
                        },
                        '& .MuiListItemText-secondary': {
                          fontSize: '0.875rem'
                        }
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default Notifications;