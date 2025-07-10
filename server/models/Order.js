const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: String,
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerName: String,
  laundryWeight: Number,
  amountToPay: Number,
  serviceType: String,
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Ready', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  date: {
    type: Date,
    default: Date.now
  },
  dateCompleted: Date,
  isPaid: { type: Boolean, default: false },
  paymentMethod: { type: String },
  paymentAccNumber: { type: String },
  paymentAccName: { type: String },
  paymentAmount: { type: Number }
});

module.exports = mongoose.model('Order', orderSchema);