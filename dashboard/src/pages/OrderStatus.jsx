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
  const [isPaid, setIsPaid] = useState(order?.isPaid || false);

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
    // Prefer _id for MongoDB, fallback to orderId or id
    const orderId = order._id || order.orderId || order.id;
    setIsDownloading(true);
    try {
      const response = await axios.get(
        `http://192.168.9.27:1337/receipt/${orderId}`,
        {
          headers: { 'user-id': localStorage.getItem('userId') },
          responseType: 'blob'
        }
      );
      // Check for PDF content type
      const contentType = response.headers['content-type'];
      if (!contentType || !contentType.includes('pdf')) {
        throw new Error('Receipt not available or not a PDF.');
      }
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

  const paymentSomething = async ({ fromAccountNumber, toBusinessAccount, amount, details }) => {
    try {
      const response = await axios.post(
        'http://192.168.9.23:4000/api/Philippine-National-Bank/business-integration/customer/pay-business',
        {
          customerAccountNumber: fromAccountNumber,
          toBusinessAccount,
          amount,
          details
        }
      );

      return response.data;
    } catch (error) {
      console.error('Payment failed:', error.response?.data || error.message);
      throw error;
    }
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
                      <strong>Payment Method:</strong> {order.paymentMethod} <br />
                      <strong>Account Number:</strong> {order.paymentAccNumber} <br />
                      <strong>Account Name:</strong> {order.paymentAccName} <br />
                      <strong>Amount:</strong> ₱{order.amountToPay}
                    </span>
                  </>
                )}
              </p>
              {order.isPaid && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "6px 20px",
                    background: "#43a047",
                    color: "#fff",
                    borderRadius: "20px",
                    display: "inline-block",
                    fontWeight: "bold",
                    fontSize: "1.1em",
                    letterSpacing: "2px"
                  }}
                >
                  PAID
                </div>
              )}
            </div>
            <div className="payActions">
              {isCustomer && (
                <button
                  className="add-method"
                  style={{ marginLeft: 8 }}
                  onClick={() => setShowAddMethodModal(true)}
                  disabled={isPaid}
                >
                  Add Payment Method
                </button>
              )}
              <button className="print" onClick={printReceipt}>Print Invoice</button>
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
              <div
                className="modal-overlay"
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  width: "100vw",
                  height: "100vh",
                  background: "rgba(0,0,0,0.35)",
                  zIndex: 1000,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <div
                  className="modal"
                  style={{
                    background: "#fff",
                    borderRadius: "16px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                    padding: "2.5rem 2rem",
                    minWidth: 350,
                    maxWidth: 400,
                    width: "100%",
                    margin: "0 auto",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center"
                  }}
                >
                  <h3 style={{ marginBottom: "1.5rem" }}>Add Payment Method</h3>
                  {/* Payment method selection buttons */}
                  <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                    <button
                      style={{
                        padding: "0.5rem 1rem",
                        background: "#eee",
                        color: "#333",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "not-allowed",
                        opacity: 0.6
                      }}
                      disabled
                    >
                      BDO
                    </button>
                    <button
                      style={{
                        padding: "0.5rem 1rem",
                        background: selectedPayment === "PNB" ? "#1976d2" : "#eee",
                        color: selectedPayment === "PNB" ? "#fff" : "#333",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: "bold"
                      }}
                      onClick={() => setSelectedPayment("PNB")}
                    >
                      PNB
                    </button>
                    <button
                      style={{
                        padding: "0.5rem 1rem",
                        background: "#eee",
                        color: "#333",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "not-allowed",
                        opacity: 0.6
                      }}
                      disabled
                    >
                      GCASH
                    </button>
                  </div>
                  {/* Show payment fields only after a method is selected */}
                  {selectedPayment && (
                    <div style={{ marginBottom: "1rem", width: "100%" }}>
                      <div style={{ marginTop: "0.5rem" }}>
                        <label>
                          <strong>fromAccountNumber:</strong>
                          <input
                            type="text"
                            placeholder="Enter From Account Number"
                            style={{ marginLeft: "0.5rem", width: "70%" }}
                            value={paymentDetails.accNumber}
                            onChange={e => setPaymentDetails(prev => ({ ...prev, accNumber: e.target.value }))}
                          />
                        </label>
                      </div>
                      <div style={{ marginTop: "0.5rem" }}>
                        <label>
                          <strong>toBusinessAccount:</strong>
                          <input
                            type="text"
                            placeholder="Enter Business Account Number"
                            style={{ marginLeft: "0.5rem", width: "70%" }}
                            value={paymentDetails.toBusinessAccount || ""}
                            onChange={e => setPaymentDetails(prev => ({ ...prev, toBusinessAccount: e.target.value }))}
                          />
                        </label>
                      </div>
                      <div style={{ marginTop: "0.5rem" }}>
                        <strong>amount:</strong>
                        <span style={{ marginLeft: "0.5rem" }}>
                          ₱{Number(order.amountToPay || 0) + 5}
                        </span>
                      </div>
                      <div style={{ marginTop: "0.5rem" }}>
                        <label>
                          <strong>details:</strong>
                          <input
                            type="text"
                            placeholder="Enter Details"
                            style={{ marginLeft: "0.5rem", width: "70%" }}
                            value={paymentDetails.details || ""}
                            onChange={e => setPaymentDetails(prev => ({ ...prev, details: e.target.value }))}
                          />
                        </label>
                      </div>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
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
                    <button
                      style={{
                        marginLeft: "1rem",
                        padding: "0.5rem 1rem",
                        background: "#43a047",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer"
                      }}
                      disabled={
                        isPaid ||
                        !selectedPayment ||
                        !paymentDetails.accNumber ||
                        !paymentDetails.toBusinessAccount ||
                        !paymentDetails.details
                      }
                      onClick={async () => {
                        try {
                          // 1. Call payment API (simulate or real)
                          await paymentSomething({
                            fromAccountNumber: paymentDetails.accNumber,
                            toBusinessAccount: paymentDetails.toBusinessAccount,
                            amount: Number(order.amountToPay || 0) + 5,
                            details: paymentDetails.details
                          });

                          // 2. Update order as paid in the backend
                          await axios.put(
                            `http://192.168.9.27:1337/updateorder/${order._id}`,
                            {
                              isPaid: true,
                              paymentMethod: selectedPayment,
                              paymentAccNumber: paymentDetails.accNumber,
                              paymentAccName: paymentDetails.accName,
                              paymentAmount: Number(order.amountToPay || 0) + 5
                            },
                            {
                              headers: { 'user-id': localStorage.getItem('userId') }
                            }
                          );

                          alert("Payment successful!");
                          setIsPaid(true);
                          setOrder(prev => ({
                            ...prev,
                            isPaid: true,
                            paymentMethod: selectedPayment,
                            paymentAccNumber: paymentDetails.accNumber,
                            paymentAccName: paymentDetails.accName,
                            paymentAmount: Number(order.amountToPay || 0) + 5
                          }));
                          setShowAddMethodModal(false);
                        } catch (error) {
                          alert("Payment failed. Please try again.");
                        }
                      }}
                    >
                      Pay Now
                    </button>
                  </div>
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
