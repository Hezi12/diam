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
  useTheme,
  Tooltip
} from '@mui/material';
import {
  WhatsApp as WhatsAppIcon,
  Phone as PhoneIcon,
  Flight as FlightIcon,
  Language as LanguageIcon
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import AccessibilityWidget from './AccessibilityWidget';
import { usePublicLanguage, usePublicTranslation } from '../../contexts/PublicLanguageContext';

// תפריט וחלקים קבועים נוספים

const PublicSiteLayout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const { currentLanguage, changeLanguage } = usePublicLanguage();
  const t = usePublicTranslation();
  
  // נתיבי התפריט
  const menuItems = [
    { label: t('header.faqFull'), path: '/airport-booking/faq-details' },
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
              <Button
                component={Link}
                to="/airport-booking/faq-details"
                sx={{ 
                  color: location.pathname === '/airport-booking/faq-details' ? '#dc2626' : '#64748b',
                  fontWeight: location.pathname === '/airport-booking/faq-details' ? 600 : 400,
                  fontSize: '0.9rem',
                  px: 2,
                  py: 1,
                  borderRadius: 1,
                  '&:hover': {
                    bgcolor: '#f8fafc',
                    color: '#334155'
                  }
                }}
              >
                {t('header.faq')}
              </Button>
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
                
                {/* כפתורי קשר ושפה */}
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                  <Tooltip 
                    title={currentLanguage === 'he' ? 'Switch to English' : 'עבור לעברית'}
                    arrow
                  >
                    <IconButton
                      onClick={() => {
                        const newLanguage = currentLanguage === 'he' ? 'en' : 'he';
                        changeLanguage(newLanguage);
                      }}
                      sx={{ 
                        color: currentLanguage === 'he' ? '#dc2626' : '#1976d2',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        px: 1,
                        '&:hover': { 
                          bgcolor: currentLanguage === 'he' 
                            ? 'rgba(220, 38, 38, 0.1)' 
                            : 'rgba(25, 118, 210, 0.1)',
                          color: currentLanguage === 'he' ? '#991b1b' : '#1565c0'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <LanguageIcon sx={{ fontSize: '1.2rem' }} />
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          letterSpacing: '0.1px'
                        }}
                      >
                        {currentLanguage === 'he' ? 'עב' : 'EN'}
                      </Typography>
                    </IconButton>
                  </Tooltip>

                  <IconButton
                    component="a"
                    href="https://wa.me/972506070260"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      color: '#25D366',
                      ml: 1,
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
{t('footer.copyright')}
          </Typography>
        </Container>
      </Box>
      
      {/* אייקוני קשר במובייל */}
      {isMobile && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 80, // מעל ווידג'ט הנגישות
            left: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            zIndex: 1000
          }}
        >
          <Tooltip 
            title={currentLanguage === 'he' ? 'Switch to English' : 'עבור לעברית'}
            arrow
            placement="right"
          >
            <IconButton
              onClick={() => {
                const newLanguage = currentLanguage === 'he' ? 'en' : 'he';
                changeLanguage(newLanguage);
              }}
              sx={{ 
                bgcolor: currentLanguage === 'he' ? '#dc2626' : '#1976d2',
                color: 'white',
                width: 48,
                height: 48,
                position: 'relative',
                boxShadow: currentLanguage === 'he' 
                  ? '0 4px 12px rgba(220, 38, 38, 0.3)'
                  : '0 4px 12px rgba(25, 118, 210, 0.3)',
                '&:hover': { 
                  bgcolor: currentLanguage === 'he' ? '#991b1b' : '#1565c0',
                  transform: 'scale(1.1)',
                  boxShadow: currentLanguage === 'he' 
                    ? '0 6px 16px rgba(220, 38, 38, 0.4)'
                    : '0 6px 16px rgba(25, 118, 210, 0.4)',
                },
                transition: 'all 0.3s ease',
                '&::after': {
                  content: `"${currentLanguage === 'he' ? 'עב' : 'EN'}"`,
                  position: 'absolute',
                  bottom: 2,
                  right: 2,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  color: currentLanguage === 'he' ? '#dc2626' : '#1976d2',
                  borderRadius: '2px',
                  padding: '1px 3px',
                  lineHeight: 1
                }
              }}
            >
              <LanguageIcon sx={{ fontSize: '1.3rem' }} />
            </IconButton>
          </Tooltip>
          
          <IconButton
            component="a"
            href="https://wa.me/972506070260"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ 
              bgcolor: '#25D366',
              color: 'white',
              width: 48,
              height: 48,
              boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
              '&:hover': { 
                bgcolor: '#128C7E',
                transform: 'scale(1.1)',
                boxShadow: '0 6px 16px rgba(37, 211, 102, 0.4)',
              },
              transition: 'all 0.3s ease'
            }}
          >
            <WhatsAppIcon />
          </IconButton>
          
          <IconButton
            component="a"
            href="tel:+972506070260"
            sx={{ 
              bgcolor: '#dc2626',
              color: 'white',
              width: 48,
              height: 48,
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
              '&:hover': { 
                bgcolor: '#991b1b',
                transform: 'scale(1.1)',
                boxShadow: '0 6px 16px rgba(220, 38, 38, 0.4)',
              },
              transition: 'all 0.3s ease'
            }}
          >
            <PhoneIcon />
          </IconButton>
        </Box>
      )}
      
      {/* ווידג'ט נגישות */}
      <AccessibilityWidget />
    </Box>
  );
};

export default PublicSiteLayout; 