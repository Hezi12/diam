import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  Typography,
  MenuItem,
  Paper,
  Box,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Alert,
  Checkbox,
  FormControlLabel,
  Divider,
  CircularProgress,
  InputAdornment,
  Switch
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { he } from 'date-fns/locale';
import { addDays, differenceInDays } from 'date-fns';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  CreditCard as CreditCardIcon,
  Hotel as HotelIcon,
  Receipt as ReceiptIcon,
  Comment as CommentIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
} from '@mui/icons-material';
import axios from 'axios';

// רכיב של חישובי מחירים
import PriceCalculator from './PriceCalculator';

// סגנונות אחידים
import { formStyles, paymentStatusStyles } from '../../design-system/styles/ComponentStyles';
import { STYLE_CONSTANTS } from '../../design-system/styles/StyleConstants';

/**
 * טופס לעריכה ומחיקה של הזמנה קיימת
 */
const EditBookingForm = ({
  open,
  onClose,
  onSave,
  onDelete,
  booking,
  rooms,
  location
}) => {
  // הגדרת צבעים לפי מיקום
  const currentColors = STYLE_CONSTANTS.colors[location] || STYLE_CONSTANTS.colors.airport;
  const accentColors = STYLE_CONSTANTS.colors.accent;

  // מצב טופס
  const [formData, setFormData] = useState({
    // פרטי אורח
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    
    // פרטי הזמנה
    room: '',
    checkIn: new Date(),
    checkOut: addDays(new Date(), 1),
    nights: 1,
    isTourist: false,
    
    // פרטי מחירים
    price: 0,
    pricePerNight: 0,
    pricePerNightNoVat: 0,
    
    // פרטי תשלום
    paymentStatus: 'unpaid',
    paymentAmount: 0,
    discount: 0,
    
    // סטטוס הזמנה ופרטים נוספים
    status: 'pending',
    notes: '',
  });

  // מצב שדות תיקוף
  const [errors, setErrors] = useState({});
  
  // מצבים נוספים
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // המצב של נעילת שדה מחיר לחישוב
  const [lockedField, setLockedField] = useState(null);

  // עדכון הטופס בעת טעינת ההזמנה
  useEffect(() => {
    if (booking) {
      const checkIn = new Date(booking.checkIn);
      const checkOut = new Date(booking.checkOut);
      
      setFormData({
        firstName: booking.firstName || '',
        lastName: booking.lastName || '',
        phone: booking.phone || '',
        email: booking.email || '',
        
        room: booking.room?._id || booking.room || '',
        checkIn,
        checkOut,
        nights: booking.nights || differenceInDays(checkOut, checkIn),
        isTourist: booking.isTourist || false,
        
        price: booking.price || 0,
        pricePerNight: booking.pricePerNight || 0,
        pricePerNightNoVat: booking.pricePerNightNoVat || 0,
        
        paymentStatus: booking.paymentStatus || 'unpaid',
        paymentAmount: booking.paymentAmount || 0,
        discount: booking.discount || 0,
        
        status: booking.status || 'pending',
        notes: booking.notes || '',
      });
    }
  }, [booking]);

  // טעינת מחיר ברירת המחדל של החדר בעת בחירת חדר
  useEffect(() => {
    if (formData.room) {
      const selectedRoom = rooms.find(room => room._id === formData.room);
      if (selectedRoom) {
        let price = formData.isTourist ? selectedRoom.basePrice : selectedRoom.vatPrice;
        let priceNoVat = selectedRoom.basePrice;
        
        // רק אם לא מדובר בטעינה ראשונית של הזמנה קיימת (שיש לה כבר מחיר)
        if (!booking || formData.pricePerNight === 0) {
          setFormData(prev => ({
            ...prev,
            pricePerNight: price,
            pricePerNightNoVat: priceNoVat,
            price: price * prev.nights
          }));
        }
      }
    }
  }, [formData.room, formData.isTourist, rooms, booking]);

  // עדכון הלילות בעת שינוי תאריכים
  useEffect(() => {
    if (formData.checkIn && formData.checkOut) {
      const nights = Math.max(1, differenceInDays(formData.checkOut, formData.checkIn));
      
      if (nights !== formData.nights) {
        setFormData(prev => ({
          ...prev,
          nights,
          price: prev.pricePerNight * nights
        }));
      }
    }
  }, [formData.checkIn, formData.checkOut]);

  // טיפול בשינוי שדות כלליים
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // ניקוי שגיאות
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // טיפול בשינוי מספר לילות
  const handleNightsChange = (e) => {
    const nights = Math.max(1, parseInt(e.target.value) || 0);
    
    setFormData(prev => {
      // אם מספר הלילות משתנה, מעדכנים גם את תאריך הצ'ק-אאוט
      const newCheckOut = nights === prev.nights 
        ? prev.checkOut 
        : addDays(prev.checkIn, nights);
      
      return {
        ...prev,
        nights,
        checkOut: newCheckOut,
        price: prev.pricePerNight * nights
      };
    });
  };

  // טיפול בשינוי תאריך צ'ק-אין
  const handleCheckInChange = (date) => {
    setFormData(prev => {
      // חישוב תאריך צ'ק-אאוט חדש לפי מספר הלילות
      const newCheckOut = addDays(date, prev.nights);
      
      return {
        ...prev,
        checkIn: date,
        checkOut: newCheckOut
      };
    });
  };

  // טיפול בשינוי תאריך צ'ק-אאוט
  const handleCheckOutChange = (date) => {
    setFormData(prev => {
      // חישוב מספר לילות חדש
      const newNights = Math.max(1, differenceInDays(date, prev.checkIn));
      
      return {
        ...prev,
        checkOut: date,
        nights: newNights,
        price: prev.pricePerNight * newNights
      };
    });
  };

  // טיפול בשינוי סכום ששולם
  const handlePaymentAmountChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    setFormData(prev => ({
      ...prev,
      paymentAmount: value
    }));
  };

  // טיפול בשינוי הנחה
  const handleDiscountChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    setFormData(prev => ({
      ...prev,
      discount: value
    }));
  };

  // פתיחת WhatsApp עם המספר שהוזן
  const openWhatsApp = () => {
    if (formData.phone) {
      // מספר טלפון - להסיר מקפים, רווחים וכו'
      const phoneNumber = formData.phone.replace(/[\s-]/g, '');
      // אם המספר לא מתחיל ב-+972 או 05, נוסיף 972
      const formattedNumber = phoneNumber.startsWith('+972') ? 
        phoneNumber : 
        phoneNumber.startsWith('05') ? 
          `+972${phoneNumber.substring(1)}` : 
          `+972${phoneNumber}`;
      
      window.open(`https://wa.me/${formattedNumber}`, '_blank');
    }
  };

  // תיקוף הטופס
  const validateForm = () => {
    const newErrors = {};
    
    // בדיקה שחדר נבחר
    if (!formData.room) {
      newErrors.room = 'יש לבחור חדר';
    }
    
    // בדיקה ששם מלא הוכנס
    if (!formData.firstName) {
      newErrors.firstName = 'יש להזין שם פרטי';
    }
    
    // בדיקת תאריכים
    if (!formData.checkIn) {
      newErrors.checkIn = 'יש לבחור תאריך צ׳ק-אין';
    }
    
    if (!formData.checkOut) {
      newErrors.checkOut = 'יש לבחור תאריך צ׳ק-אאוט';
    }
    
    // בדיקה שמחיר לא ריק
    if (formData.pricePerNight <= 0) {
      newErrors.pricePerNight = 'יש להזין מחיר תקין';
    }
    
    // בדיקת תקינות טלפון (ללא מספרים בלבד) אם הוזן
    if (formData.phone && !/^\+?\d+$/.test(formData.phone)) {
      newErrors.phone = 'יש להזין מספר טלפון תקין';
    }
    
    // בדיקת תקינות אימייל אם הוזן
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'יש להזין כתובת אימייל תקינה';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // טיפול בשמירת הטופס
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // טיפול בשם משפחה ריק
      const updatedFormData = {
        ...formData,
        lastName: formData.lastName || "-"
      };
      
      // פירוק תאריכי צ'ק-אין וצ'ק-אאוט ויצירת תאריכים ב-UTC ללא רכיב שעות
      const checkInOriginal = new Date(formData.checkIn);
      const checkOutOriginal = new Date(formData.checkOut);
      
      // יצירת תאריכים בפורמט UTC ללא שעות
      const checkInDate = new Date(Date.UTC(
        checkInOriginal.getFullYear(),
        checkInOriginal.getMonth(),
        checkInOriginal.getDate()
      ));
      
      const checkOutDate = new Date(Date.UTC(
        checkOutOriginal.getFullYear(),
        checkOutOriginal.getMonth(),
        checkOutOriginal.getDate()
      ));
      
      console.log('תאריכי הזמנה לעדכון:', {
        checkIn: checkInDate.toISOString(),
        checkOut: checkOutDate.toISOString()
      });
      
      // קריאה לשרת לעדכון ההזמנה
      const response = await axios.put(`/api/bookings/${booking._id}`, {
        ...updatedFormData,
        location,
        room: formData.room,
        checkIn: checkInDate,
        checkOut: checkOutDate
      });
      
      // סגירת הטופס
      onSave(response.data);
      
    } catch (err) {
      console.error('שגיאה בעדכון ההזמנה:', err);
      setError(err.response?.data?.message || 'שגיאה בעדכון ההזמנה');
      setLoading(false);
    }
  };

  // פתיחת אישור מחיקה
  const handleDeleteClick = () => {
    setDeleteConfirmOpen(true);
  };

  // טיפול במחיקת הזמנה
  const handleDeleteBooking = async () => {
    setLoading(true);
    setError('');
    
    try {
      // קריאה לשרת למחיקת ההזמנה
      await axios.delete(`/api/bookings/${booking._id}`);
      
      // סגירת הטופס
      onDelete(booking._id);
      
    } catch (err) {
      console.error('שגיאה במחיקת ההזמנה:', err);
      setError(err.response?.data?.message || 'שגיאה במחיקת ההזמנה');
      setLoading(false);
    }
  };

  // הגדרה האם תשלום
  const isPaidStatus = [
    'cash', 'credit_or_yehuda', 'credit_rothschild', 'transfer_mizrahi', 
    'bit_mizrahi', 'paybox_mizrahi', 'transfer_poalim', 'bit_poalim', 
    'paybox_poalim', 'other'
  ].includes(formData.paymentStatus);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          ...formStyles.dialog,
          maxHeight: 'calc(100vh - 40px)',
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          ...formStyles.formHeader(location)
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
            עריכת הזמנה {booking?.bookingNumber ? `${booking.bookingNumber}` : ''} - {location === 'airport' ? 'אור יהודה' : 'רוטשילד'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FormControl sx={{ minWidth: 170, mr: 1 }} size="small">
            <InputLabel>סטטוס תשלום</InputLabel>
            <Select
              name="paymentStatus"
              value={formData.paymentStatus}
              onChange={handleChange}
              label="סטטוס תשלום"
              size="small"
              sx={{
                '& .MuiSelect-select': {
                  paddingRight: '20px'
                },
                bgcolor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: '0 3px 6px rgba(0,0,0,0.1)'
                },
                ...(formData.paymentStatus === 'unpaid' ? paymentStatusStyles.unpaid : {}),
                ...(isPaidStatus ? paymentStatusStyles.paid : {})
              }}
            >
              <MenuItem value="unpaid">לא שולם</MenuItem>
              <MenuItem value="cash">מזומן</MenuItem>
              <MenuItem value="credit_or_yehuda">אשראי אור יהודה</MenuItem>
              <MenuItem value="credit_rothschild">אשראי רוטשילד</MenuItem>
              <MenuItem value="transfer_mizrahi">העברה מזרחי</MenuItem>
              <MenuItem value="bit_mizrahi">ביט מזרחי</MenuItem>
              <MenuItem value="paybox_mizrahi">פייבוקס מזרחי</MenuItem>
              <MenuItem value="transfer_poalim">העברה פועלים</MenuItem>
              <MenuItem value="bit_poalim">ביט פועלים</MenuItem>
              <MenuItem value="paybox_poalim">פייבוקס פועלים</MenuItem>
              <MenuItem value="other">אחר</MenuItem>
            </Select>
          </FormControl>

          <IconButton 
            onClick={handleDeleteClick}
            sx={{ color: accentColors.red, mr: 1 }}
          >
            <DeleteIcon />
          </IconButton>
          <IconButton onClick={onClose} size="small" sx={{ marginRight: 0, color: accentColors.red }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3, mt: 2 }}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
          {error && (
            <Box sx={{ mb: 2 }}>
              <Paper sx={{ 
                p: 2, 
                bgcolor: '#ffebee', 
                borderRadius: STYLE_CONSTANTS.card.borderRadius,
                color: accentColors.red
              }}>
                <Typography>{error}</Typography>
              </Paper>
            </Box>
          )}
          <Grid container spacing={3}>
            {/* חלק 1: פרטי אורח */}
            <Grid item xs={12} md={7}>
              <Paper sx={{ 
                p: 3, 
                borderRadius: STYLE_CONSTANTS.card.borderRadius,
                boxShadow: STYLE_CONSTANTS.card.boxShadow,
                borderTop: `3px solid ${currentColors.main}`
              }}>
                <Box sx={formStyles.sectionTitle}>
                  <PersonIcon sx={{ color: currentColors.main, ...formStyles.formIcon }} />
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    פרטי אורח
                  </Typography>
                </Box>
              
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="שם פרטי"
                      fullWidth
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      required
                      size="small"
                      name="firstName"
                      error={!!errors.firstName}
                      helperText={errors.firstName}
                      inputProps={{
                        style: { 
                          textAlign: 'center',
                          paddingRight: '24px',
                          paddingLeft: '24px',
                          direction: 'rtl',
                        }
                      }}
                      sx={formStyles.textField}
                    />
                  </Grid>
                
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="שם משפחה"
                      fullWidth
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      size="small"
                      name="lastName"
                      error={!!errors.lastName}
                      helperText={errors.lastName}
                      inputProps={{
                        style: { 
                          textAlign: 'center',
                          paddingRight: '24px',
                          paddingLeft: '24px',
                          direction: 'rtl',
                        }
                      }}
                      sx={formStyles.textField}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="טלפון"
                      fullWidth
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      size="small"
                      name="phone"
                      error={!!errors.phone}
                      helperText={errors.phone}
                      inputProps={{
                        style: { 
                          textAlign: 'center',
                          paddingRight: '24px',
                          paddingLeft: '24px',
                          direction: 'rtl',
                        }
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon fontSize="small" sx={{ marginLeft: '8px' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton 
                              onClick={openWhatsApp}
                              disabled={!formData.phone} 
                              size="small"
                              sx={{ color: '#25D366' }}
                            >
                              <WhatsAppIcon fontSize="small" />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={formStyles.textField}
                    />
                  </Grid>
                
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="אימייל"
                      fullWidth
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      size="small"
                      name="email"
                      error={!!errors.email}
                      helperText={errors.email}
                      inputProps={{
                        style: { 
                          textAlign: 'center',
                          paddingRight: '24px',
                          paddingLeft: '24px',
                          direction: 'rtl',
                        }
                      }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><EmailIcon fontSize="small" sx={{ marginLeft: '8px' }} /></InputAdornment>,
                      }}
                      sx={formStyles.textField}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            
            {/* חלק 2: מחיר ותשלום */}
            <Grid item xs={12} md={5}>
              <Paper sx={{ 
                p: 3, 
                borderRadius: STYLE_CONSTANTS.card.borderRadius,
                boxShadow: STYLE_CONSTANTS.card.boxShadow,
                borderTop: `3px solid ${accentColors.red}`
              }}>
                <Box sx={formStyles.sectionTitle}>
                  <ReceiptIcon sx={{ color: accentColors.red, ...formStyles.formIcon }} />
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    מחיר ותשלום
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={formData.isTourist}
                        onChange={(e) => setFormData({...formData, isTourist: e.target.checked})}
                        name="isTourist"
                        color="primary"
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: accentColors.red,
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: accentColors.red,
                          },
                        }}
                      />
                    }
                    label="תייר (ללא מע״מ)"
                    labelPlacement="start"
                    sx={{ marginRight: 3, marginLeft: 'auto', justifyContent: 'flex-end' }}
                  />
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <PriceCalculator
                      pricePerNight={formData.pricePerNight}
                      pricePerNightNoVat={formData.pricePerNightNoVat}
                      nights={formData.nights}
                      totalPrice={formData.price}
                      isTourist={formData.isTourist}
                      setFormData={setFormData}
                      lockedField={lockedField}
                      setLockedField={setLockedField}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            
            {/* חלק 3: פרטי הזמנה */}
            <Grid item xs={12}>
              <Paper sx={{ 
                p: 3, 
                borderRadius: STYLE_CONSTANTS.card.borderRadius,
                boxShadow: STYLE_CONSTANTS.card.boxShadow,
                borderTop: `3px solid ${accentColors.green}`
              }}>
                <Box sx={formStyles.sectionTitle}>
                  <HotelIcon sx={{ color: accentColors.green, ...formStyles.formIcon }} />
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    פרטי הזמנה
                  </Typography>
                </Box>
              
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl 
                      fullWidth 
                      error={!!errors.room} 
                      required 
                      size="small"
                      sx={formStyles.select}
                    >
                      <InputLabel>חדר</InputLabel>
                      <Select
                        name="room"
                        value={formData.room}
                        onChange={handleChange}
                        label="חדר"
                      >
                        {rooms.map(room => (
                          <MenuItem key={room._id} value={room._id}>
                            {room.roomNumber} - {room.category}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.room && <FormHelperText>{errors.room}</FormHelperText>}
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <DatePicker
                      label="צ׳ק-אין"
                      value={formData.checkIn}
                      onChange={handleCheckInChange}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true,
                          size: "small",
                          error: !!errors.checkIn,
                          helperText: errors.checkIn,
                          sx: formStyles.textField
                        }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <DatePicker
                      label="צ׳ק-אאוט"
                      value={formData.checkOut}
                      onChange={handleCheckOutChange}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true,
                          size: "small",
                          error: !!errors.checkOut,
                          helperText: errors.checkOut,
                          sx: formStyles.textField
                        }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="מספר לילות"
                      type="number"
                      fullWidth
                      value={formData.nights}
                      onChange={handleNightsChange}
                      InputProps={{
                        inputProps: { min: 1 }
                      }}
                      size="small"
                      sx={formStyles.textField}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="הערות"
                      fullWidth
                      multiline
                      rows={4}
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      name="notes"
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start" sx={{ alignSelf: 'flex-start', marginTop: '16px' }}>
                            <CommentIcon fontSize="small" sx={{ marginLeft: '8px' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        ...formStyles.textField,
                        '& .MuiInputBase-multiline': {
                          paddingRight: '14px',
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </LocalizationProvider>
      </DialogContent>
      
      <DialogActions sx={formStyles.dialogActions}>
        <Button 
          onClick={onClose}
          color="inherit"
          sx={{ ...formStyles.button, color: '#666' }}
        >
          ביטול
        </Button>
        <Box>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{ ...formStyles.button, bgcolor: currentColors.main }}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {loading ? 'שומר...' : 'שמירת הזמנה'}
          </Button>
        </Box>
      </DialogActions>
      
      {/* דיאלוג אישור מחיקה */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>אישור מחיקת הזמנה</DialogTitle>
        <DialogContent>
          <Typography>
            האם אתה בטוח שברצונך למחוק את ההזמנה? פעולה זו לא ניתנת לביטול.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="primary">
            ביטול
          </Button>
          <Button onClick={handleDeleteBooking} color="error" variant="contained">
            {loading ? <CircularProgress size={20} color="inherit" /> : 'מחיקה'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default EditBookingForm; 