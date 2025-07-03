import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, IconButton, TextField, InputAdornment } from '@mui/material';
import axios from 'axios';
import '../styles/SignUp.css';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { v4 as uuidv4 } from 'uuid';

function SignUp() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    userName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'customer',
    approved: false  
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [emailForOtp, setEmailForOtp] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const navigate = useNavigate();

  function handleChange(event) {
    const { name, value } = event.target;
    // Prevent role and approved from being changed by user
    if (name === 'role' || name === 'approved' || name === 'userId') return;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleSendOtp(event) {
    event.preventDefault();
    if (!formData.email) {
      alert('Please enter your email first.');
      return;
    }
    setIsVerifyingOtp(true);
    try {
      await axios.post('http://localhost:1337/send-signup-otp', { email: formData.email });
      setOtpSent(true);
      setEmailForOtp(formData.email);
      alert('Verification code sent to your email.');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to send OTP.');
    }
    setIsVerifyingOtp(false);
  }

  async function handleVerifyOtp(event) {
    event.preventDefault();
    if (!otp) {
      alert('Please enter the OTP sent to your email.');
      return;
    }
    setIsVerifyingOtp(true);
    try {
      await axios.post('http://localhost:1337/verify-signup-otp', { email: emailForOtp, code: otp });
      alert('OTP verified! You can now complete your registration.');
      setOtpSent(false); // Allow registration
    } catch (error) {
      alert(error.response?.data?.message || 'OTP verification failed.');
    }
    setIsVerifyingOtp(false);
  }

  async function handleSignUp(event) {
    event.preventDefault();
    if (otpSent) {
      alert('Please verify the OTP sent to your email before signing up.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert("Please enter a valid email address!");
      return;
    }

    try {
      const { data: users } = await axios.get("http://localhost:1337/fetchusers");
      const usernameExists = users.some((user) => user.userName === formData.userName);
      const emailExists = users.some((user) => user.email === formData.email);

      if (usernameExists) {
        alert("Username already exists!");
        return;
      }

      if (emailExists) {
        alert("Email already registered!");
        return;
      }

      // Generate a unique userId (you can use uuid or your own logic)
      const generatedUserId = uuidv4();

      const dataToSend = { ...formData };
      delete dataToSend.confirmPassword;
      dataToSend.role = 'customer';
      dataToSend.userId = generatedUserId;
      dataToSend.approved = false; // Mark as not approved

      await axios.post("http://localhost:1337/addusers", dataToSend);
      alert("Account created successfully! You can now log in.");
      navigate('/login');
    } catch (error) {
      console.error("Registration error:", error);
      alert("Error creating account. Please try again.");
    }
  }

  function navigateToLogin() {
    navigate('/login');
  }

  return (
    <div className='signupbody'>
      <div className='signup'>
        <div className='signup-box'>
          <h3 className='signUpName'>TaraLaba</h3>
          <h2 className='createAccount'>Create Account</h2>  
          <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className='form'>
            <div className="name-fields">
              <TextField
                type="text"
                name="firstName"
                label="First Name"
                value={formData.firstName}
                onChange={handleChange}
                required
                fullWidth
                className="signupField"
              />
              <TextField
                type="text"
                name="lastName"
                label="Last Name"
                value={formData.lastName}
                onChange={handleChange}
                required
                fullWidth
                className="signupField"
              />
            </div>
            <TextField
              type="text"
              name="middleName"
              label="Middle Name"
              value={formData.middleName}
              onChange={handleChange}
              fullWidth
              className="signupField"
            />
            <TextField
              type="text"
              name="userName"
              label="Username"
              value={formData.userName}
              onChange={handleChange}
              required
              fullWidth
              className="signupField"
            />
            <TextField
              type="email"
              name="email"
              label="Email"
              value={formData.email}
              onChange={handleChange}
              required
              fullWidth
              className="signupField"
            />
            <div className="password-container">
              <TextField
                type={showPassword ? "text" : "password"}
                name="password"
                label="Password"
                value={formData.password}
                onChange={handleChange}
                required
                fullWidth
                className="signupField"
              />
              <IconButton className='eyeIcon' onClick={() => setShowPassword(prev => !prev)}>
                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </div>
            <div className="password-container">
              <TextField
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                label="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                fullWidth
                className="signupField"
              />
              <IconButton className='eyeIcon' onClick={() => setShowConfirmPassword(prev => !prev)}>
                {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </div>
            {!otpSent && (
              <Button className="create" variant="contained" type="submit" startIcon={<PersonAddIcon />} fullWidth disabled={isVerifyingOtp}>
                Send OTP
              </Button>
            )}
            {otpSent && (
              <>
                <TextField
                  type="text"
                  name="otp"
                  label="Enter OTP"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  required
                  fullWidth
                  className="signupField"
                  style={{ marginTop: 16 }}
                />
                <Button className="create" variant="contained" type="submit" startIcon={<PersonAddIcon />} fullWidth disabled={isVerifyingOtp}>
                  Verify OTP
                </Button>
              </>
            )}
          </form>
          {/* Only show registration button after OTP is verified */}
          {!otpSent && (
            <form onSubmit={handleSignUp}>
              <Button className="create" variant="contained" type="submit" startIcon={<PersonAddIcon />} fullWidth>
                Create Account
              </Button>
            </form>
          )}
          <div className="login-link">
            Already have an account? <a href='' onClick={navigateToLogin}>Sign in</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUp;