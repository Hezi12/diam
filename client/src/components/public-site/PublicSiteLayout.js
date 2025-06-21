import React, { useState } from 'react';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Container, 
  Typography, 
  Button, 
  IconButton, 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
  Menu,
  MenuItem,
  Grid
} from '@mui/material';
import {
  Menu as MenuIcon,
  Language as LanguageIcon,
  WhatsApp as WhatsAppIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import { styled } from '@mui/material/styles';

// תפריט וחלקים קבועים נוספים

const PublicSiteLayout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [languageMenu, setLanguageMenu] = useState(null);
  const [language, setLanguage] = useState('he');
  
  // נתיבי התפריט
  const menuItems = [
    { label: 'דף הבית', path: '/airport-booking' },
    { label: 'שאלות ופרטים נוספים', path: '/airport-booking/faq-details' },
  ];

  // פילטור התפריט - הסתרת "דף הבית" כשאנחנו בדף הבית
  const filteredMenuItems = menuItems.filter(item => 
    !(item.path === '/airport-booking' && location.pathname === '/airport-booking')
  );
  
  const handleLanguageMenu = (event) => {
    setLanguageMenu(event.currentTarget);
  };
  
  const handleLanguageClose = () => {
    setLanguageMenu(null);
  };
  
  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    handleLanguageClose();
    // כאן תהיה לוגיקה לשינוי השפה בהמשך
  };
  
  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };
  
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
            <Typography 
              variant="h6" 
              component={Link} 
              to="/airport-booking"
              sx={{ 
                flexGrow: 1, 
                textDecoration: 'none',
                color: '#1e293b',
                fontWeight: 600,
                fontSize: '1.5rem',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              Airport Guest House
            </Typography>
            
            {isMobile ? (
              <>
                <IconButton
                  component="a"
                  href="https://wa.me/972506070260"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ 
                    color: '#25D366',
                    mr: 1,
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
                    mr: 1,
                    '&:hover': { 
                      bgcolor: 'rgba(220, 38, 38, 0.1)',
                      color: '#991b1b'
                    }
                  }}
                >
                  <PhoneIcon />
                </IconButton>
                
                <IconButton 
                  onClick={handleLanguageMenu}
                  edge="end"
                  sx={{ 
                    mr: 1,
                    color: '#64748b',
                    '&:hover': { bgcolor: '#f1f5f9' }
                  }}
                >
                  <LanguageIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  color="inherit"
                  aria-label="menu"
                  onClick={toggleDrawer}
                  sx={{
                    color: '#64748b',
                    '&:hover': { bgcolor: '#f1f5f9' }
                  }}
                >
                  <MenuIcon />
                </IconButton>
              </>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {filteredMenuItems.map((item) => (
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
                
                <Divider orientation="vertical" flexItem sx={{ mx: 2, height: 24, bgcolor: '#e2e8f0' }} />
                <Button 
                  onClick={handleLanguageMenu}
                  color="inherit"
                  startIcon={<LanguageIcon />}
                  sx={{ 
                    ml: 1,
                    color: '#64748b',
                    '&:hover': { bgcolor: '#f8fafc' }
                  }}
                >
                  {language === 'he' ? 'עברית' : 'English'}
                </Button>
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>
      
      {/* תפריט שפות */}
      <Menu
        anchorEl={languageMenu}
        open={Boolean(languageMenu)}
        onClose={handleLanguageClose}
        PaperProps={{
          sx: {
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }
        }}
      >
        <MenuItem 
          onClick={() => handleLanguageChange('he')}
          selected={language === 'he'}
          sx={{ 
            minWidth: 120,
            '&.Mui-selected': {
              bgcolor: '#f1f5f9'
            }
          }}
        >
          עברית
        </MenuItem>
        <MenuItem 
          onClick={() => handleLanguageChange('en')}
          selected={language === 'en'}
          sx={{ 
            minWidth: 120,
            '&.Mui-selected': {
              bgcolor: '#f1f5f9'
            }
          }}
        >
          English
        </MenuItem>
      </Menu>
      
      {/* מגירה לתפריט במובייל */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={toggleDrawer}
        PaperProps={{
          sx: {
            width: 250,
            bgcolor: 'white',
            border: 'none'
          }
        }}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={toggleDrawer}
        >
          <Box sx={{ p: 3, borderBottom: '1px solid #e2e8f0' }}>
            <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 600 }}>
              Airport Guest House
            </Typography>
          </Box>
          <List>
            {filteredMenuItems.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton 
                  component={Link} 
                  to={item.path}
                  sx={{ 
                    py: 2,
                    backgroundColor: location.pathname === item.path ? '#f8fafc' : 'transparent',
                    borderRight: location.pathname === item.path ? '3px solid #dc2626' : 'none',
                    '&:hover': {
                      bgcolor: '#f1f5f9'
                    }
                  }}
                >
                  <ListItemText 
                    primary={item.label}
                    sx={{
                      '& .MuiListItemText-primary': {
                        color: location.pathname === item.path ? '#dc2626' : '#64748b',
                        fontWeight: location.pathname === item.path ? 600 : 400
                      }
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
            
            {/* כפתורי קשר במובייל */}
            <ListItem disablePadding>
              <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', py: 2 }}>
                <IconButton
                  component="a"
                  href="https://wa.me/972506070260"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ 
                    color: '#25D366',
                    mx: 1,
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
                    mx: 1,
                    '&:hover': { 
                      bgcolor: 'rgba(220, 38, 38, 0.1)',
                      color: '#991b1b'
                    }
                  }}
                >
                  <PhoneIcon />
                </IconButton>
              </Box>
            </ListItem>
          </List>
        </Box>
      </Drawer>
      
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