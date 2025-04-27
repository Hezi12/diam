import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  FormHelperText,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { ReceiptOutlined as ReceiptIcon } from '@mui/icons-material';
import axios from 'axios';
import moment from 'moment';
import { useLocation, useSearchParams } from 'react-router-dom';

/**
 * דיאלוג להוספת חשבונית חדשה
 */
const CreateInvoiceDialog = ({
  open,
  onClose,
  onSuccess,
  bookingId = null, // מזהה הזמנה אם יוצרים חשבונית מהזמנה
  location // מיקום (אור יהודה/רוטשילד)
}) => {
  // קבלת פרמטרים מה-URL
  const { state } = useLocation();
  const [searchParams] = useSearchParams();
  const urlBookingId = searchParams.get('bookingId') || state?.bookingId || bookingId;
  
  // הוספת לוג לדיבאג
  useEffect(() => {
    console.log('CreateInvoiceDialog - פרמטרים:', { 
      urlBookingId, 
      searchParamsBookingId: searchParams.get('bookingId'),
      stateBookingId: state?.bookingId,
      propsBookingId: bookingId,
      location 
    });
  }, [urlBookingId, searchParams, state, bookingId, location]);

  // מצב טופס יצירת החשבונית
  const [formData, setFormData] = useState({
    booking: '',
    customer: {
      name: '',
      idNumber: '',
      address: '',
      passportNumber: '',
      phone: '',
      email: ''
    },
    isTourist: false,
    paymentDetails: {
      paymentMethod: 'cash',
      subtotal: 0,
      vatAmount: 0,
      discount: 0,
      total: 0
    },
    notes: ''
  });

  // מצב טעינת נתונים
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // מצב שגיאות טופס
  const [formErrors, setFormErrors] = useState({});

  // מצב רשימת הזמנות זמינות
  const [availableBookings, setAvailableBookings] = useState([]);

  // טעינת הזמנות זמינות
  const fetchAvailableBookings = useCallback(async () => {
    try {
      setBookingLoading(true);
      // שינוי נתיב ה-API והפרמטרים כדי להתאים לשרת
      const response = await axios.get('/api/bookings', {
        params: {
          location: location
        }
      });
      
      // התאמת הטיפול בתשובה למבנה שמוחזר מהשרת
      if (response.data && Array.isArray(response.data)) {
        console.log('הזמנות התקבלו בהצלחה:', response.data.length);
        setAvailableBookings(response.data);
      } else {
        console.warn('המידע שהתקבל אינו מערך תקין:', response.data);
        setAvailableBookings([]); // מערך ריק אם אין נתונים תקינים
      }
    } catch (err) {
      console.error('שגיאה בטעינת הזמנות:', err);
      setError('אירעה שגיאה בטעינת ההזמנות. אנא נסה שנית.');
      setAvailableBookings([]); // מערך ריק במקרה של שגיאה
    } finally {
      setBookingLoading(false);
    }
  }, [location]);

  // המרת סטטוס תשלום של הזמנה לאמצעי תשלום לחשבונית
  const mapBookingPaymentToInvoicePayment = useCallback((bookingPaymentStatus) => {
    const paymentMap = {
      'cash': 'cash',
      'credit_or_yehuda': 'credit_card',
      'credit_rothschild': 'credit_card',
      'transfer_mizrahi': 'bank_transfer',
      'transfer_poalim': 'bank_transfer',
      'bit_mizrahi': 'bit',
      'bit_poalim': 'bit',
      'paybox_mizrahi': 'paybox',
      'paybox_poalim': 'paybox',
      'other': 'other'
    };

    return paymentMap[bookingPaymentStatus] || 'other';
  }, []);

  // טעינת פרטי הזמנה
  const fetchBookingDetails = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/bookings/single/${id}`);
      const booking = response.data;

      // חישוב ערכים פיננסיים
      const subtotal = booking.isTourist
        ? booking.price
        : Math.round((booking.price / 1.17) * 100) / 100;
      const vatAmount = booking.isTourist
        ? 0
        : Math.round((booking.price - subtotal) * 100) / 100;

      // עדכון טופס החשבונית
      setFormData({
        booking: id,
        customer: {
          name: `${booking.firstName} ${booking.lastName}`,
          idNumber: '',
          address: '',
          passportNumber: booking.isTourist ? 'תייר' : '',
          phone: booking.phone || '',
          email: booking.email || ''
        },
        isTourist: booking.isTourist || false,
        paymentDetails: {
          paymentMethod: mapBookingPaymentToInvoicePayment(booking.paymentStatus),
          subtotal,
          vatAmount,
          discount: booking.discount || 0,
          total: booking.price
        },
        notes: ''
      });
    } catch (err) {
      console.error('שגיאה בטעינת פרטי הזמנה:', err);
      setError('אירעה שגיאה בטעינת פרטי ההזמנה. אנא נסה שנית.');
    } finally {
      setLoading(false);
    }
  }, [mapBookingPaymentToInvoicePayment]);

  // טעינת נתונים ראשונית
  useEffect(() => {
    if (open) {
      fetchAvailableBookings();

      // אם התקבל מזהה הזמנה, טען את פרטיה
      if (urlBookingId) {
        fetchBookingDetails(urlBookingId);
      } else {
        // איפוס הטופס אם אין הזמנה
        setFormData({
          booking: '',
          customer: {
            name: '',
            idNumber: '',
            address: '',
            passportNumber: '',
            phone: '',
            email: ''
          },
          isTourist: false,
          paymentDetails: {
            paymentMethod: 'cash',
            subtotal: 0,
            vatAmount: 0,
            discount: 0,
            total: 0
          },
          notes: ''
        });
      }

      setError('');
      setSuccess(false);
    }
  }, [open, urlBookingId, location, fetchAvailableBookings, fetchBookingDetails]);

  // טיפול בשינוי הזמנה
  const handleBookingChange = (e) => {
    const bookingId = e.target.value;
    
    // ניקוי שגיאת בחירת הזמנה אם נבחרה הזמנה
    if (bookingId && formErrors.booking) {
      setFormErrors(prev => {
        const updatedErrors = { ...prev };
        delete updatedErrors.booking;
        return updatedErrors;
      });
    }
    
    if (bookingId) {
      fetchBookingDetails(bookingId);
    } else {
      // איפוס הטופס אם לא נבחרה הזמנה
      setFormData({
        booking: '',
        customer: {
          name: '',
          idNumber: '',
          address: '',
          passportNumber: '',
          phone: '',
          email: ''
        },
        isTourist: false,
        paymentDetails: {
          paymentMethod: 'cash',
          subtotal: 0,
          vatAmount: 0,
          discount: 0,
          total: 0
        },
        notes: ''
      });
    }
  };

  // טיפול בשינוי פרטי לקוח
  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      customer: {
        ...formData.customer,
        [name]: value
      }
    });
    
    // ניקוי שגיאות כאשר המשתמש מתקן ערכים
    if (name === 'name' && value && formErrors.customerName) {
      setFormErrors(prev => {
        const updatedErrors = { ...prev };
        delete updatedErrors.customerName;
        return updatedErrors;
      });
    } else if (name === 'idNumber' && value && formErrors.idNumber) {
      setFormErrors(prev => {
        const updatedErrors = { ...prev };
        delete updatedErrors.idNumber;
        return updatedErrors;
      });
    } else if (name === 'passportNumber' && value && formErrors.passportNumber) {
      setFormErrors(prev => {
        const updatedErrors = { ...prev };
        delete updatedErrors.passportNumber;
        return updatedErrors;
      });
    }
  };

  // טיפול בשינוי פרטי תשלום
  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    const numberValue = name === 'paymentMethod' ? value : parseFloat(value) || 0;
    
    if (name === 'total') {
      // כאשר משתמש משנה את הסכום הכולל, עדכן גם את הסכום לפני מע"מ וסכום המע"מ
      const total = numberValue;
      let subtotal, vatAmount;
      
      if (formData.isTourist) {
        // תייר - ללא מע"מ
        subtotal = total;
        vatAmount = 0;
      } else {
        // ישראלי - כולל מע"מ (17%)
        subtotal = Math.round((total / 1.17) * 100) / 100; // עיגול ל-2 ספרות אחרי הנקודה
        vatAmount = Math.round((total - subtotal) * 100) / 100; // עיגול ל-2 ספרות אחרי הנקודה
      }
      
      setFormData({
        ...formData,
        paymentDetails: {
          ...formData.paymentDetails,
          [name]: numberValue,
          subtotal,
          vatAmount
        }
      });
    } else {
      // טיפול בשינויים של שדות אחרים
      setFormData({
        ...formData,
        paymentDetails: {
          ...formData.paymentDetails,
          [name]: numberValue
        }
      });
    }
    
    // אם יש שגיאה בסכום, נקה אותה כאשר המשתמש משנה ערך
    if (name === 'total' && numberValue > 0 && formErrors.total) {
      setFormErrors(prev => {
        const updatedErrors = { ...prev };
        delete updatedErrors.total;
        return updatedErrors;
      });
    }
  };

  // טיפול בשינוי בשדה רגיל
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'isTourist') {
      // עדכון ערך "תייר" וחישוב מחדש של מע"מ
      const isTourist = checked;
      
      // חישוב פיננסי מחדש
      const currentTotal = formData.paymentDetails.total || 0;
      let newSubtotal, newVatAmount;
      
      if (isTourist) {
        // תייר - ללא מע"מ
        newSubtotal = currentTotal;
        newVatAmount = 0;
      } else {
        // ישראלי - כולל מע"מ
        newSubtotal = Math.round((currentTotal / 1.17) * 100) / 100;
        newVatAmount = Math.round((currentTotal - newSubtotal) * 100) / 100;
      }
      
      // עדכון הטופס עם הערכים החדשים
      setFormData({
        ...formData,
        isTourist,
        paymentDetails: {
          ...formData.paymentDetails,
          subtotal: newSubtotal,
          vatAmount: newVatAmount,
          vatRate: isTourist ? 0 : 17
        }
      });
      
      // ניקוי שגיאות רלוונטיות
      setFormErrors(prev => {
        const updatedErrors = { ...prev };
        // להסיר שגיאת מספר זהות אם זה תייר
        if (isTourist && updatedErrors.idNumber) {
          delete updatedErrors.idNumber;
        }
        // להסיר שגיאת דרכון אם זה לא תייר
        if (!isTourist && updatedErrors.passportNumber) {
          delete updatedErrors.passportNumber;
        }
        return updatedErrors;
      });
    } else {
      // טיפול רגיל בשינויים אחרים
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  // בדיקת תקינות הטופס
  const validateForm = () => {
    console.log('נתוני טופס לבדיקה:', formData);
    const errors = {};
    
    if (!formData.booking) {
      errors.booking = 'יש לבחור הזמנה';
    }
    
    if (!formData.customer.name) {
      errors.customerName = 'יש להזין שם לקוח';
    }
    
    if (!formData.isTourist && !formData.customer.idNumber) {
      errors.idNumber = 'יש להזין מספר זהות';
    }
    
    if (formData.isTourist && !formData.customer.passportNumber) {
      errors.passportNumber = 'יש להזין מספר דרכון';
    }
    
    if (!formData.paymentDetails.total || formData.paymentDetails.total <= 0) {
      errors.total = 'יש להזין סכום גדול מאפס';
    }
    
    console.log('שגיאות שנמצאו:', errors);
    setFormErrors(errors);
    const isValid = Object.keys(errors).length === 0;
    console.log('תקינות הטופס:', isValid);
    return { isValid, errors };
  };

  // טיפול בשליחת הטופס
  const handleSubmit = async (e) => {
    console.log('handleSubmit נקרא');
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    // איפוס שגיאות קודמות
    setError('');
    
    try {
      setLoading(true);
      setSubmitting(true);
      
      // בדיקת תקינות
      const { isValid, errors } = validateForm();
      console.log('הטופס תקין?', isValid, 'שגיאות:', errors);
      
      if (!isValid) {
        console.log('הטופס לא תקין:', errors);
        setLoading(false);
        setSubmitting(false);
        // עדכון מיידי של השגיאות
        setFormErrors(errors);
        return;
      }
      
      console.log('שולח נתונים:', formData);
      
      // טעינת פרטי ההזמנה לחישוב פרטי השירות
      try {
        console.log('מנסה לטעון פרטי הזמנה:', formData.booking);
        const bookingResponse = await axios.get(`/api/bookings/single/${formData.booking}`);
        const booking = bookingResponse.data;
        console.log('פרטי הזמנה שנטענו:', booking);
        
        // יצירת אובייקט החשבונית המלא עם כל השדות הנדרשים
        const completeInvoiceData = {
          booking: formData.booking,
          location: location,
          isTourist: formData.isTourist,
          customer: {
            name: formData.customer.name || 'לקוח',
            idNumber: formData.customer.idNumber || '',
            address: formData.customer.address || '',
            phone: formData.customer.phone || '',
            email: formData.customer.email || '',
            passportNumber: formData.customer.passportNumber || ''
          },
          serviceDetails: {
            description: `לינה ${location === 'airport' ? 'באור יהודה' : 'ברוטשילד'}`,
            fromDate: booking.checkIn,
            toDate: booking.checkOut,
            nights: booking.nights || 1,
            roomNumber: booking.roomNumber || '101'
          },
          paymentDetails: {
            subtotal: formData.paymentDetails.subtotal || booking.price / 1.17,
            vatRate: formData.isTourist ? 0 : 17,
            vatAmount: formData.isTourist ? 0 : (booking.price - (booking.price / 1.17)),
            discount: formData.paymentDetails.discount || booking.discount || 0,
            total: formData.paymentDetails.total || booking.price,
            paymentMethod: formData.paymentDetails.paymentMethod || 'cash'
          },
          notes: formData.notes || ''
        };
        
        console.log('שולח אובייקט מלא לשרת:', completeInvoiceData);
        
        // שליחת החשבונית ליצירה
        try {
          console.log('מנסה לשלוח בקשת POST ל-/api/invoices');
          const response = await axios.post('/api/invoices', completeInvoiceData);
          console.log('תשובה מהשרת:', response.data);
          
          // בהצלחה
          setSuccess(true);
          
          // מחיקת הטופס
          resetForm();
          
          // העברת החשבונית שנוצרה
          if (onSuccess) {
            // תמיכה בתבניות שונות של תגובה
            const invoice = response.data?.data || response.data || {}; 
            onSuccess(invoice);
          }
          
          // סגירה אחרי עיכוב קצר
          setTimeout(() => {
            onClose();
            setSuccess(false);
          }, 2000);
        } catch (apiError) {
          console.error('שגיאה בשליחת בקשת POST ל-/api/invoices:', apiError);
          console.error('פרטי השגיאה:', apiError.response?.data || apiError.message);
          setError(`שגיאה ביצירת החשבונית: ${apiError.response?.data?.message || apiError.message}`);
          setLoading(false);
          setSubmitting(false);
        }
      } catch (bookingError) {
        console.error('שגיאה בטעינת פרטי הזמנה:', bookingError);
        setError('שגיאה בטעינת פרטי ההזמנה. אנא נסה שנית.');
        setLoading(false);
        setSubmitting(false);
      }
      
    } catch (error) {
      console.error('שגיאה ביצירת חשבונית:', error);
      const errorMsg = error.response?.data?.message || error.message || 'אירעה שגיאה ביצירת החשבונית. אנא נסה שנית.';
      console.error('פירוט השגיאה:', errorMsg);
      setError(errorMsg);
      setLoading(false);
      setSubmitting(false);
    }
  };

  // איפוס הטופס
  const resetForm = () => {
    setFormData({
      booking: '',
      customer: {
        name: '',
        idNumber: '',
        address: '',
        passportNumber: '',
        phone: '',
        email: ''
      },
      isTourist: false,
      paymentDetails: {
        paymentMethod: 'cash',
        subtotal: 0,
        vatAmount: 0,
        discount: 0,
        total: 0
      },
      notes: ''
    });
    setFormErrors({});
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '8px'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'primary.light', color: 'white' }}>
        <ReceiptIcon />
        <Typography sx={{ fontWeight: 500 }}>יצירת חשבונית חדשה</Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 3, mt: 1 }}>
        {/* תצוגת שגיאות */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {Object.keys(formErrors).length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2">יש לתקן את השגיאות הבאות:</Typography>
            <List dense>
              {Object.entries(formErrors).map(([key, value]) => (
                <ListItem key={key}>
                  <ListItemText primary={value} />
                </ListItem>
              ))}
            </List>
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            החשבונית נוצרה בהצלחה!
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* בחירת הזמנה */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, borderRadius: '8px', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
                פרטי הזמנה
              </Typography>

              <FormControl 
                fullWidth 
                margin="normal" 
                error={!!formErrors.booking}
              >
                <InputLabel id="booking-select-label">בחר הזמנה</InputLabel>
                <Select
                  labelId="booking-select-label"
                  value={formData.booking || ''}
                  onChange={handleBookingChange}
                  disabled={loading || submitting}
                  label="בחר הזמנה"
                >
                  <MenuItem value=""><em>בחר הזמנה</em></MenuItem>
                  {availableBookings.map((booking) => (
                    <MenuItem key={booking._id} value={booking._id}>
                      {booking.customerName || 'לקוח'} - חדר {booking.roomNumber} ({new Date(booking.checkIn).toLocaleDateString('he-IL')} עד {new Date(booking.checkOut).toLocaleDateString('he-IL')})
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.booking && (
                  <FormHelperText error>{formErrors.booking}</FormHelperText>
                )}
              </FormControl>

              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              )}
            </Paper>
          </Grid>

          {/* פרטי לקוח */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, borderRadius: '8px', height: '100%' }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
                פרטי לקוח
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth error={!!formErrors.customerName}>
                    <TextField
                      name="name"
                      label="שם מלא"
                      value={formData.customer.name}
                      onChange={handleCustomerChange}
                      fullWidth
                      size="small"
                      required
                      error={!!formErrors.customerName}
                      helperText={formErrors.customerName}
                    />
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.isTourist}
                        onChange={handleChange}
                        name="isTourist"
                        color="primary"
                      />
                    }
                    label="תייר (פטור ממע״מ)"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth error={!!formErrors.idNumber}>
                    <TextField
                      name="idNumber"
                      label="מספר זהות"
                      value={formData.customer.idNumber}
                      onChange={handleCustomerChange}
                      fullWidth
                      size="small"
                      disabled={formData.isTourist}
                      error={!!formErrors.idNumber}
                      helperText={formErrors.idNumber}
                    />
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth error={!!formErrors.passportNumber}>
                    <TextField
                      name="passportNumber"
                      label="מספר דרכון"
                      value={formData.customer.passportNumber}
                      onChange={handleCustomerChange}
                      fullWidth
                      size="small"
                      disabled={!formData.isTourist}
                      error={!!formErrors.passportNumber}
                      helperText={formErrors.passportNumber}
                    />
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    name="address"
                    label="כתובת"
                    value={formData.customer.address}
                    onChange={handleCustomerChange}
                    fullWidth
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    name="phone"
                    label="טלפון"
                    value={formData.customer.phone}
                    onChange={handleCustomerChange}
                    fullWidth
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    name="email"
                    label="דוא״ל"
                    value={formData.customer.email}
                    onChange={handleCustomerChange}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* פרטי תשלום */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, borderRadius: '8px', height: '100%' }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
                פרטי תשלום
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth error={!!formErrors.total}>
                    <TextField
                      name="total"
                      label="סה״כ לתשלום"
                      type="number"
                      value={formData.paymentDetails.total}
                      onChange={handlePaymentChange}
                      fullWidth
                      size="small"
                      required
                      error={!!formErrors.total}
                      helperText={formErrors.total}
                      InputProps={{
                        startAdornment: <Box sx={{ mr: 1 }}>₪</Box>
                      }}
                    />
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>אמצעי תשלום</InputLabel>
                    <Select
                      name="paymentMethod"
                      value={formData.paymentDetails.paymentMethod}
                      onChange={handlePaymentChange}
                      label="אמצעי תשלום"
                    >
                      <MenuItem value="cash">מזומן</MenuItem>
                      <MenuItem value="credit_card">כרטיס אשראי</MenuItem>
                      <MenuItem value="bank_transfer">העברה בנקאית</MenuItem>
                      <MenuItem value="bit">ביט</MenuItem>
                      <MenuItem value="paybox">פייבוקס</MenuItem>
                      <MenuItem value="other">אחר</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    name="discount"
                    label="הנחה"
                    type="number"
                    value={formData.paymentDetails.discount}
                    onChange={handlePaymentChange}
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: <Box sx={{ mr: 1 }}>₪</Box>
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* הערות */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, borderRadius: '8px' }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
                פרטים נוספים
              </Typography>

              <TextField
                name="notes"
                label="הערות לחשבונית"
                value={formData.notes}
                onChange={handleChange}
                multiline
                rows={3}
                fullWidth
                size="small"
              />
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting}>
          ביטול
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={20} /> : null}
          sx={{ 
            fontWeight: 'bold',
            minWidth: '150px',
            bgcolor: 'success.main',
            '&:hover': { bgcolor: 'success.dark' }
          }}
        >
          {submitting ? 'מפיק חשבונית...' : 'הפקת חשבונית'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateInvoiceDialog; 