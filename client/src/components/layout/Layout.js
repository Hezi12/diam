import React from 'react';
import { Box, styled } from '@mui/material';
import Sidebar from '../common/Sidebar';

const drawerWidth = 70;

const Main = styled('main')(({ theme }) => ({
  flexGrow: 1,
  padding: '24px',
  marginRight: `${drawerWidth}px`,
  backgroundColor: '#f5f5f7',
  minHeight: '100vh',
}));

/**
 * רכיב Layout עוטף את תוכן העמודים באתר
 * ומוסיף את הסרגל הצדדי
 */
const Layout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Main>
        {children}
      </Main>
    </Box>
  );
};

export default Layout; 