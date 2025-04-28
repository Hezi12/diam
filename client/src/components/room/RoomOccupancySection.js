import React from 'react';
import { Grid, Typography, TextField, InputAdornment } from '@mui/material';

const RoomOccupancySection = ({ formData, onChange, viewOnly }) => {
  return (
    <>
      <Grid item xs={12} sm={4}>
        <TextField
          label="מספר אורחים בסיסי"
          name="baseOccupancy"
          type="number"
          value={formData.baseOccupancy}
          onChange={onChange}
          fullWidth
          size="small"
          margin="dense"
          inputProps={{ 
            style: { 
              fontSize: '0.85rem', 
              textAlign: 'right',
              color: '#333',
              padding: '10px 14px'
            },
            dir: "rtl",
            min: 1, 
            max: 10 
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
          InputProps={{
            readOnly: viewOnly,
            style: { height: '32px' }
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
      
      <Grid item xs={12} sm={4}>
        <TextField
          label="מספר אורחים מקסימלי"
          name="maxOccupancy"
          type="number"
          value={formData.maxOccupancy}
          onChange={onChange}
          fullWidth
          size="small"
          margin="dense"
          inputProps={{ 
            style: { 
              fontSize: '0.85rem', 
              textAlign: 'right',
              color: '#333',
              padding: '10px 14px'
            },
            dir: "rtl",
            min: 1, 
            max: 10 
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
          InputProps={{
            readOnly: viewOnly,
            style: { height: '32px' }
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
      
      <Grid item xs={12} sm={4}>
        <TextField
          label="תוספת לאורח נוסף"
          name="extraGuestCharge"
          type="number"
          value={formData.extraGuestCharge}
          onChange={onChange}
          fullWidth
          size="small"
          margin="dense"
          inputProps={{ 
            style: { 
              fontSize: '0.85rem', 
              textAlign: 'right',
              color: '#333',
              padding: '10px 14px'
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
          InputProps={{
            readOnly: viewOnly,
            endAdornment: <InputAdornment position="end" sx={{ '& p': {fontSize: '0.85rem', color: '#555'} }}>₪</InputAdornment>,
            style: { height: '32px' }
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
    </>
  );
};

export default RoomOccupancySection; 