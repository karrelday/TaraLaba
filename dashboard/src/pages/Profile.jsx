import React, { useState, useEffect } from 'react';
import { TextField, Button, Paper, Typography, Box, Alert, Snackbar } from '@mui/material';
import axios from 'axios';
import Sidebar from './Sidebar';

function Profile() {
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    userName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState({ text: '', type: 'info' });
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await axios.get(`http://192.168.100.147:5173/fetchusers`);
      const users = response.data;
      const currentUser = users.find(user => user._id === userId);
      
      if (currentUser) {
        setUserData(prev => ({
          ...prev,
          firstName: currentUser.firstName || '',
          lastName: currentUser.lastName || '',
          middleName: currentUser.middleName || '',
          userName: currentUser.userName || '',
          email: currentUser.email || ''
        }));
      }
    } catch (error) {
      showNotification('Error fetching user data', 'error');
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const showNotification = (text, type = 'success') => {
    setMessage({ text, type });
    setShowMessage(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    try {
      const userId = localStorage.getItem('userId');
      
      // If changing password, verify current password first
      if (userData.newPassword) {
        if (userData.newPassword !== userData.confirmPassword) {
          showNotification('New passwords do not match', 'error');
          return;
        }
      }

      const updateData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        middleName: userData.middleName,
        email: userData.email
      };

      if (userData.newPassword) {
        updateData.password = userData.newPassword;
      }

      await axios.put(`http://192.168.100.147:5173/updateuser/${userId}`, updateData);
      showNotification('Profile updated successfully');
      
      // Clear password fields
      setUserData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      showNotification(error.response?.data?.message || 'Error updating profile', 'error');
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <Box sx={{ flex: 1, p: 3 }}>
        <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
          <Typography variant="h4" gutterBottom>
            Profile Settings
          </Typography>
          
          <form onSubmit={handleSubmit}>
            <TextField
              name="firstName"
              label="First Name"
              value={userData.firstName}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
            
            <TextField
              name="lastName"
              label="Last Name"
              value={userData.lastName}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
            
            <TextField
              name="middleName"
              label="Middle Name"
              value={userData.middleName}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
            
            <TextField
              name="email"
              label="Email"
              value={userData.email}
              onChange={handleChange}
              fullWidth
              margin="normal"
              type="email"
            />
            
            <TextField
              name="userName"
              label="Username"
              value={userData.userName}
              onChange={handleChange}
              fullWidth
              margin="normal"
              disabled
            />
            
            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              Change Password
            </Typography>
            
            <TextField
              name="currentPassword"
              label="Current Password"
              value={userData.currentPassword}
              onChange={handleChange}
              fullWidth
              margin="normal"
              type="password"
            />
            
            <TextField
              name="newPassword"
              label="New Password"
              value={userData.newPassword}
              onChange={handleChange}
              fullWidth
              margin="normal"
              type="password"
            />
            
            <TextField
              name="confirmPassword"
              label="Confirm New Password"
              value={userData.confirmPassword}
              onChange={handleChange}
              fullWidth
              margin="normal"
              type="password"
            />
            
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              sx={{ mt: 3 }}
              fullWidth
            >
              Save Changes
            </Button>
          </form>
        </Paper>
        
        <Snackbar
          open={showMessage}
          autoHideDuration={6000}
          onClose={() => setShowMessage(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setShowMessage(false)} 
            severity={message.type} 
            sx={{ width: '100%' }}
          >
            {message.text}
          </Alert>
        </Snackbar>
      </Box>
    </div>
  );
}

export default Profile;