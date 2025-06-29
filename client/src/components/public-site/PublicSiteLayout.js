import React from 'react';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Container, 
  Typography, 
  Button, 
  IconButton, 
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  WhatsApp as WhatsAppIcon,
  Phone as PhoneIcon,
  Flight as FlightIcon
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';

// תפריט וחלקים קבועים נוספים

const PublicSiteLayout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  
  // נתיבי התפריט
  const menuItems = [
    { label: 'שאלות ופרטים נוספים', path: '/airport-booking/faq-details' },
  ];
  
  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: '#fff',
    }}>
      {/* תפריט עליון */}
      <AppBar 
        position="static" 
        color="transparent" 
        elevation={0}
        sx={{ 
          borderBottom: '1px solid #e2e8f0',
          bgcolor: 'white',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}
      >
        <Container>
          <Toolbar sx={{ px: { xs: 0, sm: 2 }, minHeight: '64px !important' }}>
            <Box
              component={Link}
              to="/airport-booking"
              sx={{
                flexGrow: 1,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                cursor: 'pointer',
                '&:hover .logo-text': {
                  background: 'linear-gradient(45deg, #0f172a 30%, #1e40af 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  transform: 'translateY(-1px)'
                },
                '&:hover .logo-icon': {
                  transform: 'rotate(5deg) scale(1.1)',
                  color: '#1e40af'
                }
              }}
            >
              <FlightIcon 
                className="logo-icon"
                sx={{ 
                  fontSize: '2rem',
                  color: '#0f172a',
                  transition: 'all 0.3s ease',
                  transform: 'rotate(-15deg)'
                }} 
              />
              <Typography 
                className="logo-text"
                variant="h6" 
                sx={{ 
                  color: '#0f172a',
                  fontWeight: 700,
                  fontSize: { xs: '1.3rem', sm: '1.6rem' },
                  letterSpacing: '-0.5px',
                  background: 'linear-gradient(45deg, #0f172a 60%, #374151 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  transition: 'all 0.3s ease',
                  textShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  lineHeight: 1.2
                }}
              >
                Airport Guest House
              </Typography>
            </Box>
            
            {isMobile ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton
                  component="a"
                  href="https://wa.me/972506070260"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ 
                    color: '#25D366',
                    '&:hover': { 
                      bgcolor: 'rgba(37, 211, 102, 0.1)',
                      color: '#128C7E'
                    }
                  }}
                >
                  <WhatsAppIcon />
                </IconButton>
                
                <IconButton
                  component="a"
                  href="tel:+972506070260"
                  sx={{ 
                    color: '#dc2626',
                    ml: 1,
                    '&:hover': { 
                      bgcolor: 'rgba(220, 38, 38, 0.1)',
                      color: '#991b1b'
                    }
                  }}
                >
                  <PhoneIcon />
                </IconButton>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {menuItems.map((item) => (
                  <Button
                    key={item.path}
                    component={Link}
                    to={item.path}
                    sx={{ 
                      mx: 0.5,
                      px: 2,
                      color: location.pathname === item.path ? '#dc2626' : '#64748b',
                      fontWeight: location.pathname === item.path ? 600 : 400,
                      borderRadius: 1,
                      '&:hover': {
                        bgcolor: '#f8fafc',
                        color: '#334155'
                      }
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
                
                {/* כפתורי קשר */}
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                  <IconButton
                    component="a"
                    href="https://wa.me/972506070260"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      color: '#25D366',
                      '&:hover': { 
                        bgcolor: 'rgba(37, 211, 102, 0.1)',
                        color: '#128C7E'
                      }
                    }}
                  >
                    <WhatsAppIcon />
                  </IconButton>
                  
                  <IconButton
                    component="a"
                    href="tel:+972506070260"
                    sx={{ 
                      color: '#dc2626',
                      ml: 1,
                      '&:hover': { 
                        bgcolor: 'rgba(220, 38, 38, 0.1)',
                        color: '#991b1b'
                      }
                    }}
                  >
                    <PhoneIcon />
                  </IconButton>
                </Box>
                

              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>
      

      
      {/* תוכן ראשי */}
      <Box component="main" sx={{ flex: 1 }}>
        {children}
      </Box>
      
      {/* פוטר פשוט */}
      <Box 
        sx={{ 
          borderTop: '1px solid #e2e8f0',
          bgcolor: '#f8fafc',
          py: 2
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" sx={{ textAlign: 'center', color: '#64748b' }}>
            © 2024 Airport Guest House. כל הזכויות שמורות.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default PublicSiteLayout; 