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
            style: { height: '32px' }
          }}
          sx={{
            "& .MuiOutlinedInput-notchedOutline": {
              textAlign: "right"
            },
            "& .MuiInputLabel-root": {
              right: 15,
              left: "auto"
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
            style: { height: '32px' }
          }}
          sx={{
            "& .MuiOutlinedInput-notchedOutline": {
              textAlign: "right"
            },
            "& .MuiInputLabel-root": {
              right: 15,
              left: "auto"
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
            endAdornment: <InputAdornment position="end" sx={{ '& p': {fontSize: '0.85rem', color: '#555'} }}>₪</InputAdornment>,
            style: { height: '32px' }
          }}
          sx={{
            "& .MuiOutlinedInput-notchedOutline": {
              textAlign: "right"
            },
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

export default RoomOccupancySection; 