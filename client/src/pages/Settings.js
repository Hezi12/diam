import React from 'react';
import { Box, Grid, Card, Typography, Paper, Button, Divider } from '@mui/material';
import { AirplanemodeActive, Apartment, KeyboardArrowLeft } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { STYLE_CONSTANTS } from '../design-system/styles/StyleConstants';

const Settings = () => {
  const colors = STYLE_CONSTANTS.colors;
  
  return (
    <Box sx={{ pt: 2, maxWidth: '1000px', mx: 'auto' }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight="500" sx={{ color: colors.text.primary }}>
          הגדרות
        </Typography>
      </Box>
      
      <Paper 
        elevation={0} 
        sx={{ 
          p: 0, 
          mb: 4, 
          borderRadius: '14px', 
          overflow: 'hidden',
          border: '1px solid rgba(0,0,0,0.06)',
          transition: 'all 0.2s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}
      >
        <Box sx={{ 
          p: 3, 
          bgcolor: 'rgba(0,0,0,0.02)',
          borderBottom: `2px solid ${colors.airport.main}`,
        }}>
          <Typography variant="h6" fontWeight="500" sx={{ color: colors.text.primary }}>
            ניהול חדרים ותמונות
          </Typography>
        </Box>
        
        <Divider />
        
        <Grid container spacing={0}>
          <Grid item xs={12} md={6} sx={{ borderRight: { md: '1px solid rgba(0,0,0,0.06)' } }}>
            <Box
              component={Link}
              to="/settings/rooms/airport"
              sx={{
                p: 3,
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'background-color 0.15s ease',
                '&:hover': {
                  bgcolor: colors.airport.bgLight,
                }
              }}
            >
              <Box sx={{ 
                mr: 4, 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: '12px',
                bgcolor: colors.airport.bgLight,
                transition: 'all 0.2s ease'
              }}>
                <AirplanemodeActive sx={{ fontSize: 24, color: colors.airport.main }} />
              </Box>
              <Box sx={{ flexGrow: 1, pr: 2 }}>
                <Typography variant="subtitle1" fontWeight="500">
                  Airport Guest House
                </Typography>
              </Box>
              <KeyboardArrowLeft sx={{ color: colors.airport.main, ml: 1 }} />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box
              component={Link}
              to="/settings/rooms/rothschild"
              sx={{
                p: 3,
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'background-color 0.15s ease',
                '&:hover': {
                  bgcolor: colors.rothschild.bgLight,
                }
              }}
            >
              <Box sx={{ 
                mr: 4, 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: '12px',
                bgcolor: colors.rothschild.bgLight,
                transition: 'all 0.2s ease'
              }}>
                <Apartment sx={{ fontSize: 24, color: colors.rothschild.main }} />
              </Box>
              <Box sx={{ flexGrow: 1, pr: 2 }}>
                <Typography variant="subtitle1" fontWeight="500">
                  רוטשילד
                </Typography>
              </Box>
              <KeyboardArrowLeft sx={{ color: colors.rothschild.main, ml: 1 }} />
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default Settings; 