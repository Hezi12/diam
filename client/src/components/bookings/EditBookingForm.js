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
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

// רכיב של חישובי מחירים
import PriceCalculator from './PriceCalculator';

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
  const locationColors = {
    airport: {
      main: '#64d2ff',
      bgLight: 'rgba(100, 210, 255, 0.1)'
    },
    rothschild: {
      main: '#5e5ce6',
      bgLight: 'rgba(94, 92, 230, 0.1)'
    }
  };

  const currentColors = locationColors[location] || locationColors.airport;

  // מצב טופס
  const [formData, setFormData] = useState({
    // פרטי אורח
    guestName: '',
    phone: '',
    email: '',
    
    // פרטי הזמנה
    room: '',
    checkIn: new Date(),
    checkOut: addDays(new Date(), 1),
    nights: 1,
    isTourist: false,
    
    // פרטי מחירים
    totalPrice: 0,
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
        guestName: booking.guestName || '',
        phone: booking.phone || '',
        email: booking.email || '',
        
        room: booking.room?._id || booking.room || '',
        checkIn,
        checkOut,
        nights: booking.nights || differenceInDays(checkOut, checkIn),
        isTourist: booking.isTourist || false,
        
        totalPrice: booking.totalPrice || 0,
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
            totalPrice: price * prev.nights
          }));
        }
      }
    }
  }, [formData.room, formData.isTourist, rooms]);

  // עדכון הלילות בעת שינוי תאריכים
  useEffect(() => {
    if (formData.checkIn && formData.checkOut) {
      const nights = differenceInDays(formData.checkOut, formData.checkIn);
      
      if (nights !== formData.nights) {
        setFormData(prev => ({
          ...prev,
          nights,
          totalPrice: prev.pricePerNight * nights
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
        totalPrice: prev.pricePerNight * nights
      };
    });
    
    // ניקוי שגיאות
    if (errors.nights) {
      setErrors(prev => ({ ...prev, nights: undefined }));
    }
  };

  // טיפול בשינוי תאריך צ'ק-אין
  const handleCheckInChange = (date) => {
    const newCheckIn = date;
    let newCheckOut = formData.checkOut;
    
    // אם תאריך צ'ק-אאוט הוא לפני צ'ק-אין, נעדכן אוטומטית
    if (newCheckIn >= newCheckOut) {
      newCheckOut = addDays(newCheckIn, 1);
    }
    
    // חישוב מספר לילות
    const nights = differenceInDays(newCheckOut, newCheckIn);
    
    setFormData(prev => ({
      ...prev,
      checkIn: newCheckIn,
      checkOut: newCheckOut,
      nights,
      totalPrice: prev.pricePerNight * nights
    }));
    
    // ניקוי שגיאות
    if (errors.checkIn) {
      setErrors(prev => ({ ...prev, checkIn: undefined }));
    }
  };

  // טיפול בשינוי תאריך צ'ק-אאוט
  const handleCheckOutChange = (date) => {
    const newCheckOut = date;
    
    // אם תאריך צ'ק-אאוט הוא לפני צ'ק-אין, לא נאפשר
    if (newCheckOut <= formData.checkIn) {
      return;
    }
    
    // חישוב מספר לילות
    const nights = differenceInDays(newCheckOut, formData.checkIn);
    
    setFormData(prev => ({
      ...prev,
      checkOut: newCheckOut,
      nights,
      totalPrice: prev.pricePerNight * nights
    }));
    
    // ניקוי שגיאות
    if (errors.checkOut) {
      setErrors(prev => ({ ...prev, checkOut: undefined }));
    }
  };

  // טיפול בשינוי סכום תשלום
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

  // בדיקת תקינות טופס
  const validateForm = () => {
    const newErrors = {};
    
    // בדיקת שדות חובה
    if (!formData.guestName.trim()) {
      newErrors.guestName = 'יש להזין שם אורח';
    }
    
    if (!formData.room) {
      newErrors.room = 'יש לבחור חדר';
    }
    
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
      // קריאה לשרת לעדכון ההזמנה
      const response = await axios.put(`/api/bookings/${booking._id}`, {
        ...formData,
        location,
        room: formData.room
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '14px',
          maxHeight: 'calc(100vh - 40px)',
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          bgcolor: currentColors.bgLight, 
          color: currentColors.main,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${currentColors.main}`
        }}
      >
        <Typography variant="h6">
          עריכת הזמנה
        </Typography>
        <Box>
          <IconButton 
            onClick={handleDeleteClick}
            sx={{ color: '#d32f2f', mr: 1 }}
          >
            <DeleteIcon />
          </IconButton>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Grid container spacing={3}>
          {/* כרטיסיית פרטי אורח */}
          <Grid item xs={12}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                border: '1px solid #e0e0e0', 
                borderRadius: '10px',
                mb: 2 
              }}
            >
              <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 2 }}>
                פרטי אורח
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="guestName"
                    label="שם אורח"
                    fullWidth
                    value={formData.guestName}
                    onChange={handleChange}
                    error={!!errors.guestName}
                    helperText={errors.guestName}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    name="phone"
                    label="טלפון"
                    fullWidth
                    value={formData.phone}
                    onChange={handleChange}
                    error={!!errors.phone}
                    helperText={errors.phone}
                    required
                    inputProps={{ dir: "ltr" }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    name="email"
                    label="אימייל"
                    fullWidth
                    value={formData.email}
                    onChange={handleChange}
                    error={!!errors.email}
                    helperText={errors.email}
                    inputProps={{ dir: "ltr" }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="isTourist"
                        checked={formData.isTourist}
                        onChange={handleChange}
                        color="primary"
                      />
                    }
                    label="תייר (ללא מע״מ)"
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          {/* כרטיסיית פרטי הזמנה */}
          <Grid item xs={12}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                border: '1px solid #e0e0e0', 
                borderRadius: '10px',
                mb: 2 
              }}
            >
              <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 2 }}>
                פרטי הזמנה
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={!!errors.room} required>
                    <InputLabel id="room-label">חדר</InputLabel>
                    <Select
                      labelId="room-label"
                      name="room"
                      value={formData.room}
                      onChange={handleChange}
                      label="חדר"
                    >
                      {rooms.map(room => (
                        <MenuItem key={room._id} value={room._id}>
                          חדר {room.roomNumber} - {room.category}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.room && <FormHelperText>{errors.room}</FormHelperText>}
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={!!errors.status}>
                    <InputLabel id="status-label">סטטוס הזמנה</InputLabel>
                    <Select
                      labelId="status-label"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      label="סטטוס הזמנה"
                    >
                      <MenuItem value="pending">ממתינה</MenuItem>
                      <MenuItem value="confirmed">מאושרת</MenuItem>
                      <MenuItem value="checkedIn">צ׳ק-אין</MenuItem>
                      <MenuItem value="checkedOut">צ׳ק-אאוט</MenuItem>
                      <MenuItem value="cancelled">מבוטלת</MenuItem>
                    </Select>
                    {errors.status && <FormHelperText>{errors.status}</FormHelperText>}
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
                    <DatePicker
                      label="צ׳ק-אין"
                      value={formData.checkIn}
                      onChange={handleCheckInChange}
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          fullWidth 
                          required
                          error={!!errors.checkIn}
                          helperText={errors.checkIn}
                        />
                      )}
                    />
                  </LocalizationProvider>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
                    <DatePicker
                      label="צ׳ק-אאוט"
                      value={formData.checkOut}
                      onChange={handleCheckOutChange}
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          fullWidth 
                          required
                          error={!!errors.checkOut}
                          helperText={errors.checkOut}
                        />
                      )}
                    />
                  </LocalizationProvider>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    name="nights"
                    label="מספר לילות"
                    fullWidth
                    type="number"
                    InputProps={{ inputProps: { min: 1 } }}
                    value={formData.nights}
                    onChange={handleNightsChange}
                    error={!!errors.nights}
                    helperText={errors.nights}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          {/* כרטיסיית פרטי מחירים */}
          <Grid item xs={12}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                border: '1px solid #e0e0e0', 
                borderRadius: '10px',
                mb: 2 
              }}
            >
              <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 2 }}>
                פרטי מחירים
              </Typography>
              
              <Grid container spacing={2}>
                <PriceCalculator
                  formData={formData}
                  setFormData={setFormData}
                  lockedField={lockedField}
                  setLockedField={setLockedField}
                  errors={errors}
                  setErrors={setErrors}
                />
                
                <Grid item xs={12} md={6}>
                  <TextField
                    name="discount"
                    label="הנחה (₪)"
                    fullWidth
                    type="number"
                    value={formData.discount}
                    onChange={handleDiscountChange}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                      inputProps: { min: 0, step: "10" }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel id="payment-status-label">סטטוס תשלום</InputLabel>
                    <Select
                      labelId="payment-status-label"
                      name="paymentStatus"
                      value={formData.paymentStatus}
                      onChange={handleChange}
                      label="סטטוס תשלום"
                    >
                      <MenuItem value="unpaid">לא שולם</MenuItem>
                      <MenuItem value="deposit">מקדמה</MenuItem>
                      <MenuItem value="partial">תשלום חלקי</MenuItem>
                      <MenuItem value="paid">שולם</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    name="paymentAmount"
                    label="סכום ששולם (₪)"
                    fullWidth
                    type="number"
                    value={formData.paymentAmount}
                    onChange={handlePaymentAmountChange}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                      inputProps: { min: 0, step: "10" }
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          {/* כרטיסיית הערות */}
          <Grid item xs={12}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                border: '1px solid #e0e0e0', 
                borderRadius: '10px' 
              }}
            >
              <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 2 }}>
                הערות
              </Typography>
              
              <TextField
                name="notes"
                label="הערות"
                fullWidth
                multiline
                rows={3}
                value={formData.notes}
                onChange={handleChange}
              />
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
        <Button onClick={onClose} color="inherit">
          ביטול
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} color="inherit" />}
        >
          שמור שינויים
        </Button>
      </DialogActions>
      
      {/* דיאלוג אישור מחיקה */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          מחיקת הזמנה
        </DialogTitle>
        <DialogContent>
          <Typography>
            האם אתה בטוח שברצונך למחוק את ההזמנה?
            <br />
            פעולה זו אינה ניתנת לביטול.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteConfirmOpen(false)}
            color="inherit"
          >
            ביטול
          </Button>
          <Button
            onClick={handleDeleteBooking}
            color="error"
            variant="contained"
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} color="inherit" />}
          >
            מחק
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default EditBookingForm; 