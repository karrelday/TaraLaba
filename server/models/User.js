const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: String,
  firstName: String,
  lastName: String,
  middleName: String,
  userName: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['admin', 'staff', 'customer'],
    default: 'customer'
  },
  permissions: {
    type: [String],
    default: function() {
      switch(this.role) {
        case 'admin':
          return ['manage_users', 'manage_orders', 'view_all', 'manage_system'];
        case 'staff':
          return ['manage_orders', 'view_assigned_orders'];
        case 'customer':
          return ['view_own_orders', 'create_orders'];
        default:
          return [];
      }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: Date
});

userSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission);
};

module.exports = mongoose.model('User', userSchema);