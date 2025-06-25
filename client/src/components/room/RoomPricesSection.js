import React from 'react';
import { Grid, Typography, TextField, InputAdornment } from '@mui/material';
import { getHebrewInputStyle } from '../../styles/StyleConstants';

const RoomPricesSection = ({ formData, onChange, viewOnly }) => {
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
            endAdornment: <InputAdornment position="end" sx={{ '& p': {fontSize: '0.85rem', color: '#555'} }}>₪</InputAdornment>,
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
            endAdornment: <InputAdornment position="end" sx={{ '& p': {fontSize: '0.85rem', color: '#555'} }}>₪</InputAdornment>,
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
            endAdornment: <InputAdornment position="end" sx={{ '& p': {fontSize: '0.85rem', color: '#555'} }}>₪</InputAdornment>,
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
            endAdornment: <InputAdornment position="end" sx={{ '& p': {fontSize: '0.85rem', color: '#555'} }}>₪</InputAdornment>,
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

      {/* שדות מחיר שבת חדשים */}
      <Grid item xs={12} sm={6}>
        <TextField
          label="מחיר יום שבת ללא מע״מ"
          name="saturdayPriceNoVat"
          type="number"
          value={formData.saturdayPriceNoVat}
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
            endAdornment: <InputAdornment position="end" sx={{ '& p': {fontSize: '0.85rem', color: '#555'} }}>₪</InputAdornment>,
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
      
      <Grid item xs={12} sm={6}>
        <TextField
          label="מחיר יום שבת כולל מע״מ"
          name="saturdayPriceWithVat"
          type="number"
          value={formData.saturdayPriceWithVat}
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
            endAdornment: <InputAdornment position="end" sx={{ '& p': {fontSize: '0.85rem', color: '#555'} }}>₪</InputAdornment>,
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
    </>
  );
};

export default RoomPricesSection; 