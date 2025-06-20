import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Button,
  TextField,
  Modal,
  Box,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  InputAdornment,
  CircularProgress,
  Snackbar,
  Alert
} from "@mui/material";
import Sidebar from "./Sidebar";
import ChatBot from "./ChatBot";
import "../styles/Home.css";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import SearchIcon from '@mui/icons-material/Search';
import axios from "axios";

function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: "", severity: "success" });
  const [isCustomer, setIsCustomer] = useState(localStorage.getItem('userRole') === 'customer');
  const [currentUser, setCurrentUser] = useState(null);

  // Form validation
  const [formErrors, setFormErrors] = useState({});
  
  const [formData, setFormData] = useState({
    orderId: "",
    customerName: "",
    laundryWeight: "",
    amountToPay: "",
    date: "",
    serviceType: "",
  });

  // Filter orders based on search term
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Ensure that the values are not undefined or null before applying methods
      const customerName = order.customerName?.toLowerCase() || "";
      const orderId = order.orderId?.toString() || "";
      const status = order.status?.toLowerCase() || "";
      const searchLower = searchTerm.toLowerCase();
  
      return (
        customerName.includes(searchLower) ||
        orderId.includes(searchLower) ||
        status.includes(searchLower)
      );
    });
  }, [orders, searchTerm]);
  
  // Apply pagination to filtered orders
  const pageData = useMemo(() => {
    const startIndex = page * 10;
    const endIndex = startIndex + 10;
    return filteredOrders.slice(startIndex, endIndex);
  }, [page, filteredOrders]);
  
  const totalPages = Math.ceil(filteredOrders.length / 10);
  
  const nextPage = () => setPage((prev) => prev + 1);
  const prevPage = () => setPage((prev) => (prev > 0 ? prev - 1 : prev));
  const goToPage = (pageNum) => setPage(pageNum);

  const metrics = useMemo(() => {
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status?.toLowerCase() === "completed").length;
    const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.amountToPay) || 0), 0);
  
    return {
      totalOrders,
      completedOrders,
      totalRevenue
    };
  }, [orders]);
  

  // Load orders from API
  useEffect(() => {
    fetchOrders();
  }, []);

  // Handle updated order from location state
  useEffect(() => {
    if (location.state?.updatedOrder) {
      setOrders((prevOrders) => {
        const updatedOrders = prevOrders.map(order => 
          order.orderId === location.state.updatedOrder.orderId ? location.state.updatedOrder : order
        );
        return updatedOrders;
      });
      
      // Show notification for updated order
      setNotification({
        open: true,
        message: "Order updated successfully!",
        severity: "success"
      });

      // Clear location state to prevent repeating the update
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate]);

  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  // Load user data when component mounts
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (userId) {
          const response = await axios.get(`http://localhost:1337/fetchusers/${userId}`);
          setCurrentUser(response.data);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    loadUserData();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      const userRole = localStorage.getItem('userRole');
      
      const response = await axios.get("http://localhost:1337/fetchorder", {
        headers: { 'user-id': userId }
      });
      
      let ordersData = Array.isArray(response.data) ? response.data : [];
      
      // If user is a customer, filter orders for this customer only
      if (userRole === 'customer') {
        ordersData = ordersData.filter(order => order.customerId === userId);
      }
      
      setOrders(ordersData);
      setError(null);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    
    setFormErrors(prev => ({
      ...prev,
      [name]: null
    }));
    
    setFormData((prev) => {
      let updatedData = { ...prev, [name]: value };

      if (name === "laundryWeight") {
        const weight = parseFloat(value);

        if (weight >= 1 && weight <= 5) {
          updatedData.amountToPay = 150;
        } else if (weight > 5 && weight <= 8) {
          updatedData.amountToPay = 180;
        } else if (weight > 8) {
          updatedData.amountToPay = 230;
        } else {
          updatedData.amountToPay = "";
        }
      }
      return updatedData;
    });
  }

  function validateForm() {
    const errors = {};
    
    if (!formData.customerName?.trim()) {
      errors.customerName = "Customer name is required";
    }
    
    if (!formData.laundryWeight) {
      errors.laundryWeight = "Laundry weight is required";
    } else if (isNaN(formData.laundryWeight) || formData.laundryWeight <= 0) {
      errors.laundryWeight = "Enter a valid weight greater than 0";
    }
    
    if (!formData.date?.trim()) {
      errors.date = "Date is required";
    }
    
    if (!formData.serviceType?.trim()) {
      errors.serviceType = "Service type is required";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleAddOrder() {
    try {
      if (!validateForm()) {
        return;
      }

      const userId = localStorage.getItem('userId');
      if (!userId) {
        setNotification({
          open: true,
          message: "You must be logged in to create orders",
          severity: "error"
        });
        return;
      }

      const newOrder = {
        ...formData,
        status: "Processing"
      };

      setLoading(true);
      const { data } = await axios.post(
        "http://localhost:1337/addorder",
        newOrder,
        {
          headers: {
            'user-id': userId
          }
        }
      );
      
      // Update the orders state with the new order
      setOrders(prevOrders => [...prevOrders, data]);
      
      setOpenAdd(false);
      setFormData({
        orderId: "",
        customerName: "",
        laundryWeight: "",
        amountToPay: "",
        date: "",
        serviceType: "",
      });
      
      setNotification({
        open: true,
        message: "Order added successfully!",
        severity: "success"
      });
    } catch (error) {
      console.error("Error adding order:", error);
      setNotification({
        open: true,
        message: error.response?.data?.message || "Failed to add order. Please try again.",
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteOrder(order) {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
  
    try {
      setLoading(true);
      
      // Use MongoDB _id if available, otherwise use orderId
      const idToDelete = order._id || order.orderId;
      
      await axios.delete(`http://localhost:1337/deleteorder/${idToDelete}`);
      
      // Update local state after successful deletion
      setOrders(prevOrders => prevOrders.filter(o => o.orderId !== order.orderId));
      
      setNotification({
        open: true,
        message: "Order deleted successfully!",
        severity: "success"
      });
    } catch (error) {
      console.error("Error deleting order:", error);
      setNotification({
        open: true,
        message: "Failed to delete order. Please try again.",
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  const handleView = (order) => {
    navigate("/OrderStatus", { state: { order } });
  };

  function handleOpenAddModal() {
    const userName = isCustomer ? 
      `${currentUser?.firstName} ${currentUser?.lastName}`.trim() : 
      "";

    setFormData({
      orderId: "",
      customerName: userName,
      laundryWeight: "",
      amountToPay: "",
      date: "",
      serviceType: "",
    });
    setFormErrors({});
    setOpenAdd(true);
  }

  function handleCloseNotification() {
    setNotification(prev => ({ ...prev, open: false }));
  }

  // Get status class for styling
  const getStatusClass = (status) => {
    switch(status?.toLowerCase()) {
      case 'delivered':
        return 'status-delivered';
      case 'processing':
        return 'status-processing';
      case 'ready':
        return 'status-ready';
      case 'cancelled':
        return 'status-cancelled';
      case 'pending':
      default:
        return 'status-pending';
    }
  };

  // Format date to make it more readable
  const formatDate = (dateString) => {
    if (!dateString) return "";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    } catch (e) {
      return dateString;
    }
  };

  const handleCancel = async (order) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
  
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      
      const response = await axios.put(`http://localhost:1337/updateorder/${order._id}`, {
        status: "Cancelled"
      }, {
        headers: { 
          'user-id': userId
        }
      });
      
      if (response.data.order) {
        setOrders(prevOrders => prevOrders.map(o => 
          o._id === order._id ? response.data.order : o
        ));
        
        setNotification({
          open: true,
          message: "Order cancelled successfully!",
          severity: "success"
        });
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      setNotification({
        open: true,
        message: "Failed to cancel order. Please try again.",
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home">
      <Sidebar />
      <ChatBot />

      <div className="content">
        <div className="dashboard">
          <div className="dashboard-header">
            <h2>Hello, {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : (isCustomer ? 'Customer' : 'Admin')}</h2>
            <Button
              className="add-btn"
              onClick={handleOpenAddModal}
              startIcon={<AddShoppingCartIcon />}
              variant="contained"
            >
              Add Order
            </Button>
          </div>

          <div className="revenue-table">
            <h3>
              {isCustomer ? 'My Orders' : 'Orders'}
              <div className="table-controls">
                <TextField 
                  className="search-field"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon style={{ color: 'black' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </div>
            </h3>
            
            {loading && orders.length === 0 ? (
              <div className="loading-container">
                <CircularProgress />
              </div>
            ) : error ? (
              <div className="error-message">
                <p>{error}</p>
                <Button onClick={fetchOrders} variant="contained" color="primary">
                  Retry
                </Button>
              </div>
            ) : filteredOrders.length === 0 ? (
              searchTerm ? (
                <p>No orders found matching "{searchTerm}"</p>
              ) : (
                <p>No orders available.</p>
              )
            ) : (
              <>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer Name</th>
                        <th>Weight (kg)</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Service Type</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageData.map((order, index) => (
                        <tr key={order.orderId || index}>
                          <td>{order.orderId}</td>
                          <td>{order.customerName}</td>
                          <td>{order.laundryWeight} kg</td>
                          <td>₱{order.amountToPay}</td>
                          <td>{formatDate(order.date)}</td>
                          <td>{order.serviceType}</td>
                          <td>
                            <span className={`status-indicator ${getStatusClass(order.status)}`}></span>
                            {order.status}
                          </td>
                          <td className="row-actions">
                            <button
                              className="view-btn"
                              onClick={() => handleView(order)}
                            >
                              View
                            </button>
                            {isCustomer ? (
                              order.status === "Pending" && (
                                <button
                                  className="cancel-btn"
                                  onClick={() => handleCancel(order)}
                                  disabled={loading}
                                >
                                  Cancel
                                </button>
                              )
                            ) : (
                              <button
                                className="delete-btn"
                                onClick={() => handleDeleteOrder(order)}
                                disabled={loading}
                              >
                                Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="table-pagination">
                  <div className="pagination-info">
                    <span>
                      Showing {pageData.length ? page * 10 + 1 : 0}-{Math.min((page + 1) * 10, filteredOrders.length)} of {filteredOrders.length} orders
                    </span>
                  </div>
                  
                  <div className="pagination-controls">
                    <button 
                      onClick={prevPage} 
                      disabled={page === 0 || loading} 
                      className="pagination-btn nav-btn"
                      title="Previous page"
                    >
                      <NavigateBeforeIcon />
                    </button>
                    
                    <div className="page-numbers">
                      {totalPages > 0 && (
                        <>
                          {/* Show first page if we're not near the beginning */}
                          {page > 2 && totalPages > 5 && (
                            <>
                              <button
                                onClick={() => goToPage(0)}
                                className="pagination-btn"
                                disabled={loading}
                              >
                                1
                              </button>
                              {page > 3 && <span className="pagination-ellipsis">...</span>}
                            </>
                          )}
                          
                          {/* Show page numbers around current page */}
                          {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                            let pageNum = i;
                            
                            // Calculate which pages to show
                            if (totalPages > 5) {
                              if (page < 3) {
                                // Show first 5 pages
                                pageNum = i;
                              } else if (page >= totalPages - 3) {
                                // Show last 5 pages
                                pageNum = totalPages - 5 + i;
                              } else {
                                // Show current page and 2 pages on each side
                                pageNum = page - 2 + i;
                              }
                            }
                            
                            if (pageNum >= 0 && pageNum < totalPages) {
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => goToPage(pageNum)}
                                  className={`pagination-btn ${page === pageNum ? 'active' : ''}`}
                                  disabled={loading}
                                >
                                  {pageNum + 1}
                                </button>
                              );
                            }
                            return null;
                          })}
                          
                          {/* Show last page if we're not near the end */}
                          {page < totalPages - 3 && totalPages > 5 && (
                            <>
                              {page < totalPages - 4 && <span className="pagination-ellipsis">...</span>}
                              <button
                                onClick={() => goToPage(totalPages - 1)}
                                className="pagination-btn"
                                disabled={loading}
                              >
                                {totalPages}
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                    
                    <button
                      onClick={nextPage}
                      disabled={(page + 1) * 10 >= filteredOrders.length || loading}
                      className="pagination-btn nav-btn"
                      title="Next page"
                    >
                      <NavigateNextIcon />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Modal open={openAdd} onClose={() => !loading && setOpenAdd(false)}>
        <Box className="home-modal-box">
          <h2>Add Order</h2>
          <TextField
            name="orderId"
            label="Order Id"
            value={formData.orderId}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />

          <TextField
            name="customerName"
            label="Customer Name"
            value={formData.customerName}
            onChange={handleChange}
            fullWidth
            margin="normal"
            error={!!formErrors.customerName}
            helperText={formErrors.customerName}
            required
            disabled={isCustomer}
          />
          
          <TextField
            name="laundryWeight"
            label="Laundry Weight (kg)"
            type="number"
            value={formData.laundryWeight}
            onChange={handleChange}
            fullWidth
            margin="normal"
            error={!!formErrors.laundryWeight}
            helperText={formErrors.laundryWeight}
            required
            InputProps={{
              inputProps: { min: 0.1, step: 0.1 }
            }}
          />
          
          <TextField
            name="amountToPay"
            label="Amount to Pay (₱)"
            type="number"
            value={formData.amountToPay}
            fullWidth
            margin="normal"
            disabled
          />
          
          <TextField
            name="date"
            label="Date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            fullWidth
            margin="normal"
            error={!!formErrors.date}
            helperText={formErrors.date}
            required
            InputLabelProps={{
              shrink: true,
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <CalendarTodayIcon />
                </InputAdornment>
              ),
            }}
          />
          
          <FormControl fullWidth margin="normal" error={!!formErrors.serviceType} required>
            <InputLabel>Service Type</InputLabel>
            <Select
              name="serviceType"
              value={formData.serviceType || ""}
              onChange={handleChange}
            >
              <MenuItem value="Wash">Wash</MenuItem>
              <MenuItem value="Dry">Dry</MenuItem>
              <MenuItem value="Wash & Dry">Wash & Dry</MenuItem>
              <MenuItem value="Fold">Fold</MenuItem>
              <MenuItem value="Full Service">Full Service (Wash, Dry & Fold)</MenuItem>
            </Select>
            {formErrors.serviceType && (
              <div className="error-text">{formErrors.serviceType}</div>
            )}
          </FormControl>
          
          <div className="home-modal-buttons">
            <Button 
              onClick={handleAddOrder} 
              variant="contained" 
              color="primary"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : "Add Order"}
            </Button>
            <Button 
              onClick={() => setOpenAdd(false)} 
              variant="outlined"
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </Box>
      </Modal>

      <Snackbar 
        open={notification.open} 
        autoHideDuration={5000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default Home;