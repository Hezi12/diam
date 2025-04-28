import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Box, Drawer, List, ListItem, ListItemIcon, Tooltip, styled } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  EventNote as BookingsIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  House as RothschildIcon,
  Flight as AirportIcon,
  ArrowBack as ArrowBackIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { STYLE_CONSTANTS } from '../../styles/StyleConstants';

const drawerWidth = 70;

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

const StyledNavLink = styled(NavLink)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  color: STYLE_CONSTANTS.colors.text.secondary,
  width: '100%',
  height: '100%',
  borderRadius: '8px',
  padding: '12px 0',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: '#f5f5f7',
    color: STYLE_CONSTANTS.colors.airport.main,
  },
  '&.active': {
    color: STYLE_CONSTANTS.colors.airport.main,
    backgroundColor: STYLE_CONSTANTS.colors.airport.bgLight,
  },
}));

const SidebarItem = ({ icon, to, title, iconColor }) => {
  return (
    <ListItem sx={{ padding: '8px', display: 'flex', justifyContent: 'center' }}>
      <Tooltip title={title} placement="left">
        <StyledNavLink to={to}>
          <ListItemIcon sx={{ 
            minWidth: 'auto', 
            justifyContent: 'center', 
            color: 'inherit',
            '& .MuiSvgIcon-root': {
              color: iconColor || 'inherit',
              transition: 'all 0.2s ease-in-out',
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

const SidebarBackButton = ({ onClick, title }) => {
  return (
    <ListItem sx={{ padding: '8px', display: 'flex', justifyContent: 'center' }}>
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
            padding: '12px 0',
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
            },
          }}
        >
          <ArrowBackIcon />
        </Box>
      </Tooltip>
    </ListItem>
  );
};

const Sidebar = () => {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
  };
  
  const handleBack = () => {
    navigate(-1);
  };
  
  // בדיקה האם אנחנו בדף שצריך להציג בו כפתור חזרה
  const shouldShowBackButton = () => {
    // בדף של ניהול חדרים (airport או rothschild), נרצה להציג כפתור חזרה לדף הגדרות
    return location.pathname.includes('/settings/rooms/');
  };

  // צבעים חדשים לאייקונים בסרגל
  const iconColors = {
    dashboard: '#4A90E2', // כחול כהה יותר
    bookings: '#5E97F6', // כחול בהיר
    invoices: '#34A853', // ירוק
    rothschild: '#304dbd', // צבע רוטשילד מקורי
    airport: '#0059b3', // צבע אייפורט מקורי 
    settings: '#F5B400', // צהוב/כתום
    logout: '#EA4335' // אדום
  };

  return (
    <StyledDrawer variant="permanent" anchor="right">
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        height: '100%',
        padding: '20px 10px',
      }}>
        <Box sx={{ padding: '10px 0 10px' }} />
        
        <List sx={{ flexGrow: 1 }}>
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
          />
          <SidebarItem
            icon={<BookingsIcon />}
            to="/bookings"
            title="ניהול הזמנות"
            iconColor={iconColors.bookings}
          />
          <SidebarItem
            icon={<ReceiptIcon />}
            to="/invoices"
            title="חשבוניות"
            iconColor={iconColors.invoices}
          />
          <SidebarItem
            icon={<RothschildIcon />}
            to="/rothschild-site"
            title="אתר Rothschild"
            iconColor={iconColors.rothschild}
          />
          <SidebarItem
            icon={<AirportIcon />}
            to="/airport-site"
            title="אתר Airport Guest House"
            iconColor={iconColors.airport}
          />
          <SidebarItem
            icon={<SettingsIcon />}
            to="/settings"
            title="הגדרות"
            iconColor={iconColors.settings}
          />
        </List>
        
        <List>
          <ListItem sx={{ padding: '8px', display: 'flex', justifyContent: 'center' }}>
            <Tooltip title="התנתקות" placement="left">
              <Box 
                component="button"
                onClick={handleLogout}
                sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: '100%',
                  padding: '12px 0',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: STYLE_CONSTANTS.colors.text.secondary,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: `rgba(${iconColors.logout.replace('#', '').match(/../g).map(hex => parseInt(hex, 16)).join(', ')}, 0.1)`,
                    color: iconColors.logout,
                  },
                  '& .MuiSvgIcon-root': {
                    color: iconColors.logout,
                  },
                }}
              >
                <LogoutIcon />
              </Box>
            </Tooltip>
          </ListItem>
        </List>
      </Box>
    </StyledDrawer>
  );
};

export default Sidebar; 