import { createTheme } from '@mui/material';

// יצירת ערכת נושא מותאמת אישית המבוססת על קבועי העיצוב
const theme = createTheme({
  direction: 'rtl',
  typography: {
    fontFamily: '"Assistant", "Roboto", "Helvetica", "Arial", sans-serif',
    h3: {
      fontSize: '2.2rem',
      '@media (max-width:600px)': {
        fontSize: '1.6rem',
      },
    },
    h4: {
      fontSize: '1.8rem',
      '@media (max-width:600px)': {
        fontSize: '1.4rem',
      },
    },
    h5: {
      fontSize: '1.4rem',
      '@media (max-width:600px)': {
        fontSize: '1.15rem',
      },
    },
    h6: {
      fontSize: '1.15rem',
      '@media (max-width:600px)': {
        fontSize: '1rem',
      },
    },
  },
  palette: {
    primary: {
      main: '#0071e3',
    },
    secondary: {
      main: '#86868b',
    },
    background: {
      default: '#f5f5f7',
      paper: '#ffffff',
    },
    text: {
      primary: '#1d1d1f',
      secondary: '#86868b',
    },
    error: {
      main: '#e34a6f',
    },
    warning: {
      main: '#f7971e',
    },
    success: {
      main: '#06a271',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: '4px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

export default theme; 