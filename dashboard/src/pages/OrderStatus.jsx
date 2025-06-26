import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import ChatBot from "./ChatBot";
import "../styles/OrderStatus.css";
import axios from "axios";
import { CircularProgress } from '@mui/material';

const paymentMethods = ["PNB", "BDO", "GCash"];

function OrderStatus() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDownloading, setIsDownloading] = useState(false);

  const [order, setOrder] = useState(() => {
    return (
      location.state?.order ||
      JSON.parse(localStorage.getItem("selectedOrder")) ||
      null
    );
  });

  const [status, setStatus] = useState(order?.status || "Pending");
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole'));
  const [isCustomer, setIsCustomer] = useState(localStorage.getItem('userRole') === 'customer');

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(order?.paymentMethod || "");
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    accNumber: "",
    accName: "",
    amount: order?.amountToPay || ""
  });

  // Add payment method modal state
  const [showAddMethodModal, setShowAddMethodModal] = useState(false);

  useEffect(() => {
    if (!order) {
      console.warn("No order selected.");
    }
  }, [order]);

  useEffect(() => {
    const fetchOrders = async () => {
      const userId = localStorage.getItem('userId');
      const response = await axios.get(`http://192.168.9.27:1337/orders/user/${userId}`, {
        headers: { 'user-id': userId }
      });
      setOrders(response.data);
    };
    fetchOrders();
  }, []);

  if (!order) {
    return <h2 className="no-order">No Order Selected</h2>;
  }

  const handleSave = async () => {
    if (!order._id) {
      alert("Error: Order ID is missing");
      return;
    }
    try {
      const userId = localStorage.getItem('userId');
      const response = await axios.put(`http://192.168.9.27:1337/updateorder/${order._id}`, {
        status: status
      }, {
        headers: { 
          'user-id': userId
        }
      });
      if (response.data.notification) {
        navigate("/notifications", { 
          state: { 
            refreshNotifications: true
          } 
        });
      } else {
        navigate("/home", { 
          state: { 
            updatedOrder: response.data.order
          } 
        });
      }
    } catch (error) {
      const serverMessage = error.response?.data?.message || error.message || "Unknown error";
      alert("Failed to update order. Reason: " + serverMessage);
    }
  };
  
  const printReceipt = () => {
    const style = document.createElement('style');
    document.head.appendChild(style);
    window.print();
    setTimeout(() => {
      document.head.removeChild(style);
    }, 1000);
  };

  const downloadReceipt = async () => {
    const orderId = order.orderId || order.id;
    setIsDownloading(true);
    try {
      const response = await axios.get(`http://192.168.9.27:1337/receipt/${orderId}`, {
        headers: { 'user-id': localStorage.getItem('userId') },
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("Failed to download receipt. Please try again later.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      const userId = localStorage.getItem('userId');
      const response = await axios.put(`http://192.168.9.27:1337/updateorder/${order._id}`, {
        status: "Cancelled"
      }, {
        headers: { 
          'user-id': userId
        }
      });
      if (response.data.notification) {
        navigate("/notifications", { 
          state: { 
            refreshNotifications: true
          } 
        });
      } else {
        navigate("/home", { 
          state: { 
            updatedOrder: response.data.order
          } 
        });
      }
    } catch (error) {
      alert("Failed to cancel order. Please try again.");
    }
  };

  // Payment modal handlers
  const handleSelectPayment = (method) => {
    setSelectedPayment(method);
    setPaymentDetails({
      accNumber: "",
      accName: "",
      amount: order?.amountToPay || ""
    });
    setShowPaymentDetails(true);
  };

  const handlePaymentInput = (e) => {
    const { name, value } = e.target;
    setPaymentDetails((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePaymentOk = () => {
    if (!paymentDetails.accNumber || !paymentDetails.accName) {
      alert("Please enter both Account Number and Account Name.");
      return;
    }
    setOrder(prev => ({
      ...prev,
      paymentMethod: selectedPayment,
      paymentAccNumber: paymentDetails.accNumber,
      paymentAccName: paymentDetails.accName,
      paymentAmount: paymentDetails.amount
    }));
    setShowPaymentModal(false);
    setShowPaymentDetails(false);
  };

  const handlePaymentCancel = () => {
    setShowPaymentDetails(false);
    setShowPaymentModal(false);
  };

  return (
    <div className="orderPage">
      <Sidebar />
      <div className="orderContainer">
        <div className="header">
          <h2>Order Details</h2>
          <p>
            <a href="/home">Dashboard</a> / <span>Orders</span> / Order Details
          </p>
        </div>

        <div className="info">
          <div className="left">
            <div>
              <h3>TaraLaba</h3>
              <p>
                Mabini St, Bayombong.
                <br />
                Nueva Vizcaya - 3700
                <br />
                Bayombong, Nueva Vizcaya
              </p>
              <p>
                TaraLaba2025@gmail.com
                <br />
                (+63) 987-654-3210
              </p>
            </div>
            <div>
              <h3>#ORD-{(order?.id || order?.orderId)?.toString().padStart(4, "0")}</h3>
              <p>
                <strong>Invoice To:</strong> {order.customerName} <br />
                <strong>Amount to Pay:</strong> ₱{order.amountToPay}
              </p>
            </div>
          </div>

          <div className="right">
            <div className="addons">
              <h4>Add-ons</h4>
              <p>Delivery: ₱5</p>
            </div>
            <div className="payment">
              <h4>Payments</h4>
              <p>₱{order.amountToPay}</p>
              <p>
                {order.date} [{order.paymentMethod || "cash"}]
                {order.paymentMethod && (
                  <>
                    <br />
                    <span>
                      Acc#: {order.paymentAccNumber} <br />
                      Name: {order.paymentAccName} <br />
                      Amount: ₱{order.paymentAmount}
                    </span>
                  </>
                )}
              </p>
            </div>
            <div className="payActions">
              <button className="add" onClick={() => setShowPaymentModal(true)}>
                Add Payment
              </button>
              <button
                className="add-method"
                style={{ marginLeft: 8 }}
                onClick={() => setShowAddMethodModal(true)}
              >
                Add Payment Method
              </button>
              <button className="print" onClick={printReceipt}>Print Invoice</button>
              <button 
                className="download" 
                onClick={downloadReceipt}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  'Download Receipt'
                )}
              </button>
              {isCustomer ? (
                order.status === "Pending" && (
                  <button className="cancel" onClick={handleCancel}>
                    Cancel Order
                  </button>
                )
              ) : (
                <button className="save" onClick={handleSave}>
                  Save Changes
                </button>
              )}
            </div>
            {/* Payment Modal */}
            {showPaymentModal && (
              <div className="modal-overlay">
                <div className="modal">
                  {!showPaymentDetails ? (
                    <>
                      <h3>Select Payment Method</h3>
                      {paymentMethods.map((method) => (
                        <button
                          key={method}
                          onClick={() => handleSelectPayment(method)}
                          className="payment-method-btn"
                          style={{
                            margin: "0.5rem",
                            padding: "0.5rem 1rem",
                            background: selectedPayment === method ? "#1976d2" : "#eee",
                            color: selectedPayment === method ? "#fff" : "#333",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer"
                          }}
                        >
                          {method}
                        </button>
                      ))}
                      <div>
                        <button
                          onClick={() => setShowPaymentModal(false)}
                          style={{
                            marginTop: "1rem",
                            padding: "0.5rem 1rem",
                            background: "#ccc",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer"
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3>{selectedPayment} Payment Details</h3>
                      <div style={{ marginBottom: "1rem" }}>
                        <div>
                          <label>
                            <strong>Account Number:</strong>
                            <input
                              type="text"
                              name="accNumber"
                              value={paymentDetails.accNumber}
                              onChange={handlePaymentInput}
                              placeholder="Enter Account Number"
                              style={{ marginLeft: "0.5rem" }}
                            />
                          </label>
                        </div>
                        <div style={{ marginTop: "0.5rem" }}>
                          <label>
                            <strong>Account Name:</strong>
                            <input
                              type="text"
                              name="accName"
                              value={paymentDetails.accName}
                              onChange={handlePaymentInput}
                              placeholder="Enter Account Name"
                              style={{ marginLeft: "0.5rem" }}
                            />
                          </label>
                        </div>
                        <div style={{ marginTop: "0.5rem" }}>
                          <strong>Amount to Pay:</strong> ₱{paymentDetails.amount}
                        </div>
                      </div>
                      <button
                        onClick={handlePaymentOk}
                        style={{
                          marginRight: "1rem",
                          padding: "0.5rem 1rem",
                          background: "#1976d2",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer"
                        }}
                      >
                        OK
                      </button>
                      <button
                        onClick={handlePaymentCancel}
                        style={{
                          padding: "0.5rem 1rem",
                          background: "#ccc",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer"
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
            {/* Add Payment Method Modal */}
            {showAddMethodModal && (
              <div className="modal-overlay">
                <div className="modal">
                  <h3>Add Payment Method</h3>
                  <div style={{ marginBottom: "1rem" }}>
                    <label>
                      <strong>Payment Method Name:</strong>
                      <input
                        type="text"
                        placeholder="e.g. GCash, BDO, PNB"
                        style={{ marginLeft: "0.5rem" }}
                      />
                    </label>
                    <div style={{ marginTop: "0.5rem" }}>
                      <label>
                        <strong>Account Number:</strong>
                        <input
                          type="text"
                          placeholder="Enter Account Number"
                          style={{ marginLeft: "0.5rem" }}
                        />
                      </label>
                    </div>
                    <div style={{ marginTop: "0.5rem" }}>
                      <label>
                        <strong>Account Name:</strong>
                        <input
                          type="text"
                          placeholder="Enter Account Name"
                          style={{ marginLeft: "0.5rem" }}
                        />
                      </label>
                    </div>
                  </div>
                  <button
                    style={{
                      marginRight: "1rem",
                      padding: "0.5rem 1rem",
                      background: "#1976d2",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                    onClick={() => setShowAddMethodModal(false)}
                  >
                    Save
                  </button>
                  <button
                    style={{
                      padding: "0.5rem 1rem",
                      background: "#ccc",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                    onClick={() => setShowAddMethodModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="orderInfo">
          <p>
            <strong>Order Date:</strong> {order.date}
          </p>
          <p>
            <strong>Delivery Date:</strong> {order.date}
          </p>
          <div className="status">
            <label>Status:</label>
            {isCustomer ? (
              <div className="status-text">{status}</div>
            ) : (
              <select
                className="statusDropdown"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Ready">Ready</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            )}
          </div>
        </div>

        <div className="tableContainer">
          <table className="orderTable">
            <thead>
              <tr>
                <th>#</th>
                <th>Service Name</th>
                <th>Weight (kg)</th>
                <th>Amount ($)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{order.orderId}</td>
                <td>{order.serviceType}</td>
                <td>{order.laundryWeight} kg</td>
                <td>${order.amountToPay}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <ChatBot />
    </div>
  );
}
export default OrderStatus;
