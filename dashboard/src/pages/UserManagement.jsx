import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  InputAdornment,
  Snackbar,
  Alert
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon } from '@mui/icons-material';
import axios from 'axios';
import Sidebar from './Sidebar';
import '../styles/UserManagement.css';

function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [message, setMessage] = useState({ text: '', type: 'success' });
  const [showMessage, setShowMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    userName: '',
    email: '',
    password: '',
    role: 'staff'
  });

  useEffect(() => {
    // Check if user is admin
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'admin') {
      navigate('/home');
      return;
    }

    fetchUsers();
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:1337/fetchusers', {
        headers: { 'user-id': localStorage.getItem('userId') }
      });
      setUsers(response.data);
    } catch (error) {
      showNotification('Error fetching users', 'error');
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName || '',
        userName: user.userName,
        email: user.email,
        password: '',
        role: user.role
      });
      setEditingUser(user);
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        middleName: '',
        userName: '',
        email: '',
        password: '',
        role: 'staff'
      });
      setEditingUser(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
  };

  const showNotification = (text, type = 'success') => {
    setMessage({ text, type });
    setShowMessage(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (editingUser) {
        await axios.put(`http://localhost:1337/updateuser/${editingUser._id}`, formData, {
          headers: { 'user-id': localStorage.getItem('userId') }
        });
        showNotification('User updated successfully');
      } else {
        await axios.post('http://localhost:1337/addusers', formData, {
          headers: { 'user-id': localStorage.getItem('userId') }
        });
        showNotification('User created successfully');
      }
      handleCloseDialog();
      fetchUsers();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Error processing request', 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await axios.delete(`http://localhost:1337/deleteuser/${userId}`, {
        headers: { 'user-id': localStorage.getItem('userId') }
      });
      showNotification('User deleted successfully');
      fetchUsers();
    } catch (error) {
      showNotification('Error deleting user', 'error');
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (user.firstName && user.firstName.toLowerCase().includes(searchLower)) ||
      (user.lastName && user.lastName.toLowerCase().includes(searchLower)) ||
      (user.userName && user.userName.toLowerCase().includes(searchLower)) ||
      (user.email && user.email.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="app-container">
      <Sidebar />
      <div className="user-management-container">
        <div className="user-management-content">
          <div className="user-management">
            <div className="user-management-header">
              <h2>User Management</h2>
              <Button
                className="add-user-btn"
                onClick={() => handleOpenDialog()}
                startIcon={<AddIcon />}
              >
                Add New User
              </Button>
            </div>

            <div className="table-wrapper">
              <h3>
                User List
                <div className="table-controls">
                  <TextField
                    className="search-field"
                    placeholder="Search users..."
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </div>
              </h3>

              <table className="user-management-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Username</th>
                    <th className="hide-on-mobile">Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user._id}>
                      <td>{`${user.firstName} ${user.lastName}`}</td>
                      <td>{user.userName}</td>
                      <td className="hide-on-mobile">{user.email}</td>
                      <td>{user.role}</td>
                      <td>
                        <div className="action-buttons">
                          <IconButton
                            className="edit-btn"
                            onClick={() => handleOpenDialog(user)}
                            disabled={user.role === 'admin'}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            className="delete-btn"
                            onClick={() => handleDeleteUser(user._id)}
                            disabled={user.role === 'admin'}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUsers.length > 0 && (
                <div className="table-pagination">
                  <span className="pagination-info">
                    Showing {filteredUsers.length} of {users.length} users
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          className: 'modal-box'
        }}
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingUser ? 'Edit User Details' : 'Add New User'}
          </DialogTitle>
          <DialogContent>
            <div style={{ display: 'flex', gap: '16px' }}>
              <TextField
                name="firstName"
                label="First Name"
                value={formData.firstName}
                onChange={handleChange}
                fullWidth
                required
                size="small"
              />
              <TextField
                name="lastName"
                label="Last Name"
                value={formData.lastName}
                onChange={handleChange}
                fullWidth
                required
                size="small"
              />
            </div>
            <TextField
              name="middleName"
              label="Middle Name"
              value={formData.middleName}
              onChange={handleChange}
              fullWidth
              size="small"
            />
            <TextField
              name="userName"
              label="Username"
              value={formData.userName}
              onChange={handleChange}
              fullWidth
              required
              size="small"
            />
            <TextField
              name="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              fullWidth
              required
              size="small"
            />
            {!editingUser && (
              <TextField
                name="password"
                label="Password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                fullWidth
                required
                size="small"
              />
            )}
            <FormControl fullWidth size="small">
              <InputLabel>Role</InputLabel>
              <Select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <MenuItem value="staff">Staff</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="customer">Customer</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions className="modal-buttons">
            <Button type="submit">
              {editingUser ? 'Save Changes' : 'Create User'}
            </Button>
            <Button onClick={handleCloseDialog}>
              Cancel
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={showMessage}
        autoHideDuration={6000}
        onClose={() => setShowMessage(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setShowMessage(false)} severity={message.type} sx={{ width: '100%' }}>
          {message.text}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default UserManagement; 