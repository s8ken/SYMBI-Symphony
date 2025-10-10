import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Link as MuiLink,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  useTheme,
  Avatar
} from '@mui/material';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import A11yTextField from '../components/forms/A11yTextField';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LoginIcon from '@mui/icons-material/Login';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

const Login = () => {
  const theme = useTheme();
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const { login, isAuthenticated, loading, error } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    const nextErrors = {};
    if (!formData.email) nextErrors.email = 'Email is required';
    if (!formData.password) nextErrors.password = 'Password is required';
    
    setErrors(nextErrors);
    
    // If validation errors, don't submit
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    
    console.log('Form submitted with:', formData);
    try {
      const result = await login(formData.email, formData.password);
      console.log('Login result:', result);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  // Focus first invalid field when errors change
  useEffect(() => {
    if (errors.email && emailRef.current) {
      emailRef.current.focus();
    } else if (errors.password && passwordRef.current) {
      passwordRef.current.focus();
    }
  }, [errors]);

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <Box 
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
        p: 2
      }}
    >
      
      <Paper 
        elevation={3} 
        sx={{
          p: 5,
          maxWidth: 450,
          width: '100%',
          borderRadius: 3,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.shadows[3]
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Avatar
            sx={{
              mx: 'auto',
              mb: 2,
              bgcolor: 'primary.main',
              width: 56,
              height: 56,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          >
            <LockOutlinedIcon sx={{ fontSize: 28 }} />
          </Avatar>
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1
            }}
          >
            YCQ Sonate
          </Typography>
          <Typography 
            variant="subtitle1" 
            color="text.secondary"
            sx={{ fontWeight: 500 }}
          >
            Welcome back! Please sign in to continue
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <A11yTextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={formData.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email}
            inputRef={emailRef}
            variant="outlined"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: theme.palette.background.default,
                '&:hover': {
                  borderColor: theme.palette.primary.main
                },
                '&.Mui-focused': {
                  backgroundColor: theme.palette.background.paper
                }
              }
            }}
          />
          <A11yTextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            error={!!errors.password}
            helperText={errors.password}
            inputRef={passwordRef}
            variant="outlined"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={toggleShowPassword}
                    edge="end"
                    sx={{
                      color: 'text.secondary',
                      '&:hover': {
                        color: 'primary.main'
                      }
                    }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: theme.palette.background.default,
                '&:hover': {
                  borderColor: theme.palette.primary.main
                },
                '&.Mui-focused': {
                  backgroundColor: theme.palette.background.paper
                }
              }
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            data-testid="login-submit"
            sx={{ 
              mt: 4, 
              mb: 3,
              py: 1.5,
              borderRadius: 2,
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              fontSize: '1.1rem',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: theme.palette.primary.dark
              },
              '&:disabled': {
                backgroundColor: theme.palette.action.disabled
              }
            }}
            disabled={loading}
            startIcon={!loading && <LoginIcon />}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
          </Button>
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Don't have an account?
            </Typography>
            <MuiLink 
              component={Link} 
              to="/register" 
              variant="body2"
              sx={{
                fontWeight: 600,
                textDecoration: 'none',
                color: theme.palette.primary.main,
                '&:hover': {
                  textDecoration: 'underline',
                  color: theme.palette.primary.dark
                }
              }}
            >
              Create Account
            </MuiLink>
           </Box>
         </Box>
        </Paper>
    </Box>
  );
};

export default Login;