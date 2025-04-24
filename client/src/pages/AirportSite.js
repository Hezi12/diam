import React from 'react';
import { Box, Typography, Paper, Button, Grid } from '@mui/material';
import { OpenInNew as OpenInNewIcon, AirplanemodeActive as AirportIcon } from '@mui/icons-material';

const AirportSite = () => {
  // בפועל הכתובת תהיה לאתר האמיתי
  const siteUrl = "https://airport-guesthouse.example.com";
  
  const handleOpenSite = () => {
    window.open(siteUrl, '_blank');
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
            <Typography variant="body1" paragraph>
              מכאן תוכלו לגשת לאתר ההזמנות של Airport Guest House ולצפות בו כפי שהלקוחות רואים אותו.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              כתובת האתר: {siteUrl}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
            <Button 
              variant="contained" 
              onClick={handleOpenSite}
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
              פתח את האתר
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default AirportSite; 