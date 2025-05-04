import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  Tooltip, 
  styled,
  useMediaQuery,
  useTheme,
  IconButton,
  // SwipeableDrawer, - לא בשימוש יותר
  // נסיר את הקומפוננטות הקשורות לניווט התחתון
  // BottomNavigation,
  // BottomNavigationAction,
  // Paper
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  EventNote as BookingsIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  House as RothschildIcon,
  Flight as AirportIcon,
  ArrowBack as ArrowBackIcon,
  Receipt as ReceiptIcon,
  BarChart as RevenueIcon,
  Menu as MenuIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { STYLE_CONSTANTS } from '../../styles/StyleConstants';

const drawerWidth = 70;

// סטיילים לדסקטופ
const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: drawerWidth,
    boxSizing: 'border-box',
    backgroundColor: STYLE_CONSTANTS.colors.background.paper,
    borderLeft: '1px solid #f0f0f0',
  },
}));

// עיצוב של הקישורים - מותאם למסך קטן במובייל
const StyledNavLink = styled(NavLink)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  color: STYLE_CONSTANTS.colors.text.secondary,
  width: '100%',
  height: '100%',
  borderRadius: '8px',
  padding: '8px 0', // ערך ביניים שמתאים גם למובייל וגם לדסקטופ
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: '#f5f5f7',
    color: STYLE_CONSTANTS.colors.airport.main,
  },
  '&.active': {
    color: STYLE_CONSTANTS.colors.airport.main,
    backgroundColor: STYLE_CONSTANTS.colors.airport.bgLight,
  },

  // מדיה-קוורי לשינוי הפדינג במובייל
  [theme.breakpoints.down('md')]: {
    padding: '6px 0',
  },
}));

// הרכיב של פריט בתפריט צד
const SidebarItem = ({ icon, to, title, iconColor, onClick }) => {
  const isMobile = useMediaQuery(useTheme().breakpoints.down('md'));
  
  return (
    <ListItem sx={{ 
      padding: isMobile ? '6px' : '8px', 
      display: 'flex', 
      justifyContent: 'center' 
    }}>
      <Tooltip title={title} placement="left">
        <StyledNavLink to={to} onClick={onClick}>
          <ListItemIcon sx={{ 
            minWidth: 'auto', 
            justifyContent: 'center', 
            color: 'inherit',
            '& .MuiSvgIcon-root': {
              color: iconColor || 'inherit',
              transition: 'all 0.2s ease-in-out',
              fontSize: isMobile ? '1.8rem' : '1.5rem', // אייקונים גדולים יותר במובייל
            },
            '&:hover .MuiSvgIcon-root': {
              color: iconColor || STYLE_CONSTANTS.colors.airport.main,
            },
          }}>
            {icon}
          </ListItemIcon>
        </StyledNavLink>
      </Tooltip>
    </ListItem>
  );
};

// כפתור חזרה
const SidebarBackButton = ({ onClick, title }) => {
  const isMobile = useMediaQuery(useTheme().breakpoints.down('md'));
  
  return (
    <ListItem sx={{ 
      padding: isMobile ? '6px' : '8px', 
      display: 'flex', 
      justifyContent: 'center' 
    }}>
      <Tooltip title={title} placement="left">
        <Box 
          component="button"
          onClick={onClick}
          sx={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            padding: isMobile ? '8px 0' : '12px 0',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '8px',
            color: STYLE_CONSTANTS.colors.text.secondary,
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: '#f5f5f7',
              color: STYLE_CONSTANTS.colors.airport.main,
            },
            '& .MuiSvgIcon-root': {
              color: STYLE_CONSTANTS.colors.airport.main,
              fontSize: isMobile ? '1.8rem' : '1.5rem', // אייקון גדול יותר במובייל
            },
          }}
        >
          <ArrowBackIcon />
        </Box>
      </Tooltip>
    </ListItem>
  );
};

// רכיב כפתור יציאה
const LogoutButton = ({ onClick, iconColor }) => {
  const isMobile = useMediaQuery(useTheme().breakpoints.down('md'));
  
  return (
    <ListItem sx={{ 
      padding: isMobile ? '6px' : '8px', 
      display: 'flex', 
      justifyContent: 'center' 
    }}>
      <Tooltip title="התנתקות" placement="left">
        <Box 
          component="button"
          onClick={onClick}
          sx={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            padding: isMobile ? '8px 0' : '12px 0',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '8px',
            color: STYLE_CONSTANTS.colors.text.secondary,
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: `rgba(${iconColor.replace('#', '').match(/../g).map(hex => parseInt(hex, 16)).join(', ')}, 0.1)`,
              color: iconColor,
            },
            '& .MuiSvgIcon-root': {
              color: iconColor,
              fontSize: isMobile ? '1.8rem' : '1.5rem', // אייקון גדול יותר במובייל
            },
          }}
        >
          <LogoutIcon />
        </Box>
      </Tooltip>
    </ListItem>
  );
};

