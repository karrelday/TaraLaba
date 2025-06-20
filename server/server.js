const express = require("express");
const cors = require("cors");
const mongoose = require('mongoose');
const User = require('./models/User');
const Order = require('./models/Order');
const Receipt = require('./models/Receipt');
const Notification = require('./models/Notification');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Authentication middleware
const authenticateUser = async (req, res, next) => {
  const userId = req.headers['user-id'];
  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ message: 'Error authenticating user' });
  }
};

// Permission middleware
const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    if (!req.user.hasPermission(requiredPermission)) {
      return res.status(403).json({ message: 'Permission denied' });
    }
    next();
  };
};

// Connect to MongoDB with explicit database name
mongoose.connect('mongodb://localhost:27017/LaundroData')
  .then(async () => {
    console.log('MongoDB Connected');
    console.log('Database name:', mongoose.connection.db.databaseName);
    
    // Find orders without customerId and update them
    try {
      // First, find an admin user to assign as the customer
      const adminUser = await User.findOne({ role: 'admin' });
      if (!adminUser) {
        console.log('No admin user found to update orders');
        return;
      }
      
      // Find orders without customerId
      const ordersToUpdate = await Order.find({ customerId: { $exists: false } });
      console.log(`Found ${ordersToUpdate.length} orders without customerId`);
      
      // Update each order
      for (const order of ordersToUpdate) {
        await Order.findByIdAndUpdate(order._id, {
          $set: { customerId: adminUser._id }
        });
      }
      console.log('Updated orders with customerId');
      
      // Log collections
      console.log('Collections:');
      mongoose.connection.db.listCollections().toArray()
        .then(collections => {
          collections.forEach(collection => {
            console.log(' -', collection.name);
          });
          // Log the count of documents in notifications collection
          mongoose.connection.db.collection('notifications').countDocuments()
            .then(count => {
              console.log('Number of notifications:', count);
            });
        });
      console.log('Models registered:');
      console.log(' - User collection:', User.collection.name);
      console.log(' - Order collection:', Order.collection.name);
      console.log(' - Notification collection:', Notification.collection.name);
    } catch (err) {
      console.error('Error updating orders:', err);
      console.error('Error stack:', err.stack);
    }
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    console.error('Error stack:', err.stack);
  });

// Monitor connection status
mongoose.connection.on('disconnected', () => console.log('MongoDB disconnected'));
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
  console.error('Error stack:', err.stack);
});

// Default Route
app.get("/", (req, res) => {
  res.send("Laundry Management API Connected to MongoDB");
});

// Database health check endpoint
app.get("/db-status", async (req, res) => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    res.json({
      status: "connected",
      database: mongoose.connection.db.databaseName,
      collections: collections.map(c => c.name)
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ======== USERS ROUTES ========

// Fetch all users
app.get("/fetchusers", async (req, res) => {
  try {
    const users = await User.find();
    console.log(`Found ${users.length} users`);
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: err.message });
  }
});

// Fetch single user by ID
app.get("/fetchusers/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Don't send password in response
    const userResponse = {
      _id: user._id,
      userId: user.userId,
      firstName: user.firstName,
      lastName: user.lastName,
      userName: user.userName,
      role: user.role
    };
    
    res.json(userResponse);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ message: err.message });
  }
});

// Add a new user
app.post("/addusers", async (req, res) => {
  try {
    console.log("Received user data:", req.body);
    const newUser = new User(req.body);
    const savedUser = await newUser.save();
    console.log("Saved user to database:", savedUser);
    
    // Verify user was added
    const userCount = await User.countDocuments();
    console.log(`Total users in database: ${userCount}`);
    
    res.status(201).json(savedUser);
  } catch (err) {
    console.error("Error adding user:", err);
    res.status(400).json({ message: err.message });
  }
});

// Update a user
app.put("/updateuser/:id", async (req, res) => {
  try {
    console.log("Update request for user ID:", req.params.id);
    console.log("Update data:", req.body);
    
    // Try to update by MongoDB _id first
    let updatedUser = await User.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );
    
    // If not found by _id, try by userId field
    if (!updatedUser) {
      updatedUser = await User.findOneAndUpdate(
        { userId: req.params.id }, 
        req.body, 
        { new: true }
      );
    }
    
    if (!updatedUser) {
      console.log("User not found for update");
      return res.status(404).json({ message: "User not found" });
    }
    
    console.log("User updated successfully:", updatedUser);
    res.json(updatedUser);
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(400).json({ message: err.message });
  }
});

// Delete a user
app.delete("/deleteuser/:id", async (req, res) => {
  try {
    console.log("Delete request for user ID:", req.params.id);
    
    // Try to delete by MongoDB _id first
    let deletedUser = await User.findByIdAndDelete(req.params.id);
    
    // If not found by _id, try by userId field
    if (!deletedUser) {
      deletedUser = await User.findOneAndDelete({ userId: req.params.id });
    }
    
    if (!deletedUser) {
      console.log("User not found for deletion");
      return res.status(404).json({ message: "User not found" });
    }
    
    console.log("User deleted successfully:", deletedUser);
    res.json({ message: "User deleted", deletedUser });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ message: err.message });
  }
});

