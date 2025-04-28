import React from 'react';
import { Paper, Tabs, Tab, Grid } from '@mui/material';
import { STYLE_CONSTANTS } from '../../styles/StyleConstants';

/**
 * רכיב לבחירת סגנון לוח הזמנים
 */
const CalendarStyleSelector = ({ calendarStyle, onStyleChange, location }) => {
  const colors = STYLE_CONSTANTS.colors;
  const locationColors = colors[location] || colors.airport;

  return (
    <Grid item xs={12} md={6}>
      <Paper 
        sx={{ 
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...STYLE_CONSTANTS.card
        }}
      >
        <Tabs 
          value={calendarStyle} 
          onChange={onStyleChange}
          variant="fullWidth"
          TabIndicatorProps={{
            style: {
              backgroundColor: locationColors.main,
              height: '3px',
            }
          }}
          sx={{ 
            width: '100%',
            '& .MuiTab-root': {
              fontWeight: 500,
              fontSize: '0.9rem',
              textTransform: 'none',
              minHeight: '36px',
              color: 'text.secondary',
            },
            '& .Mui-selected': {
              color: locationColors.main,
            }
          }}
        >
          <Tab label="סגנון לוח" />
        </Tabs>
      </Paper>
    </Grid>
  );
};

export default CalendarStyleSelector; 