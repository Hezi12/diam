import React from 'react';
import { Grid, TextField } from '@mui/material';

const RoomDetailsSection = ({ formData, onChange, viewOnly }) => {
  const facilities = ['AC', 'Bath', 'WiFi', 'TV', 'Fridge', 'Kettle', 'Coffee machine', 'Safe', 'Desk', 'Balcony', 'Sea view'];

  return (
    <>
      <Grid item xs={12}>
        <TextField
          label="תיאור קצר"
          name="description"
          value={formData.description}
          onChange={onChange}
          multiline
          rows={2}
          fullWidth
          margin="dense"
          size="small"
          inputProps={{ 
            style: { 
              fontSize: '0.85rem', 
              textAlign: 'right',
              color: '#333'
            },
            dir: "rtl" 
          }}
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
          InputProps={{ readOnly: viewOnly }}
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

      <Grid item xs={12}>
        <TextField
          label="מתקנים זמינים"
          name="facilities"
          value={(formData.facilities || []).join(', ')}
          onChange={(e) => {
            const facilities = e.target.value.split(',').map(f => f.trim()).filter(f => f);
            onChange({ target: { name: 'facilities', value: facilities } });
          }}
          helperText="הפרד מתקנים באמצעות פסיקים"
          fullWidth
          margin="dense"
          size="small"
          inputProps={{ 
            style: { 
              fontSize: '0.85rem', 
              textAlign: 'right',
              color: '#333'
            },
            dir: "rtl" 
          }}
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
          InputProps={{ readOnly: viewOnly }}
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
            },
            "& .MuiFormHelperText-root": {
              textAlign: "right",
              marginRight: "14px",
              fontSize: "0.7rem",
              color: "#666"
            }
          }}
          disabled={viewOnly}
        />
      </Grid>
    </>
  );
};

export default RoomDetailsSection; 