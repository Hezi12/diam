import React from 'react';
import { Grid, Typography, TextField } from '@mui/material';
import { getHebrewInputStyle } from '../../design-system/styles/StyleConstants';

const RoomDetailsSection = ({ formData, onChange, viewOnly }) => {
  const inputStyle = getHebrewInputStyle('10px');
  
  return (
    <>
      <Grid item xs={12}>
        <TextField
          label="תיאור החדר"
          name="description"
          value={formData.description}
          onChange={onChange}
          fullWidth
          multiline
          rows={2}
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
            shrink: true,
            style: { 
              fontSize: '0.8rem',
              fontWeight: 500,
              color: '#555'
            }
          }}
          InputProps={{
            readOnly: viewOnly,
            style: { fontSize: '0.85rem' }
          }}
          sx={{
            ...inputStyle,
            "& .MuiInputLabel-root": {
              right: 15,
              left: "auto",
              transformOrigin: 'right top'
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
            shrink: true,
            style: { 
              fontSize: '0.8rem',
              fontWeight: 500,
              color: '#555'
            }
          }}
          InputProps={{
            readOnly: viewOnly,
            style: { fontSize: '0.85rem' }
          }}
          sx={{
            ...inputStyle,
            "& .MuiInputLabel-root": {
              right: 15,
              left: "auto",
              transformOrigin: 'right top'
            }
          }}
          disabled={viewOnly}
        />
      </Grid>
    </>
  );
};

export default RoomDetailsSection; 