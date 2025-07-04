import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Container, Button, Typography, Paper, InputAdornment, IconButton, FormControl, OutlinedInput, Alert } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';

const validationSchema = Yup.object({
  username: Yup.string().required('יש להזין שם משתמש'),
  password: Yup.string().required('יש להזין סיסמה'),
});

const logoOptions = [
  {
    id: 1,
    style: {
      fontWeight: 300,
      letterSpacing: '0.05em',
      color: '#1d1d1f',
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Assistant', sans-serif",
      borderBottom: '1px solid rgba(0,0,0,0.06)',
      paddingBottom: '12px',
      textTransform: 'uppercase'
    }
  },
  {
    id: 2,
    style: {
      fontWeight: 500,
      letterSpacing: '0.08em',
      color: '#0071e3',
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Assistant', sans-serif",
      textTransform: 'uppercase'
    }
  },
  {
    id: 3,
    style: {
      fontWeight: 200,
      letterSpacing: '0.12em',
      color: '#333',
      background: 'linear-gradient(45deg, #1e3c72 10%, #2a5298 90%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Assistant', sans-serif",
      textTransform: 'uppercase'
    }
  },
  {
    id: 4,
    style: {
      fontWeight: 400,
      letterSpacing: '0.02em',
      background: 'linear-gradient(45deg, #475569 0%, #64748B 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Assistant', sans-serif"
    }
  },
  {
    id: 5,
    style: {
      fontWeight: 200,
      letterSpacing: '0.2em',
      color: '#111',
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Assistant', sans-serif"
    }
  },
  {
    id: 6,
    style: {
      fontWeight: 500,
      letterSpacing: '0.05em',
      background: 'linear-gradient(45deg, #000000 30%, #434343 90%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Assistant', sans-serif"
    }
  }
];

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState(null);
  const [showOptions, setShowOptions] = useState(true);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    console.log('Login: Checking if user is already authenticated:', isAuthenticated);
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      console.log('Login: User is already authenticated, redirecting to:', from);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const formik = useFormik({
    initialValues: {
      username: 'hezi',
      password: 'hezi3225',
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      setLoginError('');
      console.log('Login: Submitting form with values:', { ...values, password: '*****' });
      
      try {
        console.log('Login: Calling login function');
        const result = await login(values);
        console.log('Login: Received result from login:', result);
        
        if (result.success) {
          console.log('Login: Login successful');
          toast.success('התחברת בהצלחה!');
          
          const from = location.state?.from?.pathname || '/dashboard';
          console.log('Login: Navigating to:', from);
          navigate(from, { replace: true });
        } else {
          console.error('Login: Login failed', result.error);
          setLoginError(result.error || 'התחברות נכשלה');
          toast.error(result.error || 'התחברות נכשלה');
        }
      } catch (error) {
        console.error('Login: Unexpected error during login:', error);
        setLoginError('אירעה שגיאה לא צפויה בהתחברות');
        toast.error('אירעה שגיאה לא צפויה');
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleLogoSelect = (logoId) => {
    setSelectedLogo(logoId);
    setShowOptions(false);
  };

  return (
    <Container 
      maxWidth={false}
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'white',
        padding: 0,
      }}
    >
      <Typography 
        component="h1" 
        variant="h3" 
        sx={{ 
          fontWeight: 400, 
          mb: 8,
          letterSpacing: '0.15em', 
          color: '#294277',
          fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Assistant', sans-serif",
        }}
      >
        DIAM
      </Typography>
      
      <Paper 
        elevation={0} 
        sx={{ 
          width: '100%', 
          maxWidth: 360,
          p: { xs: 3, sm: 3.5 }, 
          borderRadius: 3,
          bgcolor: 'white',
          boxShadow: '0 2px 20px rgba(0, 0, 0, 0.04)'
        }}
      >
        {loginError && (
          <Alert 
            severity="error" 
            sx={{ mb: 2, fontSize: '0.875rem' }}
          >
            {loginError}
          </Alert>
        )}
        
        <form onSubmit={formik.handleSubmit}>
          <FormControl fullWidth variant="outlined" sx={{ mb: 2, position: 'relative' }}>
            <Box 
              component="label" 
              htmlFor="username" 
              sx={{
                position: 'absolute',
                top: -9,
                right: 10,
                backgroundColor: 'white',
                padding: '0 5px',
                fontSize: '12px',
                color: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1,
                pointerEvents: 'none'
              }}
            >
              שם משתמש
            </Box>
            <OutlinedInput
              id="username"
              name="username"
              value={formik.values.username}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.username && Boolean(formik.errors.username)}
              sx={{ 
                borderRadius: 25, 
                '& input': { 
                  textAlign: 'right',
                  direction: 'ltr',
                  padding: '12px 16px',
                  fontSize: '14px'
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(0, 0, 0, 0.1)'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(0, 0, 0, 0.2)'
                }
              }}
            />
          </FormControl>
          
          <FormControl fullWidth variant="outlined" sx={{ mb: 3.5, position: 'relative' }}>
            <Box 
              component="label" 
              htmlFor="password" 
              sx={{
                position: 'absolute',
                top: -9,
                right: 10,
                backgroundColor: 'white',
                padding: '0 5px',
                fontSize: '12px',
                color: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1,
                pointerEvents: 'none'
              }}
            >
              סיסמה
            </Box>
            <OutlinedInput
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    aria-label="הצג/הסתר סיסמה"
                    onClick={handleClickShowPassword}
                    edge="end"
                    sx={{ color: 'rgba(0, 0, 0, 0.54)' }}
                  >
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              }
              sx={{ 
                borderRadius: 25, 
                '& input': { 
                  textAlign: 'right',
                  direction: 'ltr',
                  padding: '12px 16px',
                  fontSize: '14px'
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(0, 0, 0, 0.1)'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(0, 0, 0, 0.2)'
                }
              }}
            />
          </FormControl>
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isSubmitting}
            sx={{ 
              py: 1.2,
              backgroundColor: '#495670',
              color: 'white',
              '&:hover': {
                backgroundColor: '#3b465e'
              },
              borderRadius: 25,
              fontWeight: 400,
              boxShadow: 'none',
              textTransform: 'none',
              fontSize: '0.95rem',
              letterSpacing: '0.02em',
              transition: 'all 0.2s ease-in-out'
            }}
          >
            {isSubmitting ? 'מתחבר...' : 'התחברות'}
          </Button>
        </form>
      </Paper>
    </Container>
  );
};

export default Login; 