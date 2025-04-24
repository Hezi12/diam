import React from 'react';
import { Grid, Typography, TextField, InputAdornment } from '@mui/material';
import { getHebrewInputStyle } from '../../design-system/styles/StyleConstants';

const RoomPricesSection = ({ formData, onChange, viewOnly }) => {
  const inputStyle = getHebrewInputStyle('10px');
  
  return (
    <>
      <Grid item xs={12} sm={6}>
        <TextField
          label="מחיר בסיס ללא מע״מ"
          name="basePriceNoVat"
          type="number"
          value={formData.basePriceNoVat}
          onChange={onChange}
          fullWidth
          size="small"
          margin="dense"
          inputProps={{ 
            style: { 
              fontSize: '0.85rem', 
              textAlign: 'right',
              color: '#333',
              padding: '10px 14px',
              direction: 'rtl'
            }
          }}
          InputLabelProps={{ 
            style: { 
              fontSize: '0.8rem',
              right: 15,
              left: 'auto',
              transformOrigin: 'right top',
              fontWeight: 500,
              color: '#555'
            },
            shrink: true
          }}
          InputProps={{ 
            endAdornment: <InputAdornment position="end" sx={{ '& p': {fontSize: '0.85rem', color: '#555'} }}>₪</InputAdornment>,
            readOnly: viewOnly,
            style: { height: '32px' }
          }}
          sx={{
            ...inputStyle,
            "& .MuiInputLabel-root": {
              right: 15,
              left: "auto"
            }
          }}
          disabled={viewOnly}
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          label="מחיר בסיס כולל מע״מ"
          name="basePriceWithVat"
          type="number"
          value={formData.basePriceWithVat}
          onChange={onChange}
          fullWidth
          size="small"
          margin="dense"
          inputProps={{ 
            style: { 
              fontSize: '0.85rem', 
              textAlign: 'right',
              color: '#333',
              padding: '10px 14px',
              direction: 'rtl'
            }
          }}
          InputLabelProps={{ 
            style: { 
              fontSize: '0.8rem',
              right: 15,
              left: 'auto',
              transformOrigin: 'right top',
              fontWeight: 500,
              color: '#555'
            },
            shrink: true
          }}
          InputProps={{ 
            endAdornment: <InputAdornment position="end" sx={{ '& p': {fontSize: '0.85rem', color: '#555'} }}>₪</InputAdornment>,
            readOnly: viewOnly,
            style: { height: '32px' } 
          }}
          sx={{
            ...inputStyle,
            "& .MuiInputLabel-root": {
              right: 15,
              left: "auto"
            }
          }}
          disabled={viewOnly}
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          label="מחיר יום שישי ללא מע״מ"
          name="fridayPriceNoVat"
          type="number"
          value={formData.fridayPriceNoVat}
          onChange={onChange}
          fullWidth
          size="small"
          margin="dense"
          inputProps={{ 
            style: { 
              fontSize: '0.85rem', 
              textAlign: 'right',
              color: '#333',
              padding: '10px 14px',
              direction: 'rtl'
            }
          }}
          InputLabelProps={{ 
            style: { 
              fontSize: '0.8rem',
              right: 15,
              left: 'auto',
              transformOrigin: 'right top',
              fontWeight: 500,
              color: '#555'
            },
            shrink: true
          }}
          InputProps={{ 
            endAdornment: <InputAdornment position="end" sx={{ '& p': {fontSize: '0.85rem', color: '#555'} }}>₪</InputAdornment>,
            readOnly: viewOnly,
            style: { height: '32px' } 
          }}
          sx={{
            ...inputStyle,
            "& .MuiInputLabel-root": {
              right: 15,
              left: "auto"
            }
          }}
          disabled={viewOnly}
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          label="מחיר יום שישי כולל מע״מ"
          name="fridayPriceWithVat"
          type="number"
          value={formData.fridayPriceWithVat}
          onChange={onChange}
          fullWidth
          size="small"
          margin="dense"
          inputProps={{ 
            style: { 
              fontSize: '0.85rem', 
              textAlign: 'right',
              color: '#333',
              padding: '10px 14px',
              direction: 'rtl'
            }
          }}
          InputLabelProps={{ 
            style: { 
              fontSize: '0.8rem',
              right: 15,
              left: 'auto',
              transformOrigin: 'right top',
              fontWeight: 500,
              color: '#555'
            },
            shrink: true
          }}
          InputProps={{ 
            endAdornment: <InputAdornment position="end" sx={{ '& p': {fontSize: '0.85rem', color: '#555'} }}>₪</InputAdornment>,
            readOnly: viewOnly,
            style: { height: '32px' } 
          }}
          sx={{
            ...inputStyle,
            "& .MuiInputLabel-root": {
              right: 15,
              left: "auto"
            }
          }}
          disabled={viewOnly}
        />
      </Grid>
    </>
  );
};

export default RoomPricesSection; 