// User login
app.post("/login", async (req, res) => {
  try {
    const { userName, password } = req.body;
    console.log("Login attempt for username:", userName);
    
    const user = await User.findOne({ userName, password });
    if (user) {
      console.log("Login successful for user:", user.firstName);
      res.status(200).json({ 
        message: "Login successful", 
        user: {
          _id: user._id,
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          userName: user.userName,
          role: user.role,
          permissions: user.permissions
          // Note: not sending password back to client
        } 
      });
    } else {
      console.log("Login failed: Invalid credentials");
      res.status(401).json({ message: "Invalid username or password" });
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ======== ORDERS ROUTES ========

// Fetch all orders
app.get("/fetchorder", authenticateUser, async (req, res) => {
  try {
    let query = {};
    
    // If user is a customer, only return their orders
    if (req.user.role === 'customer') {
      query = { customerId: req.user._id };
    }
    
    const orders = await Order.find(query);
    console.log(`Found ${orders.length} orders for ${req.user.role}`);
    res.json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ message: err.message });
  }
});

// Fetch orders by status
app.get("/fetchorder/status/:status", async (req, res) => {
  try {
    const status = req.params.status;
    const orders = await Order.find({ status });
    console.log(`Found ${orders.length} orders with status: ${status}`);
    res.json(orders);
  } catch (err) {
    console.error("Error fetching orders by status:", err);
    res.status(500).json({ message: err.message });
  }
});

// Fetch orders by customer
app.get("/fetchorder/customer/:customerId", async (req, res) => {
  try {
    const customerId = req.params.customerId;
    const orders = await Order.find({ customerId });
    console.log(`Found ${orders.length} orders for customer: ${customerId}`);
    res.json(orders);
  } catch (err) {
    console.error("Error fetching orders by customer:", err);
    res.status(500).json({ message: err.message });
  }
});

// Fetch order by ID
app.get("/fetchorder/id/:orderId", authenticateUser, async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // If user is a customer, verify they own the order
    if (req.user.role === 'customer' && order.customerId !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(order);
  } catch (err) {
    console.error("Error fetching order:", err);
    res.status(500).json({ message: err.message });
  }
});

// Add a new order
app.post("/addorder", authenticateUser, async (req, res) => {
  try {
    console.log("\n=== Starting Order Creation ===");
    console.log("Authenticated user:", req.user._id);
    console.log("Received order data:", req.body);
    
    // Ensure customerId is set to the authenticated user's ID
    const orderData = {
      ...req.body,
      customerId: req.user._id
    };
    console.log("Creating order with data:", JSON.stringify(orderData, null, 2));

    const newOrder = new Order(orderData);
    const savedOrder = await newOrder.save();
    console.log("Saved order to database:", JSON.stringify(savedOrder, null, 2));
    
    res.status(201).json(savedOrder);
  } catch (err) {
    console.error("Error adding order:", err);
    console.error("Error stack:", err.stack);
    res.status(400).json({ message: err.message });
  }
});

// Update order status with notification
app.put("/updateorder/:orderId", authenticateUser, async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const { status } = req.body;
    console.log("\n=== Starting Order Update ===");
    console.log("Updating order:", orderId, "with status:", status);
    console.log("Admin user making update:", req.user._id);
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      console.error("Invalid orderId format:", orderId);
      return res.status(400).json({ message: "Invalid order ID format" });
    }
    
    // Find the order by MongoDB _id
    const order = await Order.findById(orderId);
    console.log("Found order:", JSON.stringify(order, null, 2));
    
    if (!order) {
      console.log("Order not found:", orderId);
      return res.status(404).json({ message: "Order not found" });
    }
    
    const oldStatus = order.status;
    console.log("Status change:", oldStatus, "->", status);
    
    // Update the order status
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status: status },
      { new: true, runValidators: true }
    );
    console.log("Updated order:", JSON.stringify(updatedOrder, null, 2));

    // Get the customer ID from the order
    const customerId = order.customerId;
    console.log("Customer ID from order:", customerId);

    if (!customerId) {
      console.warn("No customerId found for order:", orderId);
      return res.json({ message: "Order updated (no notification sent)", order: updatedOrder });
    }

    // Validate customer ID format
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      console.error("Invalid customerId format:", customerId);
      return res.json({ 
        message: "Order updated (invalid customer ID format)", 
        order: updatedOrder 
      });
    }

    try {
      console.log("Creating notification with params:", {
        customerId,
        orderId: order._id,
        oldStatus,
        newStatus: status,
        adminId: req.user._id
      });
      
      // Create notification for the customer, with admin as creator
      const savedNotification = await Notification.createStatusChangeNotification(
        customerId,
        order._id,
        oldStatus,
        status,
        req.user._id // Pass the admin's ID as the notification creator
      );
      console.log("Notification created successfully:", JSON.stringify(savedNotification, null, 2));
      
      res.json({ 
        message: "Order updated with notification", 
        order: updatedOrder,
        notification: savedNotification
      });
    } catch (notifError) {
      console.error("Failed to create notification. Error details:", notifError);
      console.error("Error stack:", notifError.stack);
      return res.json({ 
        message: "Order updated (notification failed)", 
        order: updatedOrder,
        notificationError: notifError.message 
      });
    }
  } catch (err) {
    console.error("Error updating order:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({ message: err.message });
  }
});

