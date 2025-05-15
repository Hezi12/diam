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
  Language as LanguageIcon
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import { styled } from '@mui/material/styles';

// תפריט וחלקים קבועים נוספים
const Footer = styled(Box)(({ theme }) => ({
  backgroundColor: '#2c3e50',
  color: 'white',
  padding: theme.spacing(6, 0),
}));

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
    { label: 'חדרים', path: '/airport-booking/rooms' },
    { label: 'גלריה', path: '/airport-booking/gallery' },
    { label: 'צור קשר', path: '/airport-booking/about-contact' },
  ];
  
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
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          bgcolor: 'white' 
        }}
      >
        <Container>
          <Toolbar sx={{ px: { xs: 0, sm: 2 } }}>
            <Typography 
              variant="h6" 
              component={Link} 
              to="/airport-booking"
              sx={{ 
                flexGrow: 1, 
                textDecoration: 'none',
                color: 'inherit',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              Airport Guest House
            </Typography>
            
            {isMobile ? (
              <>
                <IconButton 
                  onClick={handleLanguageMenu}
                  edge="end"
                  sx={{ mr: 1 }}
                >
                  <LanguageIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  color="inherit"
                  aria-label="menu"
                  onClick={toggleDrawer}
                >
                  <MenuIcon />
                </IconButton>
              </>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {menuItems.map((item) => (
                  <Button
                    key={item.path}
                    component={Link}
                    to={item.path}
                    sx={{ 
                      mx: 1,
                      color: location.pathname === item.path ? 'primary.main' : 'text.primary',
                      fontWeight: location.pathname === item.path ? 700 : 400,
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
                <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 24 }} />
                <Button 
                  onClick={handleLanguageMenu}
                  color="inherit"
                  startIcon={<LanguageIcon />}
                  sx={{ ml: 1 }}
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
      >
        <MenuItem 
          onClick={() => handleLanguageChange('he')}
          selected={language === 'he'}
          sx={{ minWidth: 120 }}
        >
          עברית
        </MenuItem>
        <MenuItem 
          onClick={() => handleLanguageChange('en')}
          selected={language === 'en'}
          sx={{ minWidth: 120 }}
        >
          English
        </MenuItem>
      </Menu>
      
      {/* מגירה לתפריט במובייל */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={toggleDrawer}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={toggleDrawer}
        >
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton 
                  component={Link} 
                  to={item.path}
                  sx={{ 
                    backgroundColor: location.pathname === item.path ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                  }}
                >
                  <ListItemText 
                    primary={item.label} 
                    primaryTypographyProps={{ 
                      fontWeight: location.pathname === item.path ? 700 : 400,
                      textAlign: 'right'
                    }} 
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      
      {/* תוכן העמוד */}
      <Box sx={{ flexGrow: 1 }}>
        {children}
      </Box>
      
      {/* פוטר */}
      <Footer>
        <Container>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Airport Guest House
              </Typography>
              <Typography variant="body2">
                אירוח איכותי במחירים נוחים בקרבת שדה התעופה
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                צור קשר
              </Typography>
              <Typography variant="body2" paragraph>
                טלפון: 03-123-4567
              </Typography>
              <Typography variant="body2" paragraph>
                מייל: info@airport-guesthouse.com
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                קישורים מהירים
              </Typography>
              <Box component="ul" sx={{ p: 0, m: 0, listStyle: 'none' }}>
                {menuItems.map((item) => (
                  <Box component="li" key={item.path} sx={{ mb: 1 }}>
                    <Link 
                      to={item.path}
                      style={{ 
                        color: 'white', 
                        textDecoration: 'none',
                      }}
                    >
                      {item.label}
                    </Link>
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
          <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              &copy; {new Date().getFullYear()} Airport Guest House. כל הזכויות שמורות.
            </Typography>
          </Box>
        </Container>
      </Footer>
    </Box>
  );
};

export default PublicSiteLayout; 