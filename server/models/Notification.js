const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['status_change', 'reminder', 'alert']
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

notificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  return this.save();
};

notificationSchema.statics.createStatusChangeNotification = async function(userId, orderId, oldStatus, newStatus, createdBy) {
  console.log('Creating status change notification with params:', {
    userId,
    orderId,
    oldStatus,
    newStatus,
    createdBy
  });
  
  const message = `Your order status has been updated from ${oldStatus} to ${newStatus}`;
  
  const notification = new this({
    userId,
    orderId,
    message,
    type: 'status_change',
    createdBy: createdBy || userId // If no creator specified, assume it's a system notification
  });

  console.log('Created notification object:', notification);
  
  try {
    const savedNotification = await notification.save();
    console.log('Successfully saved notification:', savedNotification);
    return savedNotification;
  } catch (error) {
    console.error('Error saving notification:', error);
    console.error('Notification that failed to save:', notification);
    throw error;
  }
};

module.exports = mongoose.model('Notification', notificationSchema); 