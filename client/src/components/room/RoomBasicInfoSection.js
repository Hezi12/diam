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
  const inputStyle = getHebrewInputStyle('10px');
  
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
          margin="dense"
          size="small"
          type="text"
          InputLabelProps={{ 
            shrink: true,
            sx: {
              right: 14,
              left: 'auto',
              transformOrigin: 'top right',
              fontSize: '0.8rem',
              fontWeight: 500,
              color: '#555',
              position: 'absolute',
              background: 'white',
              padding: '0 5px',
              '&.MuiInputLabel-shrink': {
                transform: 'translate(0, -9px) scale(0.75)'
              }
            }
          }}
          inputProps={{ 
            style: { 
              textAlign: 'right',
              fontSize: '0.85rem',
              color: '#333',
              padding: '10px 14px',
              direction: 'rtl'
            } 
          }}
          sx={{
            "& .MuiOutlinedInput-notchedOutline": {
              textAlign: "right",
              borderColor: 'rgba(0, 0, 0, 0.2)'
            },
            "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: 'rgba(0, 0, 0, 0.3)'
            },
            "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: '#1976d2'
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
          margin="dense"
          variant="outlined"
          size="small"
          InputLabelProps={{ 
            shrink: true,
            sx: {
              right: 14,
              left: 'auto',
              transformOrigin: 'top right',
              fontSize: '0.8rem',
              fontWeight: 500,
              color: '#555',
              position: 'absolute',
              background: 'white',
              padding: '0 5px',
              '&.MuiInputLabel-shrink': {
                transform: 'translate(0, -9px) scale(0.75)'
              }
            }
          }}
          inputProps={{ 
            style: { 
              textAlign: 'right',
              fontSize: '0.85rem',
              color: '#333',
              direction: 'rtl'
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
          sx={{
            "& .MuiOutlinedInput-notchedOutline": {
              textAlign: "right",
              borderColor: 'rgba(0, 0, 0, 0.2)'
            },
            "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: 'rgba(0, 0, 0, 0.3)'
            },
            "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: '#1976d2'
            }
          }}
          disabled={viewOnly}
        >
          {roomCategories.map((option) => (
            <MenuItem key={option} value={option} style={{textAlign: 'right', direction: 'rtl', fontSize: '0.85rem'}}>
              {option}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
    </>
  );
};

export default RoomBasicInfoSection; 