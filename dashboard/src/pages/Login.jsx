import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";
import { TextField, IconButton, InputAdornment, Snackbar, Alert } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

function Login() {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);
  const navigate = useNavigate();

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
     const response = await fetch("http://192.168.100.12:1337/login", {
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
              <div className="forgot-password">
                <a href="#">
                  <u>Forgot Password?</u>
                </a>
              </div>
            </div>
          </form>
        </div>
      </div>

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
