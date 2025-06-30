import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AddIcon from "@mui/icons-material/Add";
import OrderBarChart from "./BarChart";
import Sidebar from "./Sidebar";
import "../styles/Dashboard.css";
import axios from "axios";

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch orders when the component is mounted
  useEffect(() => {
    fetchOrders();
  }, []);

  // Fetch orders from API
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://192.168.9.27:1337/fetchorder");
      const data = Array.isArray(response.data) ? response.data : [];
      console.log("Fetched orders:", data);
      setOrders(data);
      setError(null);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Load orders when component mounts
  useEffect(() => {
    fetchOrders();
  }, []);

  // Update orders when location state changes (e.g. after status update)
  useEffect(() => {
    if (location.state?.updatedOrder) {
      setOrders(prevOrders => {
        const updatedOrders = prevOrders.map(order => 
          order._id === location.state.updatedOrder._id ? location.state.updatedOrder : order
        );
        console.log("Updated orders after status change:", updatedOrders);
        return updatedOrders;
      });
      
      // Clear location state
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate]);
  
  const recentOrders = [...orders].slice(-5).reverse();

  const metricItems = [
    { title: "Total Orders", value: orders.length },
    { 
      title: "Pending Orders", 
      value: orders.filter(order => 
        order.status && 
        (order.status.toLowerCase() === "pending" || 
         order.status.toLowerCase() === "processing")
      ).length 
    },
    { 
      title: "Completed Orders", 
      value: orders.filter(order => 
        order.status && order.status.toLowerCase() === "completed"
      ).length 
    },
    { 
      title: "Active Customers", 
      value: new Set(
        orders
          .filter(order => order.customerName)
          .map(order => order.customerName)
      ).size 
    }
  ];
  
  // Function to update order status
  const changeStatus = async (orderId, newStatus) => {
    try {
      // Get the MongoDB _id from the order object
      const order = orders.find(o => o.orderId === orderId);
      if (!order || !order._id) {
        console.error('Order not found or missing _id');
        return;
      }

      const response = await axios.put(`http://192.168.100.12:1337/updateorder/${order._id}`, {
        status: newStatus
      }, {
        headers: { 
          'user-id': localStorage.getItem('userId')
        }
      });
      
      if (response.data.order) {
        // Refresh orders after status change
        fetchOrders();
      } else {
        console.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Toggle sidebar visibility
  const handleSidebarToggle = (isOpen) => {
    setSidebarOpen(isOpen);
  };

  // Debug function to check what's in the orders
  useEffect(() => {
    if (orders.length > 0) {
      console.log("Orders loaded, sample order:", orders[0]);
      console.log("Available statuses:", [...new Set(orders.map(order => order.status))]);
    }
  }, [orders]);

  return (
    <div className="app-container">
      <Sidebar onToggle={handleSidebarToggle} />
      <div className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="dashboard-container">
          <div className="top-bar">
            <div className="dashboard-title">
              Order Management Dashboard
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="metrics-grid">
            {metricItems.map((item, index) => (
              <div className="metric-card" key={index}>
                <div className="card-content">
                  <div className="metric-title">
                    {item.title}
                  </div>
                  <div className="metric-value">
                    {item.value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Overview & Recent Sales */}
          <div className="overview-grid">
            <div className="chart-card">
              <div className="card-header">
                Sales Overview
              </div>
              <div className="card-body">
                <OrderBarChart orders={orders} />
              </div>
            </div>
            
            <div className="overview-card">
              <div className="card-header">
                Recent Orders
              </div>
              <div className="card-body">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order, index) => (
                    <div key={index} className="recent-order-item">
                      <div className="order-info">
                        <div className="recent-order-name">
                          {order.customerName}
                        </div>
                        <div className={`status-badge status-${order.status?.toLowerCase()}`}>
                          {order.status}
                        </div>
                      </div>
                      {order.status === "Processing" && (
                        <button
                          className="complete-button"
                          onClick={() => changeStatus(order.orderId, "Completed")}
                        >
                          <CheckCircleIcon className="button-icon" />
                          Complete
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="no-orders-message">
                    No recent orders.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;