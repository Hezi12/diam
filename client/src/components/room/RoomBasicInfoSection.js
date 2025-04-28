import React from 'react';
import { Grid, Typography, TextField, MenuItem } from '@mui/material';
import { getHebrewInputStyle } from '../../design-system/styles/StyleConstants';

// אפשרויות לקטגוריות חדרים
const roomCategories = [
  'Simple',
  'Simple with Balcony',
  'Standard',
  'Standard with Balcony',
  'Family room',
  'Not for Sale'
];

const RoomBasicInfoSection = ({ formData, onChange, viewOnly }) => {
  const inputStyle = getHebrewInputStyle('8px');
  
  return (
    <>
      <Grid item xs={12} sm={6}>
        <TextField
          id="roomNumber"
          name="roomNumber"
          label="מספר חדר"
          value={formData.roomNumber || ''}
          onChange={onChange}
          fullWidth
          required
          variant="outlined"
          margin="normal"
          size="small"
          type="text"
          InputLabelProps={{ 
            shrink: true,
            style: { 
              right: 15, 
              left: 'auto', 
              transformOrigin: 'right top', 
              textAlign: 'right',
              fontSize: '0.85rem',
              fontWeight: 500,
              color: '#555'
            }
          }}
          inputProps={{ 
            style: { 
              textAlign: 'right',
              fontSize: '0.9rem',
              color: '#333',
              padding: '12px 14px',
              direction: 'rtl'
            } 
          }}
          sx={{
            ...inputStyle,
            my: 0.5,
            "& .MuiInputLabel-root": {
              right: 15,
              left: "auto"
            },
            "& .MuiOutlinedInput-root": {
              height: '40px'
            }
          }}
          disabled={viewOnly}
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          id="category"
          name="category"
          label="קטגוריית חדר"
          select
          value={formData.category || 'Simple'}
          onChange={onChange}
          fullWidth
          required
          margin="normal"
          variant="outlined"
          size="small"
          InputLabelProps={{ 
            shrink: true,
            style: { 
              right: 15, 
              left: 'auto', 
              transformOrigin: 'right top', 
              textAlign: 'right',
              fontSize: '0.85rem',
              fontWeight: 500,
              color: '#555'
            }
          }}
          sx={{
            ...inputStyle,
            my: 0.5,
            "& .MuiInputLabel-root": {
              right: 15,
              left: "auto"
            },
            "& .MuiOutlinedInput-root": {
              height: '40px'
            }
          }}
          SelectProps={{
            MenuProps: {
              anchorOrigin: {
                vertical: 'bottom',
                horizontal: 'right'
              },
              transformOrigin: {
                vertical: 'top',
                horizontal: 'right'
              },
              PaperProps: {
                style: {
                  textAlign: 'right',
                  direction: 'rtl'
                }
              }
            }
          }}
          disabled={viewOnly}
        >
          {roomCategories.map((option) => (
            <MenuItem key={option} value={option} style={{textAlign: 'right', direction: 'rtl', fontSize: '0.9rem'}}>
              {option}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
    </>
  );
};

export default RoomBasicInfoSection; 