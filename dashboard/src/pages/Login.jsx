import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";
import { TextField, IconButton, InputAdornment, Snackbar, Alert, Button } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

function Login() {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);
  const navigate = useNavigate();

  // Forgot password states
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function navigateToSignup() {
    navigate("/signup");
  }

  async function handleLogin(event) {
    event.preventDefault();
    try {
     const response = await fetch("http://192.168.100.147:1337/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userName: formData.username,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Login successful:", data);
        
        // Store user data in localStorage
        localStorage.setItem("userId", data.user._id);
        localStorage.setItem("userRole", data.user.role);
        localStorage.setItem("userName", data.user.userName);
        localStorage.setItem("userPermissions", JSON.stringify(data.user.permissions));

        // Role-based redirection
        switch (data.user.role) {
          case 'admin':
            navigate("/reports"); // Admin sees the reports page first
            break;
          case 'staff':
            navigate("/home"); // Staff sees the main orders page
            break;
          case 'customer':
            navigate("/home"); // Customers see the main home page
            break;
          default:
            navigate("/home");
        }
      } else {
        setError(data.message || "Login failed");
        setShowError(true);
      }
    } catch (error) {
      setError("An error occurred during login");
      setShowError(true);
      console.error("Login error:", error);
    }
  }

  // Forgot password handlers
  async function handleForgotPassword(e) {
    e.preventDefault();
    setForgotMsg("");
    try {
      const res = await fetch("http://192.168.100.147:1337/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setForgotStep(2);
        setForgotMsg("A reset code has been sent to your email.");
      } else {
        setForgotMsg(data.message || "Error sending reset code.");
      }
    } catch {
      setForgotMsg("Network error.");
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setForgotMsg("");
    try {
      const res = await fetch("http://192.168.100.147:1337/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, code: resetCode, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setForgotMsg("Password updated! You can now log in.");
        setTimeout(() => {
          setShowForgot(false);
          setForgotStep(1);
          setForgotEmail("");
          setResetCode("");
          setNewPassword("");
          setForgotMsg("");
        }, 2000);
      } else {
        setForgotMsg(data.message || "Error resetting password.");
      }
    } catch {
      setForgotMsg("Network error.");
    }
  }

  const handleCloseError = () => {
    setShowError(false);
  };

  return (
    <div className="login-container">
      {/* Left side with illustration */}
      <div className="loginBg">
        <div className="image-content">
          <div className="pic">
            <img src="./src/pictures/LogIn.png" alt="Laundry illustration" />
          </div>
          <div className="feature-highlight">
            <span className="star-icon">★</span> FEATURE HIGHLIGHT
            <p className="feature-text">
              Monitor, Manage, and Master Your Laundry Operations right in your
              TaraLaba account!
            </p>
          </div>
        </div>
      </div>

      {/* Right side with login form */}
      <div className="login-side">
        <div className="login-content">
          <h1 className="app-name">TaraLaba</h1>

          <div className="tagline">
            <h2>Laundry Made Simple.</h2>
            <h2>
              Tracking Made <br /> Smarter.
            </h2>
          </div>

          <p className="welcome-message">
            Welcome back! Please enter your credentials to sign in.
          </p>

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <TextField
                type="text"
                variant="standard"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <TextField
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                variant="standard"
                value={formData.password}
                onChange={handleChange}
                required
                className="form-input"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </div>

            <button className="login-button" type="submit">
              Login
            </button>
            <div className="form-footer">
              <div className="signup-link">
                <span>New to TaraLaba?</span>
                <a href="#" onClick={navigateToSignup}>
                  {" "}
                  <u>Sign Up</u>
                </a>
              </div>
              <div className="forgot-password-link" style={{ marginTop: 8 }}>
                <a
                  href="#"
                  onClick={e => { e.preventDefault(); setShowForgot(true); }}
                  style={{ color: "#1976d2", textDecoration: "underline", cursor: "pointer" }}
                >
                  Forgot Password?
                </a>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="modal-overlay">
          <div className="modal forgot-modal">
            <button className="close-modal-btn" onClick={() => setShowForgot(false)}>✕</button>
            {forgotStep === 1 ? (
              <form onSubmit={handleForgotPassword} className="forgot-form">
                <h3 className="forgot-title">Forgot Password</h3>
                <TextField
                  type="email"
                  placeholder="Enter your email"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  required
                  fullWidth
                  className="forgot-input"
                  InputProps={{ style: { background: 'rgba(22,28,36,0.95)', color: '#fff', borderRadius: 6 } }}
                  InputLabelProps={{ style: { color: '#fff' } }}
                />
                <Button className="forgot-btn" variant="contained" type="submit" fullWidth>
                  Send Reset Code
                </Button>
                {forgotMsg && <div className={forgotMsg.includes('sent') ? 'forgot-success' : 'forgot-error'}>{forgotMsg}</div>}
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="forgot-form">
                <h3 className="forgot-title">Reset Password</h3>
                <TextField
                  type="text"
                  placeholder="Enter reset code"
                  value={resetCode}
                  onChange={e => setResetCode(e.target.value)}
                  required
                  fullWidth
                  className="forgot-input"
                  InputProps={{ style: { background: 'rgba(22,28,36,0.95)', color: '#fff', borderRadius: 6 } }}
                  InputLabelProps={{ style: { color: '#fff' } }}
                />
                <TextField
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  fullWidth
                  className="forgot-input"
                  InputProps={{ style: { background: 'rgba(22,28,36,0.95)', color: '#fff', borderRadius: 6 } }}
                  InputLabelProps={{ style: { color: '#fff' } }}
                />
                <Button className="forgot-btn" variant="contained" type="submit" fullWidth>
                  Update Password
                </Button>
                {forgotMsg && <div className={forgotMsg.includes('updated') ? 'forgot-success' : 'forgot-error'}>{forgotMsg}</div>}
              </form>
            )}
          </div>
        </div>
      )}

      <Snackbar 
        open={showError} 
        autoHideDuration={6000} 
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default Login;
