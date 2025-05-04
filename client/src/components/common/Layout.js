import React from 'react';
import { Box, styled, useMediaQuery, useTheme } from '@mui/material';
import Sidebar from './Sidebar';

const drawerWidth = 70;

const Main = styled('main', {
  shouldForwardProp: (prop) => prop !== 'isMobile'
})(({ theme, isMobile }) => ({
  flexGrow: 1,
  padding: isMobile ? '16px 12px 70px 12px' : '24px',
  marginRight: isMobile ? 0 : `${drawerWidth}px`,
  backgroundColor: '#f5f5f7',
  minHeight: '100vh',
  transition: theme.transitions.create(['margin', 'padding'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
}));

/**
 * רכיב Layout עוטף את תוכן העמודים באתר
 * ומוסיף את הסרגל הצדדי
 */
const Layout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Main isMobile={isMobile}>
        {children}
      </Main>
    </Box>
  );
};

export default Layout; 