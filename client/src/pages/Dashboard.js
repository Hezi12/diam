import React from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent } from '@mui/material';
import { Dashboard as DashboardIcon, House as RothschildIcon, Flight as AirportIcon } from '@mui/icons-material';
import { STYLE_CONSTANTS } from '../design-system/styles/StyleConstants';

const Dashboard = () => {
  const colors = STYLE_CONSTANTS.colors;

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <Box 
          sx={{ 
            mr: 2, 
            bgcolor: colors.accent.green + '15', // עם אלפא חלש
            p: 1, 
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center' 
          }}
        >
          <DashboardIcon sx={{ color: colors.accent.green, fontSize: 28 }} />
        </Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 500 }}>
          דאשבורד
        </Typography>
      </Box>
      
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          borderRadius: STYLE_CONSTANTS.card.borderRadius, 
          mb: 4, 
          borderTop: `3px solid ${colors.accent.green}`,
          boxShadow: STYLE_CONSTANTS.card.boxShadow
        }}
      >
        <Typography variant="body1">
          ברוכים הבאים למערכת ניהול בתי האירוח של Diam. מכאן תוכלו לנהל את בתי האירוח השונים.
        </Typography>
      </Paper>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
              height: '100%', 
              borderRadius: STYLE_CONSTANTS.card.borderRadius, 
              boxShadow: STYLE_CONSTANTS.card.boxShadow,
              transition: 'transform 0.2s ease',
              borderTop: `3px solid ${colors.rothschild.main}`,
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box 
                  sx={{ 
                    mr: 2, 
                    bgcolor: colors.rothschild.bgLight, 
                    p: 1.5, 
                    borderRadius: 2,
                    display: 'flex'
                  }}
                >
                  <RothschildIcon sx={{ color: colors.rothschild.main, fontSize: 28 }} />
                </Box>
                <Typography variant="h6" fontWeight={500}>
                  רוטשילד
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                נהלו את חדרי האירוח באתר רוטשילד, כולל מחירים, זמינות ותמונות.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
              height: '100%', 
              borderRadius: STYLE_CONSTANTS.card.borderRadius, 
              boxShadow: STYLE_CONSTANTS.card.boxShadow,
              transition: 'transform 0.2s ease',
              borderTop: `3px solid ${colors.airport.main}`,
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box 
                  sx={{ 
                    mr: 2, 
                    bgcolor: colors.airport.bgLight, 
                    p: 1.5, 
                    borderRadius: 2,
                    display: 'flex'
                  }}
                >
                  <AirportIcon sx={{ color: colors.airport.main, fontSize: 28 }} />
                </Box>
                <Typography variant="h6" fontWeight={500}>
                  Airport Guest House
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                נהלו את חדרי האירוח באתר Airport Guest House, כולל מחירים, זמינות ותמונות.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 