import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  Grid,
  TextField
} from '@mui/material';
import {
  Print as PrintIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const BookingConfirmationView = ({ booking, onClose }) => {
  const [additionalDetails, setAdditionalDetails] = useState(`שעות צ'ק אין: 15:00
שעות צ'ק אאוט: 11:00

אסור לעבור את מספר האורחים המותר בחדר.

ביטולים: ניתן לבטל ללא עלות עד 4 ימים לפני ההגעה. לאחר מכן לא ניתן לבטל.`);

  // State לעריכת נתונים
  const [editableRooms, setEditableRooms] = useState(booking?.rooms || 1);
  const [editableGuests, setEditableGuests] = useState(booking?.guests || 2);
  const [editablePrice, setEditablePrice] = useState(booking?.price || 0);

  const handlePrint = () => {
    // הוספת CSS מיוחד להדפסה
    const printStyles = `
      <style>
        @media print {
          @page {
            margin: 0 !important;
            size: A4 portrait;
            padding: 0 !important;
          }
          
          * {
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          body {
            margin: 0 !important;
            padding: 10px !important;
            font-family: 'Heebo', Arial, sans-serif !important;
            font-size: 11px !important;
            line-height: 1.2 !important;
            direction: rtl !important;
          }
          
          .print-container {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .MuiPaper-root {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 10px !important;
            width: 100% !important;
            background: white !important;
          }
          
          .MuiTypography-h4 {
            font-size: 18px !important;
            margin-bottom: 3px !important;
            font-weight: bold !important;
          }
          
          .MuiTypography-h5 {
            font-size: 14px !important;
            margin: 5px 0 !important;
            font-weight: bold !important;
          }
          
          .MuiTypography-h6 {
            font-size: 12px !important;
            margin: 3px 0 !important;
            font-weight: bold !important;
          }
          
          .MuiTypography-body1, .MuiTypography-body2 {
            font-size: 10px !important;
            line-height: 1.2 !important;
            margin: 1px 0 !important;
          }
          
          .MuiDivider-root {
            margin: 3px 0 !important;
            border-color: #ddd !important;
          }
          
          .section-spacing {
            margin-bottom: 8px !important;
          }
          
          .financial-section {
            padding: 6px !important;
            margin: 5px 0 !important;
            background-color: #f8f9fa !important;
            border-radius: 3px !important;
          }
          
          .MuiGrid-container {
            margin: 0 !important;
            width: 100% !important;
          }
          
          .MuiGrid-item {
            padding: 1px !important;
          }
          
          .MuiTextField-root {
            margin: 0 !important;
          }
          
          .MuiOutlinedInput-root {
            border: none !important;
            background: transparent !important;
          }
          
          .MuiOutlinedInput-root fieldset {
            border: none !important;
          }
          
          .MuiInputBase-input {
            padding: 0 !important;
            font-size: 10px !important;
            font-weight: normal !important;
            color: inherit !important;
            background: transparent !important;
          }
          
          .financial-section .MuiInputBase-input {
            font-weight: bold !important;
            color: #1976d2 !important;
          }
          
          .header-section {
            text-align: center !important;
            margin-bottom: 8px !important;
          }
          
          .guest-details {
            margin-bottom: 6px !important;
          }
          
          .booking-details {
            margin-bottom: 6px !important;
          }
          
          .policy-section {
            margin-top: 5px !important;
          }
        }
      </style>
    `;
    
    // הוספת הסטיילים לראש הדף
    const head = document.head || document.getElementsByTagName('head')[0];
    const style = document.createElement('style');
    style.innerHTML = printStyles;
    head.appendChild(style);
    
    window.print();
    
    // הסרת הסטיילים אחרי ההדפסה
    setTimeout(() => {
      head.removeChild(style);
    }, 1000);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getLocationName = (location) => {
    switch (location) {
      case 'airport':
        return 'אור יהודה';
      case 'rothschild':
        return 'רוטשילד';
      default:
        return location;
    }
  };

  if (!booking) return null;

  return (
    <Box sx={{ maxWidth: '800px', margin: '0 auto', p: 1 }} className="print-container">
      {/* כפתורי פעולה - לא יודפסו */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          mb: 1,
          '@media print': { display: 'none' }
        }}
      >
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          color="primary"
        >
          הדפס / שמור כ-PDF
        </Button>
        <Button
          variant="outlined"
          startIcon={<CloseIcon />}
          onClick={onClose}
          color="inherit"
        >
          סגור
        </Button>
      </Box>

      {/* תוכן אישור ההזמנה */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 2,
          '@media print': { 
            boxShadow: 'none !important',
            border: 'none !important',
            margin: '0 !important',
            padding: '10px !important',
            width: '100% !important'
          }
        }}
      >
        {/* כותרת */}
        <Box sx={{ textAlign: 'center', mb: 1 }} className="header-section">
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 'bold',
              color: '#1976d2',
              mb: 0.3,
              letterSpacing: '1px',
              fontSize: '1.8rem'
            }}
          >
            DIAM S HOTELS
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#666',
              mb: 0.3,
              fontSize: '0.8rem'
            }}
          >
            {booking.location === 'airport' ? 'אור יהודה' : 'רוטשילד'} | טלפון: 050-6070260 | דוא"ל: diamshotels@gmail.com
          </Typography>
          <Typography 
            variant="h5" 
            component="h2" 
            sx={{ 
              fontWeight: 'bold',
              color: '#333',
              mt: 0.5,
              fontSize: '1.3rem'
            }}
          >
            אישור הזמנה
          </Typography>
        </Box>

        <Divider sx={{ mb: 1 }} />

        {/* פרטי האורח */}
        <Box sx={{ mb: 1 }} className="guest-details">
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5, color: '#666', fontSize: '0.85rem' }}>
            פרטי האורח
          </Typography>
          <Grid container spacing={0.5}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
                שם: {booking.firstName} {booking.lastName}
              </Typography>
            </Grid>
            {booking.email && (
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                  דוא"ל: {booking.email}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Box>

        <Divider sx={{ my: 0.8 }} />

        {/* פרטי ההזמנה */}
        <Box sx={{ mb: 1 }} className="booking-details">
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5, color: '#1976d2', fontSize: '1rem' }}>
            פרטי ההזמנה
          </Typography>
          <Grid container spacing={0.5}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
                מספר הזמנה: {booking.bookingNumber}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                מיקום: {getLocationName(booking.location)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                תאריך כניסה: {formatDate(booking.checkIn)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                תאריך יציאה: {formatDate(booking.checkOut)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                מספר לילות: {booking.nights}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                  מספר חדרים:
                </Typography>
                <TextField
                  type="number"
                  value={editableRooms}
                  onChange={(e) => setEditableRooms(Number(e.target.value))}
                  size="small"
                  inputProps={{ min: 1, style: { textAlign: 'center', width: '40px', fontSize: '0.8rem' } }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      height: '20px',
                      '&:not(.Mui-focused)': {
                        '& fieldset': {
                          borderColor: '#ddd',
                          borderStyle: 'solid'
                        }
                      }
                    }
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                  מספר אורחים:
                </Typography>
                <TextField
                  type="number"
                  value={editableGuests}
                  onChange={(e) => setEditableGuests(Number(e.target.value))}
                  size="small"
                  inputProps={{ min: 1, style: { textAlign: 'center', width: '40px', fontSize: '0.8rem' } }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      height: '20px',
                      '&:not(.Mui-focused)': {
                        '& fieldset': {
                          borderColor: '#ddd',
                          borderStyle: 'solid'
                        }
                      }
                    }
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 0.8 }} />

        {/* סה"כ לתשלום */}
        <Box sx={{ mb: 1, backgroundColor: '#f8f9fa', p: 1.5, borderRadius: 1 }} className="financial-section">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
              מחיר לפני מע"מ:
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
              ₪{(editablePrice / 1.18).toFixed(2)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
              מע"מ (18%):
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
              ₪{(editablePrice - (editablePrice / 1.18)).toFixed(2)}
            </Typography>
          </Box>
          <Divider sx={{ my: 0.5 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
              סה"כ לתשלום:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>₪</Typography>
              <TextField
                type="number"
                value={editablePrice}
                onChange={(e) => setEditablePrice(Number(e.target.value))}
                size="small"
                inputProps={{ min: 0, style: { textAlign: 'center', width: '70px', fontWeight: 'bold', fontSize: '0.9rem' } }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '28px',
                    '&:not(.Mui-focused)': {
                      '& fieldset': {
                        borderColor: '#1976d2',
                        borderStyle: 'solid',
                        borderWidth: '2px'
                      }
                    }
                  },
                  '& .MuiInputBase-input': {
                    color: '#1976d2',
                    fontWeight: 'bold'
                  }
                }}
              />
            </Box>
          </Box>
        </Box>

        {booking.notes && (
          <>
            <Divider sx={{ my: 0.8 }} />
            <Box sx={{ mb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5, color: '#1976d2', fontSize: '1rem' }}>
                הערות
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                {booking.notes}
              </Typography>
            </Box>
          </>
        )}

        <Divider sx={{ my: 0.8 }} />

        {/* מדיניות ופרטים נוספים */}
        <Box sx={{ mb: 0 }} className="policy-section">
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5, color: '#1976d2', fontSize: '1rem' }}>
            מדיניות ופרטים נוספים
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={additionalDetails}
            onChange={(e) => setAdditionalDetails(e.target.value)}
            placeholder="לחץ כאן כדי להוסיף פרטים נוספים..."
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                fontFamily: 'Heebo, Arial, sans-serif',
                fontSize: '0.8rem',
                lineHeight: 1.3,
                '&:not(.Mui-focused)': {
                  '& fieldset': {
                    borderColor: additionalDetails ? '#ddd' : '#ddd',
                    borderStyle: additionalDetails ? 'solid' : 'dashed'
                  }
                }
              }
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default BookingConfirmationView; 