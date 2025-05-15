import React from 'react';
import { Box, Typography, Paper, Button, Grid, Link } from '@mui/material';
import { OpenInNew as OpenInNewIcon, AirplanemodeActive as AirportIcon } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

const AirportSite = () => {
  // כעת הכתובת היא לאתר שבנינו בפרויקט
  const externalSiteUrl = "https://airport-guesthouse.example.com";
  const internalSiteUrl = "/airport-booking";
  
  const handleOpenExternalSite = () => {
    window.open(externalSiteUrl, '_blank');
  };
  
  return (
    <Box>
      <Box sx={{ 
        mb: 4,
        pt: 2,
        display: 'flex',
        alignItems: 'center'
      }}>
        <Box 
          sx={{ 
            mr: 3.5, 
            bgcolor: 'var(--bg-teal-light)', 
            p: 1.5, 
            borderRadius: 2,
            display: 'flex'
          }}
        >
          <AirportIcon sx={{ color: 'var(--accent-teal)', fontSize: 28 }} />
        </Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 500, color: '#1d1d1f' }}>
          אתר Airport Guest House
        </Typography>
      </Box>
      
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          borderRadius: 2, 
          mb: 3, 
          borderTop: '3px solid var(--accent-teal)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              גישה לאתר ההזמנות החדש (פנימי)
            </Typography>
            <Typography variant="body1" paragraph>
              מכאן תוכלו לגשת לאתר ההזמנות החדש של Airport Guest House שנבנה בתוך המערכת.
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              <strong>יתרונות:</strong> האתר מחובר ישירות למערכת הקיימת, ומשתמש באותו מסד נתונים.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button 
                variant="contained" 
                component={RouterLink}
                to={internalSiteUrl}
                startIcon={<OpenInNewIcon />}
                sx={{ 
                  borderRadius: 1.5,
                  px: 3,
                  py: 1,
                  backgroundColor: 'var(--accent-teal)',
                  '&:hover': {
                    backgroundColor: 'var(--accent-teal)',
                    opacity: 0.9
                  },
                  boxShadow: 'none'
                }}
              >
                פתח את האתר החדש
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box 
              sx={{ 
                width: '100%', 
                height: 'auto',
                minHeight: '180px',
                borderRadius: 2,
                border: '1px solid #eee',
                background: 'linear-gradient(135deg, #e5e7eb 25%, #d1d5db 25%, #d1d5db 50%, #e5e7eb 50%, #e5e7eb 75%, #d1d5db 75%, #d1d5db 100%)',
                backgroundSize: '20px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography variant="body2" sx={{ backgroundColor: 'white', p: 2, borderRadius: 1 }}>
                תצוגה מקדימה - Airport Guest House
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          borderRadius: 2, 
          borderTop: '3px solid #e0e0e0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          bgcolor: '#f9f9f9'
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.secondary' }}>
              גישה לאתר חיצוני (אם קיים)
            </Typography>
            <Typography variant="body1" paragraph color="text.secondary">
              אם קיים אתר חיצוני למלונית, ניתן לגשת אליו מכאן.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              כתובת האתר החיצוני: {externalSiteUrl}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
            <Button 
              variant="outlined" 
              onClick={handleOpenExternalSite}
              startIcon={<OpenInNewIcon />}
              sx={{ 
                borderRadius: 1.5,
                px: 3,
                py: 1,
                boxShadow: 'none'
              }}
            >
              פתח אתר חיצוני
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default AirportSite; 