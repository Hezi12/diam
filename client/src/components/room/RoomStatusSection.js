import React from 'react';
import { Grid, FormControlLabel, Switch } from '@mui/material';

const RoomStatusSection = ({ formData, onChange, viewOnly }) => {
  return (
    <Grid item xs={12}>
      <FormControlLabel
        control={
          <Switch
            checked={formData.status}
            onChange={onChange}
            name="status"
            disabled={viewOnly}
            color="primary"
            size="small"
          />
        }
        label={formData.status ? 'חדר פעיל' : 'חדר לא פעיל'}
        sx={{
          '& .MuiTypography-root': {
            fontSize: '0.85rem',
            fontWeight: 500,
            color: '#333',
            mr: 1
          },
          direction: 'rtl',
          ml: 0
        }}
      />
    </Grid>
  );
};

export default RoomStatusSection; 