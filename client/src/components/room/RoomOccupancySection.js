import React from 'react';
import { Grid, Typography, TextField, InputAdornment } from '@mui/material';
import { getHebrewInputStyle } from '../../design-system/styles/StyleConstants';

const RoomOccupancySection = ({ formData, onChange, viewOnly }) => {
  const inputStyle = getHebrewInputStyle('8px');
  
  const commonTextFieldProps = {
    size: "small",
    margin: "normal",
    fullWidth: true,
    type: "number",
    disabled: viewOnly,
    onChange: onChange,
    InputLabelProps: { 
      shrink: true,
      style: { 
        right: 15, 
        left: 'auto', 
        transformOrigin: 'right top', 
        fontWeight: 500,
        color: '#555',
        fontSize: '0.85rem',
      }
    },
    inputProps: { 
      style: { 
        textAlign: 'right',
        fontSize: '0.9rem',
        color: '#333',
        padding: '12px 14px',
        direction: 'rtl'
      },
      min: 1,
      max: 10
    },
    sx: {
      ...inputStyle,
      my: 0.5,
      "& .MuiInputLabel-root": {
        right: 15,
        left: "auto"
      },
      "& .MuiOutlinedInput-root": {
        height: '40px'
      }
    }
  };
  
  return (
    <>
      <Grid item xs={12} sm={4}>
        <TextField
          {...commonTextFieldProps}
          label="מספר אורחים בסיסי"
          name="baseOccupancy"
          value={formData.baseOccupancy}
        />
      </Grid>
      
      <Grid item xs={12} sm={4}>
        <TextField
          {...commonTextFieldProps}
          label="מספר אורחים מקסימלי"
          name="maxOccupancy"
          value={formData.maxOccupancy}
        />
      </Grid>
      
      <Grid item xs={12} sm={4}>
        <TextField
          {...commonTextFieldProps}
          label="תוספת לאורח נוסף"
          name="extraGuestCharge"
          value={formData.extraGuestCharge}
          InputProps={{ 
            endAdornment: <InputAdornment position="end" sx={{ '& p': {fontSize: '0.85rem', color: '#555'} }}>₪</InputAdornment>,
            style: { height: '40px' }
          }}
        />
      </Grid>
    </>
  );
};

export default RoomOccupancySection; 