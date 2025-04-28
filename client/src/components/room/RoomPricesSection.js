import React from 'react';
import { Grid, Typography, TextField, InputAdornment } from '@mui/material';
import { getHebrewInputStyle } from '../../design-system/styles/StyleConstants';

const RoomPricesSection = ({ formData, onChange, viewOnly }) => {
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
      } 
    },
    InputProps: { 
      endAdornment: <InputAdornment position="end" sx={{ '& p': {fontSize: '0.85rem', color: '#555'} }}>₪</InputAdornment>,
      style: { height: '40px' } 
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
      <Grid item xs={12} sm={6}>
        <TextField
          {...commonTextFieldProps}
          label="מחיר בסיס ללא מע״מ"
          name="basePriceNoVat"
          value={formData.basePriceNoVat}
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          {...commonTextFieldProps}
          label="מחיר בסיס כולל מע״מ"
          name="basePriceWithVat"
          value={formData.basePriceWithVat}
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          {...commonTextFieldProps}
          label="מחיר יום שישי ללא מע״מ"
          name="fridayPriceNoVat"
          value={formData.fridayPriceNoVat}
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          {...commonTextFieldProps}
          label="מחיר יום שישי כולל מע״מ"
          name="fridayPriceWithVat"
          value={formData.fridayPriceWithVat}
        />
      </Grid>
    </>
  );
};

export default RoomPricesSection; 