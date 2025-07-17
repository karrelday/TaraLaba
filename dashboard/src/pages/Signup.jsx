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
  const [otpVerified, setOtpVerified] = useState(false);
  const [signupOtpDigits, setSignupOtpDigits] = useState(["", "", "", "", "", ""]);
  const navigate = useNavigate();

  // Only allow letters and spaces for name fields
  function handleChange(event) {
    const { name, value } = event.target;
    if (name === 'role' || name === 'approved' || name === 'userId') return;

    // Prevent numbers in name fields
    if (["firstName", "lastName", "middleName"].includes(name)) {
      // Allow only letters and spaces
      const filtered = value.replace(/[^a-zA-Z\s]/g, "");
      setFormData(prev => ({ ...prev, [name]: filtered }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  }

  async function handleSendOtp(event) {
    event.preventDefault();
    if (!formData.email) {
      alert('Please enter your email first.');
      return;
    }
    setIsVerifyingOtp(true);
    try {
      await axios.post('http://192.168.9.27:1337/send-signup-otp', { email: formData.email });
      setOtpSent(true);
      setEmailForOtp(formData.email);
      setOtp("");
      setOtpVerified(false);
      alert('Verification code sent to your email.');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to send OTP.');
    }
    setIsVerifyingOtp(false);
  }

  function handleSignupOtpChange(e, idx) {
    const val = e.target.value.replace(/[^0-9]/g, "");
    if (!val) {
      setSignupOtpDigits(prev => {
        const arr = [...prev];
        arr[idx] = "";
        return arr;
      });
      return;
    }
    setSignupOtpDigits(prev => {
      const arr = [...prev];
      arr[idx] = val[0];
      return arr;
    });
    if (val && idx < 5) {
      const next = document.getElementById(`signup-otp-input-${idx+1}`);
      if (next) next.focus();
    }
  }
  function handleSignupOtpKeyDown(e, idx) {
    if (e.key === "Backspace" && !signupOtpDigits[idx] && idx > 0) {
      const prev = document.getElementById(`signup-otp-input-${idx-1}`);
      if (prev) prev.focus();
    }
  }
  function handleSignupOtpPaste(e) {
    const paste = e.clipboardData.getData("text").replace(/[^0-9]/g, "");
    if (paste.length === 6) {
      setSignupOtpDigits(paste.split(""));
      setTimeout(() => {
        const last = document.getElementById("signup-otp-input-5");
        if (last) last.focus();
      }, 0);
      e.preventDefault();
    }
  }

  async function handleVerifyOtp(event) {
    event.preventDefault();
    const code = signupOtpDigits.join("");
    if (!code || code.length !== 6) {
      alert('Please enter the 6 digit OTP sent to your email.');
      return;
    }
    setIsVerifyingOtp(true);
    try {
      await axios.post('http://192.168.9.27:1337/verify-signup-otp', { email: emailForOtp, code });
      // Immediately create account after OTP verification
      // Validate password length and match before creating account
      if (formData.password.length < 8) {
        alert("Password must be at least 8 characters long!");
        setIsVerifyingOtp(false);
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        alert("Passwords don't match!");
        setIsVerifyingOtp(false);
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        alert("Please enter a valid email address!");
        setIsVerifyingOtp(false);
        return;
      }
      // Check for existing username/email
      const { data: users } = await axios.get("http://192.168.9.27:1337/fetchusers");
      const usernameExists = users.some((user) => user.userName === formData.userName);
      const emailExists = users.some((user) => user.email === formData.email);
      if (usernameExists) {
        alert("Username already exists!");
        setIsVerifyingOtp(false);
        return;
      }
      if (emailExists) {
        alert("Email already registered!");
        setIsVerifyingOtp(false);
        return;
      }
      // Generate a unique userId
      const generatedUserId = uuidv4();
      const dataToSend = { ...formData };
      delete dataToSend.confirmPassword;
      dataToSend.role = 'customer';
      dataToSend.userId = generatedUserId;
      dataToSend.approved = false;
      await axios.post("http://192.168.9.27:1337/addusers", dataToSend);
      alert("Account created successfully! You can now log in.");
      navigate('/login');
    } catch (error) {
      alert(error.response?.data?.message || 'OTP verification failed or account creation error.');
    }
    setIsVerifyingOtp(false);
  }

  async function handleSignUp(event) {
    event.preventDefault();
    if (!otpVerified) {
      alert('Please verify the OTP sent to your email before signing up.');
      return;
    }

    if (formData.password.length < 8) {
      alert("Password must be at least 8 characters long!");
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
      const { data: users } = await axios.get("http://192.168.9.27:1337/fetchusers");
      const usernameExists = users.some((user) => user.userName === formData.userName);
      // Only check for duplicate Gmail addresses
      const emailIsGmail = formData.email.trim().toLowerCase().endsWith("@gmail.com");
      const emailExists = emailIsGmail && users.some((user) => user.email.trim().toLowerCase() === formData.email.trim().toLowerCase());

      if (usernameExists) {
        alert("Username already exists!");
        return;
      }

      if (emailExists) {
        alert("This email address is already registered!");
        return;
      }

      // Generate a unique userId (you can use uuid or your own logic)
      const generatedUserId = uuidv4();

      const dataToSend = { ...formData };
      delete dataToSend.confirmPassword;
      dataToSend.role = 'customer';
      dataToSend.userId = generatedUserId;
      dataToSend.approved = false; // Mark as not approved

      await axios.post("http://192.168.9.27:1337/addusers", dataToSend);
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

  // Password validation requirements
  const passwordRequirements = [
    {
      label: "At least 8 characters",
      test: (pw) => pw.length >= 8
    },
    {
      label: "Contains uppercase letter",
      test: (pw) => /[A-Z]/.test(pw)
    },
    {
      label: "Contains lowercase letter",
      test: (pw) => /[a-z]/.test(pw)
    },
    {
      label: "Contains a number",
      test: (pw) => /[0-9]/.test(pw)
    },
    {
      label: "Contains a special character",
      test: (pw) => /[^A-Za-z0-9]/.test(pw)
    }
  ];

  // Resend OTP handler
  async function handleResendOtp(event) {
    event.preventDefault();
    if (!formData.email) {
      alert('Please enter your email first.');
      return;
    }
    setIsVerifyingOtp(true);
    try {
      await axios.post('http://192.168.9.27:1337/send-signup-otp', { email: formData.email });
      setOtpSent(true);
      setEmailForOtp(formData.email);
      setOtp("");
      setOtpVerified(false);
      alert('Verification code resent to your email.');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to resend OTP.');
    }
    setIsVerifyingOtp(false);
  }

  return (
    <div className='signupbody'>
      <div className='signup'>
        <div className='signup-box'>
          <h3 className='signUpName'>TaraLaba</h3>
          <h2 className='createAccount'>Create Account</h2>  
          {/* Step 1: Email/OTP */}
          {!otpVerified && (
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
                {/* Password validation modal */}
                {formData.password && (
                  <div style={{
                    position: 'absolute',
                    left: '105%',
                    top: 0,
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    padding: '16px',
                    minWidth: '220px',
                    zIndex: 10
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: 8, color: '#64748b' }}>Password must have:</div>
                    {passwordRequirements.map((req, idx) => (
                      <div key={idx} style={{ color: req.test(formData.password) ? 'green' : '#64748b', fontWeight: req.test(formData.password) ? 600 : 400, marginBottom: 4 }}>
                        {req.label}
                      </div>
                    ))}
                  </div>
                )}
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
                  <div className="otp-desc">Enter the 6 digit OTP sent to your email.</div>
                  <div className="otp-inputs" onPaste={handleSignupOtpPaste}>
                    {[0,1,2,3,4,5].map(idx => (
                      <input
                        key={idx}
                        id={`signup-otp-input-${idx}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        className="otp-box"
                        value={signupOtpDigits[idx]}
                        onChange={e => handleSignupOtpChange(e, idx)}
                        onKeyDown={e => handleSignupOtpKeyDown(e, idx)}
                        autoFocus={idx === 0}
                      />
                    ))}
                  </div>
                  <Button className="create" variant="contained" type="submit" startIcon={<PersonAddIcon />} fullWidth disabled={isVerifyingOtp}>
                    Verify OTP
                  </Button>
                  <Button className="create" variant="outlined" onClick={handleResendOtp} fullWidth disabled={isVerifyingOtp} style={{ marginTop: 8 }}>
                    Resend OTP
                  </Button>
                </>
              )}
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