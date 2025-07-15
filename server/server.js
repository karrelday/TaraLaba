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
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const app = express();
app.use(cors());
app.use(express.json());
dotenv.config();
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
    // If the user is a customer, set isConfirmed to true automatically
    if (req.body.role === 'customer') {
      req.body.isConfirmed = true;
    }
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

    const user = await User.findOne({ userName });
    if (!user) {
      console.log("Login failed: Invalid credentials");
      return res.status(400).json({ message: "Invalid username or password" });
    }

    // Check if user is confirmed BEFORE sending success
    if (!user.isConfirmed) {
      return res.status(403).json({ message: 'Account not confirmed. Please wait for admin confirmation.' });
    }

    // (Optional: check password here)

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
    // Ensure customerId is set to the authenticated user's ID
    const orderData = {
      ...req.body,
      customerId: req.user._id
    };
    const newOrder = new Order(orderData);
    const savedOrder = await newOrder.save();

    // Send email to user
    const user = await User.findById(orderData.customerId);
    if (user && user.email) {
      await sendOrderEmail(
        user.email,
        "Order Placed Successfully",
        `Hi ${user.firstName}, your order #${savedOrder.orderId || savedOrder._id} has been placed.`
      );
    }

    // Create notification for the user (optional)
    await Notification.create({
      userId: req.user._id,
      orderId: savedOrder._id,
      message: "Your order has been placed successfully.",
      type: "alert",
      createdBy: req.user._id
    });

    res.status(201).json(savedOrder);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update order status with notification
app.put("/updateorder/:orderId", authenticateUser, async (req, res) => {
  try {
    const orderId = req.params.orderId;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid order ID format" });
    }

    // Update any fields provided in req.body (including isPaid)
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Send email to user if status changed
    if (req.body.status) {
      const user = await User.findById(updatedOrder.customerId);
      if (user && user.email) {
        await sendOrderEmail(
          user.email,
          "Order Status Updated",
          `Hi ${user.firstName}, your order #${updatedOrder.orderId || updatedOrder._id} status is now "${updatedOrder.status}".`
        );
      }
    }

    res.json({ message: "Order updated", order: updatedOrder });
  } catch (err) {
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

    // Fallbacks for missing fields
    const items = order.items && order.items.length > 0
      ? order.items
      : [{
          service: order.serviceType || "Laundry Service",
          quantity: order.laundryWeight || 1,
          pricePerUnit: order.amountToPay || order.totalAmount || 0
        }];
    const totalAmount = order.amountToPay || order.totalAmount || 0;

    // Create receipt record
    const receipt = new Receipt({
      receiptId: `RCP-${Date.now()}`,
      orderId: order._id,
      userId: order.customerId,
      items,
      totalAmount,
      tax: totalAmount * 0.1, // 10% tax
      discount: 0,
      finalAmount: totalAmount * 1.1,
      paymentMethod: order.paymentMethod || "N/A",
      paymentStatus: order.isPaid ? "completed" : "pending"
    });
    await receipt.save();

    // Generate PDF
    const doc = new PDFDocument();
    const filename = `receipt-${receipt.receiptId}.pdf`;
    const filePath = path.join(uploadsDir, filename);

    doc.pipe(fs.createWriteStream(filePath));

    // Add content to PDF
    doc.fontSize(20).text('TaraLaba Receipt', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Receipt ID: ${receipt.receiptId}`);
    doc.text(`Order ID: ${order._id}`);
    doc.text(`Date: ${new Date().toLocaleString()}`);
    doc.moveDown();
    doc.text('Items:');
    receipt.items.forEach(item => {
      doc.text(`${item.service} - Quantity: ${item.quantity} - ₱${item.pricePerUnit} each`);
    });
    doc.moveDown();
    doc.text(`Subtotal: ₱${receipt.totalAmount.toFixed(2)}`);
    doc.text(`Tax (10%): ₱${receipt.tax.toFixed(2)}`);
    doc.text(`Total: ₱${receipt.finalAmount.toFixed(2)}`);

    doc.end();

    // Send file to client
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${order._id}.pdf`);
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

// Confirm user (set isConfirmed to true)
app.post("/confirmuser/:id", async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { isConfirmed: true },
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User confirmed", user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// In-memory reset code store (for demo only)
const resetCodes = {};

// Forgot Password: send reset code
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required." });

  const user = await User.findOne({ email: { $regex: new RegExp("^" + email + "$", "i") } });
  if (!user) return res.status(404).json({ message: "No user found with that email." });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  resetCodes[email] = code;

  try {
    await sendOtpEmail(email, code, "forgot");
    res.json({ message: "Reset code sent to your email." });
  } catch (err) {
    res.status(500).json({ message: "Failed to send email. Please try again." });
  }
});

// Reset Password: verify code and update password
app.post("/reset-password", async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ message: "All fields are required." });
  }

  // Check code
  if (resetCodes[email] !== code) {
    return res.status(400).json({ message: "Invalid or expired reset code." });
  }

  // Find user by email (case-insensitive)
  const user = await User.findOne({ email: { $regex: new RegExp("^" + email + "$", "i") } });
  if (!user) return res.status(404).json({ message: "User not found." });

  // Update password (plain for demo; hash in production)
  user.password = newPassword;
  await user.save();

  // Remove used code
  delete resetCodes[email];

  res.json({ message: "Password updated successfully." });
});

// Configure your Gmail credentials (use App Password for Gmail accounts with 2FA)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'taralaba00@gmail.com', // replace with your Gmail
    pass: 'rged dqae jrmf ayjs'     // replace with your Gmail App Password
  }
});

// Helper to send OTP email
async function sendOtpEmail(to, code, purpose = "verification") {
  const subject = purpose === "signup"
    ? "TaraLaba Account Verification Code"
    : "TaraLaba Password Reset Code";
  const text = `Your TaraLaba ${purpose === "signup" ? "account verification" : "password reset"} code is: ${code}`;
  const html = `<p>Your TaraLaba ${purpose === "signup" ? "account verification" : "password reset"} code is: <b>${code}</b></p>
    <p>For clients that do not support AMP4EMAIL or amp content is not valid</p>`;
  const amp = `<!doctype html>
    <html ⚡4email>
      <head>
        <meta charset="utf-8">
        <style amp4email-boilerplate>body{visibility:hidden}</style>
        <script async src="https://cdn.ampproject.org/v0.js"></script>
        <script async custom-element="amp-anim" src="https://cdn.ampproject.org/v0/amp-anim-0.1.js"></script>
      </head>
      <body>
        <p>Your TaraLaba ${purpose === "signup" ? "account verification" : "password reset"} code is: <b>${code}</b></p>
        <p>Image: <amp-img src="https://cldup.com/P0b1bUmEet.png" width="16" height="16"/></p>
        <p>GIF (requires "amp-anim" script in header):<br/>
          <amp-anim src="https://cldup.com/D72zpdwI-i.gif" width="500" height="350"/></p>
      </body>
    </html>`;

  let message = {
    from: '"TaraLaba" <taralaba00@gmail.com>',
    to,
    subject,
    text,
    html,
    amp
  };

  await transporter.sendMail(message);
}

// In-memory OTP store for signup (for demo only)
const signupOtps = {};

// Send signup OTP
app.post("/send-signup-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required." });

  // Check if email already exists
  const user = await User.findOne({ email: { $regex: new RegExp("^" + email + "$", "i") } });
  if (user) return res.status(400).json({ message: "Email already registered." });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  signupOtps[email] = code;

  try {
    await sendOtpEmail(email, code, "signup");
    res.json({ message: "Verification code sent to your email." });
  } catch (err) {
    res.status(500).json({ message: "Failed to send email. Please try again." });
  }
});

app.post("/verify-signup-otp", async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ message: "Email and code are required." });

  if (signupOtps[email] !== code) {
    return res.status(400).json({ message: "Invalid or expired verification code." });
  }

  // OTP is valid, allow signup
  delete signupOtps[email];
  res.json({ message: "OTP verified. You can now complete your registration." });
});

// Utility function to send order-related emails
async function sendOrderEmail(to, subject, text) {
  await transporter.sendMail({
    from: '"TaraLaba" <taralaba00@gmail.com>',
    to,
    subject,
    text
  });
}

// Start the server
const PORT = process.env.PORT || 1337; // Use port from .env or default to 5173
const HOST = '0.0.0.0'; // Listen on all network interfaces

app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
