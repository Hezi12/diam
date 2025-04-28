import React from 'react';
import { Grid, Typography, TextField } from '@mui/material';
import { getHebrewInputStyle } from '../../design-system/styles/StyleConstants';

const RoomDetailsSection = ({ formData, onChange, viewOnly }) => {
  const inputStyle = getHebrewInputStyle('8px');
  
  return (
    <>
      <Grid item xs={12}>
        <TextField
          label="תיאור החדר"
          name="description"
          multiline
          rows={4}
          value={formData.description || ''}
          onChange={onChange}
          fullWidth
          margin="normal"
          size="small"
          inputProps={{ 
            style: { 
              textAlign: 'right',
              fontSize: '0.9rem',
              color: '#333',
              padding: '12px 14px',
              direction: 'rtl'
            }
          }}
          InputLabelProps={{ 
            shrink: true,
            style: { 
              right: 15, 
              left: 'auto', 
              transformOrigin: 'right top', 
              fontWeight: 500,
              color: '#555',
              fontSize: '0.85rem'
            }
          }}
          sx={{
            ...inputStyle,
            my: 0.5,
            "& .MuiInputLabel-root": {
              right: 15,
              left: "auto"
            }
          }}
          disabled={viewOnly}
        />
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          label="שירותים ואמצעים (מופרדים בפסיק)"
          name="amenities"
          value={formData.amenities}
          onChange={onChange}
          placeholder="מקלחת, מיזוג, WiFi..."
          fullWidth
          multiline
          rows={1}
          size="small"
          margin="dense"
          inputProps={{ 
            style: { 
              fontSize: '0.85rem', 
              direction: 'rtl', 
              textAlign: 'right', 
              color: '#333'
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
            readOnly: viewOnly,
            style: { fontSize: '0.85rem' }
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

export default RoomDetailsSection; 