// Delete an order
app.delete("/deleteorder/:orderId", async (req, res) => {
  try {
    console.log("Delete request for order ID:", req.params.orderId);
    
    // Try to delete by MongoDB _id first
    let deletedOrder = await Order.findByIdAndDelete(req.params.orderId);
    
    // If not found by _id, try by orderId field
    if (!deletedOrder) {
      deletedOrder = await Order.findOneAndDelete({ orderId: req.params.orderId });
    }
    
    if (!deletedOrder) {
      console.log("Order not found for deletion");
      return res.status(404).json({ message: "Order not found" });
    }
    
    console.log("Order deleted successfully:", deletedOrder);
    res.json({ message: "Order deleted", deletedOrder });
  } catch (err) {
    console.error("Error deleting order:", err);
    res.status(500).json({ message: err.message });
  }
});

// ======== RECEIPTS ROUTES ========

// Generate and download receipt
app.get("/receipt/:orderId", authenticateUser, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user has permission to access this receipt
    if (req.user.role === 'customer' && order.customerId !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Create receipt record
    const receipt = new Receipt({
      receiptId: `RCP-${Date.now()}`,
      orderId: order._id,
      userId: order.customerId,
      items: order.items,
      totalAmount: order.totalAmount,
      tax: order.totalAmount * 0.1, // 10% tax
      discount: 0,
      finalAmount: order.totalAmount * 1.1,
      paymentMethod: "Card",
      paymentStatus: "completed"
    });
    await receipt.save();

    // Generate PDF
    const doc = new PDFDocument();
    const filename = `receipt-${receipt.receiptId}.pdf`;
    const filePath = path.join(uploadsDir, filename);
    
    doc.pipe(fs.createWriteStream(filePath));

    // Add content to PDF
    doc.fontSize(20).text('LaundroTrack Receipt', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Receipt ID: ${receipt.receiptId}`);
    doc.text(`Order ID: ${order._id}`);
    doc.text(`Date: ${new Date().toLocaleString()}`);
    doc.moveDown();
    doc.text('Items:');
    receipt.items.forEach(item => {
      doc.text(`${item.service} - Quantity: ${item.quantity} - $${item.pricePerUnit} each`);
    });
    doc.moveDown();
    doc.text(`Subtotal: $${receipt.totalAmount.toFixed(2)}`);
    doc.text(`Tax (10%): $${receipt.tax.toFixed(2)}`);
    doc.text(`Total: $${receipt.finalAmount.toFixed(2)}`);
    
    doc.end();

    // Send file to client
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error("Error sending file:", err);
        res.status(500).json({ message: "Error downloading receipt" });
      }
      // Delete file after sending
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting temporary receipt file:", err);
      });
    });
  } catch (err) {
    console.error("Error generating receipt:", err);
    res.status(500).json({ message: err.message });
  }
});

// ======== NOTIFICATIONS ROUTES ========

// Get user notifications
app.get("/notifications", authenticateUser, async (req, res) => { 
  try {
    console.log("Fetching notifications for user:", req.user._id);
    console.log("User role:", req.user.role);
    
    let query = {};
    
    // If user is a customer, only show their notifications
    if (req.user.role === 'customer') {
      query = { 
        userId: req.user._id
      };
    } else {
      // For admin/staff, show all notifications they created
      query = { 
        createdBy: req.user._id
      };
    }
    
    console.log("Notification query:", query);
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'firstName lastName userName')
      .populate('orderId');
      
    console.log("Found notifications:", notifications.length);
    console.log("Notification details:", JSON.stringify(notifications, null, 2));
    
    res.json(notifications);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({ message: err.message });
  }
});

// Mark notification as read
app.put("/notifications/:notificationId/read", authenticateUser, async (req, res) => {
  try {
    console.log("Marking notification as read:", req.params.notificationId);
    
    const notification = await Notification.findById(req.params.notificationId);
    
    if (!notification) {
      console.log("Notification not found");
      return res.status(404).json({ message: "Notification not found" });
    }
    
    // Verify the user has permission to mark this notification as read
    if (req.user.role === 'customer' && notification.userId.toString() !== req.user._id.toString()) {
      console.log("Permission denied - User does not own this notification");
      return res.status(403).json({ message: "Permission denied" });
    }
    
    notification.isRead = true;
    await notification.save();
    
    console.log("Notification marked as read successfully");
    res.json({ message: "Notification marked as read", notification });
  } catch (err) {
    console.error("Error marking notification as read:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({ message: err.message });
  }
});

// Start the server
const port = 1337;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