const Sidebar = () => {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  // לוגיקת התנתקות
  const handleLogout = () => {
    logout();
  };
  
  // כפתור חזרה
  const handleBack = () => {
    navigate(-1);
  };
  
  // פתיחה/סגירה של תפריט מובייל
  const toggleDrawer = (open) => (event) => {
    if (
      event && 
      event.type === 'keydown' && 
      (event.key === 'Tab' || event.key === 'Shift')
    ) {
      return;
    }
    setMobileOpen(open);
  };
  
  // בדיקה האם אנחנו בדף שצריך להציג בו כפתור חזרה
  const shouldShowBackButton = () => {
    // בדף של ניהול חדרים (airport או rothschild), נרצה להציג כפתור חזרה לדף הגדרות
    return location.pathname.includes('/settings/rooms/');
  };

  // צבעים לאייקונים בסרגל
  const iconColors = {
    dashboard: '#4A90E2', // כחול כהה יותר
    bookings: '#5E97F6', // כחול בהיר
    invoices: '#34A853', // ירוק
    revenue: '#9C27B0', // סגול
    rothschild: '#304dbd', // צבע רוטשילד מקורי
    airport: '#0059b3', // צבע אייפורט מקורי 
    settings: '#F5B400', // צהוב/כתום
    logout: '#EA4335' // אדום
  };

  // תוכן המגירה (משותף בין דסקטופ למובייל)
  const drawerContent = (
    <>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        height: '100%',
        padding: isMobile ? '15px 5px' : '20px 10px',
      }}>
        {/* מבטלים את מרווח העליון במובייל */}
        {!isMobile && <Box sx={{ padding: '10px 0 10px' }} />}
        
        <List sx={{ 
          flexGrow: 1,
          padding: isMobile ? '8px 0' : '8px 0', // יותר פדינג ברשימה עצמה 
          '& .MuiListItem-root': {
            padding: isMobile ? '10px 5px' : '8px', // יותר מרווח בין פריטים במובייל
            marginBottom: isMobile ? '5px' : '0' // מרווח בין פריטים
          }
        }}>
          {shouldShowBackButton() && (
            <SidebarBackButton 
              onClick={handleBack}
              title="חזרה"
            />
          )}
          <SidebarItem
            icon={<DashboardIcon />}
            to="/dashboard"
            title="דאשבורד"
            iconColor={iconColors.dashboard}
            onClick={isMobile ? toggleDrawer(false) : undefined}
          />
          <SidebarItem
            icon={<BookingsIcon />}
            to="/bookings"
            title="ניהול הזמנות"
            iconColor={iconColors.bookings}
            onClick={isMobile ? toggleDrawer(false) : undefined}
          />
          <SidebarItem
            icon={<ReceiptIcon />}
            to="/invoices"
            title="חשבוניות"
            iconColor={iconColors.invoices}
            onClick={isMobile ? toggleDrawer(false) : undefined}
          />
          <SidebarItem
            icon={<RevenueIcon />}
            to="/revenue"
            title="דוחות הכנסות"
            iconColor={iconColors.revenue}
            onClick={isMobile ? toggleDrawer(false) : undefined}
          />
          <SidebarItem
            icon={<RothschildIcon />}
            to="/rothschild-site"
            title="אתר Rothschild"
            iconColor={iconColors.rothschild}
            onClick={isMobile ? toggleDrawer(false) : undefined}
          />
          <SidebarItem
            icon={<AirportIcon />}
            to="/airport-site"
            title="אתר Airport Guest House"
            iconColor={iconColors.airport}
            onClick={isMobile ? toggleDrawer(false) : undefined}
          />
          <SidebarItem
            icon={<SettingsIcon />}
            to="/settings"
            title="הגדרות"
            iconColor={iconColors.settings}
            onClick={isMobile ? toggleDrawer(false) : undefined}
          />
        </List>
        
        <List sx={{ 
          padding: isMobile ? '8px 0' : '8px 0'  // יותר פדינג ברשימה של כפתור ההתנתקות
        }}>
          <LogoutButton 
            onClick={handleLogout}
            iconColor={iconColors.logout}
          />
        </List>
      </Box>
    </>
  );

  // במובייל
  if (isMobile) {
    return (
      <>
        {/* כפתור פתיחה של התפריט במובייל */}
        <Box 
          sx={{ 
            position: 'fixed', 
            top: 10, 
            right: 10, 
            zIndex: 1200,
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <IconButton 
            onClick={toggleDrawer(true)} 
            size="medium"
            sx={{
              color: STYLE_CONSTANTS.colors.airport.main,
              '&:hover': {
                backgroundColor: 'transparent',
              }
            }}
          >
            <MenuIcon sx={{ fontSize: '1.9rem' }} />
          </IconButton>
        </Box>
        
        {/* רקע כהה למסך כשהתפריט פתוח */}
        {mobileOpen && (
          <Box
            onClick={toggleDrawer(false)}
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1250,
              transition: 'opacity 0.3s ease',
            }}
          />
        )}
        
        {/* תפריט מותאם אישית */}
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            right: mobileOpen ? 0 : '-180px', // נפתח מימין לשמאל
            bottom: 0,
            width: '40%',
            maxWidth: '180px',
            minWidth: '150px',
            backgroundColor: STYLE_CONSTANTS.colors.background.paper,
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)',
            zIndex: 1300,
            transition: 'right 0.3s ease',
            overflowY: 'auto',
          }}
        >
          {drawerContent}
        </Box>
      </>
    );
  }

  // בדסקטופ
  return (
    <StyledDrawer variant="permanent" anchor="right">
      {drawerContent}
    </StyledDrawer>
  );
};

export default Sidebar; 