import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import QRCodeGenerator from "./pages/qrcode";
import ChatBot from "./pages/ChatBot";
import Home from "./pages/Home";
import Login from "./pages/Login";
import LoadingScreen from "./pages/LoadingScreen";
import { useState, useEffect } from "react";
import OrderStatus from "./pages/OrderStatus";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import Error from "./pages/Error";
import SignUp from "./pages/Signup";
import Notifications from "./pages/Notifications";
import UserManagement from "./pages/UserManagement";
import Profile from "./pages/Profile";
import Navbar from "./components/Navbar";

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 3000);
  }, []);

  return (
    <Router>
      <div className="app">
        <Navbar />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/qrcode" element={<QRCodeGenerator />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/orderstatus" element={<OrderStatus />} />
          <Route path="/orders" element={<OrderStatus />} />
          <Route path="/my-orders" element={<OrderStatus />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Dashboard />} />
          <Route path="/error" element={<Error />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/manage-users" element={<UserManagement />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
