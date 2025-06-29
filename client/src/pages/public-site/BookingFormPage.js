import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Grid, 
  TextField, 
  Button, 
  Stepper, 
    Step, 
  StepLabel,

  Alert,
  Card,
  CardMedia,
  CardContent,
  Divider,
  useMediaQuery,
  useTheme,
  CircularProgress
} from '@mui/material';
import { 
  Payment as PaymentIcon,
  EventAvailable as EventAvailableIcon,
  PersonOutline as PersonOutlineIcon
} from '@mui/icons-material';
import { parseISO, format, differenceInDays, addDays } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import axios from 'axios';
import { API_URL, API_ENDPOINTS } from '../../config/apiConfig';

import PublicSiteLayout from '../../components/public-site/PublicSiteLayout';
import { useTranslation, useLanguage } from '../../contexts/LanguageContext';

// שלבי הטופס - יעודכנו בתרגום
const steps = [];

const BookingFormPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const t = useTranslation();
  const { currentLanguage } = useLanguage();
  
  // בחירת locale לפי שפה נוכחית
  const dateLocale = currentLanguage === 'he' ? he : enUS;
  
  // שלבי הטופס מתורגמים
  const translatedSteps = [t('booking.step1'), t('booking.step2'), t('booking.step3')];
  
  // שלב נוכחי בטופס
  const [activeStep, setActiveStep] = useState(0);
  
  // מצב טעינה ושגיאות
  const [loading, setLoading] = useState(true);
  const [roomLoading, setRoomLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // נתוני החדר הנבחר
  const [room, setRoom] = useState(null);
  
  // נתוני ההזמנה
  const [bookingData, setBookingData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    guests: 1,
    code: '',
    notes: '',
    paymentMethod: 'credit',
    creditCard: {
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      holderName: ''
    }
  });
  
  // מצב שגיאות הטופס
  const [formErrors, setFormErrors] = useState({});
  
  // חילוץ פרמטרים מה-URL
  const searchParams = new URLSearchParams(location.search);
  const roomId = searchParams.get('roomId');
  const checkInStr = searchParams.get('checkIn');
  const checkOutStr = searchParams.get('checkOut');
  const nightsStr = searchParams.get('nights');
  const guestsStr = searchParams.get('guests');
  const isTouristStr = searchParams.get('isTourist');
  
  // בדיקת תקינות פרמטרים
  const validParams = roomId && checkInStr && checkOutStr;
  
  // המרה לתאריכים, מספר אורחים וסטטוס תייר
  const checkIn = validParams ? parseISO(checkInStr) : null;
  const checkOut = validParams ? parseISO(checkOutStr) : null;
  const urlGuests = parseInt(guestsStr, 10) || 2;
  const isTourist = isTouristStr === 'true';
  
  // חישוב מספר לילות - עדיפות לפרמטר מה-URL, אחרת חישוב מהתאריכים
  const nightsFromUrl = parseInt(nightsStr, 10);
  const nightsFromDates = validParams ? differenceInDays(checkOut, checkIn) : 0;
  const nightsCount = nightsFromUrl && nightsFromUrl > 0 ? nightsFromUrl : nightsFromDates;
  
  // חישוב תאריך ביטול (3 ימים לפני צ'ק-אין)
  const cancellationDate = checkIn ? new Date(checkIn.getTime() - 3 * 24 * 60 * 60 * 1000) : null;
  const formattedCancellationDate = cancellationDate ? format(cancellationDate, 'EEEE, d MMMM yyyy', { locale: dateLocale }) : '';
  
  /**
   * חישוב מחיר עם אורחים נוספים וסטטוס תייר וימים מיוחדים
   * @param {Object} room - נתוני החדר
   * @param {number} guests - מספר אורחים
   * @param {number} nights - מספר לילות
   * @param {boolean} isTourist - האם תייר
   * @param {Date} checkIn - תאריך כניסה
   * @param {Date} checkOut - תאריך יציאה
   * @returns {Object} - אובייקט עם המחירים המחושבים
   */
  const calculateRoomPrice = (room, guests, nights, isTourist, checkIn = null, checkOut = null) => {
    if (!room) return { pricePerNight: 0, totalPrice: 0 };
    
    let totalPrice = 0;
    
    // אם יש תאריכי כניסה ויציאה, נחשב מחיר מדויק לכל יום
    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      
      // מעבר על כל יום בתקופת השהייה
      for (let date = new Date(checkInDate); date < checkOutDate; date.setDate(date.getDate() + 1)) {
        const dayOfWeek = date.getDay();
        let dailyBasePrice;
        
        if (dayOfWeek === 5) { // יום שישי
          dailyBasePrice = isTourist ? 
            (room.fridayPrice || room.basePrice || 0) : 
            (room.fridayVatPrice || room.vatPrice || 0);
        } else if (dayOfWeek === 6) { // יום שבת
          dailyBasePrice = isTourist ? 
            (room.saturdayPrice || room.basePrice || 0) : 
            (room.saturdayVatPrice || room.vatPrice || 0);
        } else { // שאר הימים
          dailyBasePrice = isTourist ? 
            (room.basePrice || 0) : 
            (room.vatPrice || 0);
        }
        
        // הוספת תוספת לאורחים נוספים
        const baseOccupancy = room.baseOccupancy || 2;
        const extraGuestCharge = room.extraGuestCharge || 0;
        const extraGuests = Math.max(0, guests - baseOccupancy);
        const extraCharge = extraGuests * extraGuestCharge;
        
        totalPrice += dailyBasePrice + extraCharge;
      }
      
      // חישוב מחיר ממוצע ללילה
      const avgPricePerNight = nights > 0 ? totalPrice / nights : 0;
      
      return {
        pricePerNight: parseFloat(avgPricePerNight.toFixed(2)),
        totalPrice: parseFloat(totalPrice.toFixed(2)),
        extraGuests: Math.max(0, guests - (room.baseOccupancy || 2)),
        extraCharge: Math.max(0, guests - (room.baseOccupancy || 2)) * (room.extraGuestCharge || 0)
      };
    } else {
      // חישוב פשוט ללא תאריכים מדויקים - משתמש במחיר בסיס
      const basePricePerNight = isTourist ? (room.basePrice || 0) : (room.vatPrice || 0);
      
      // חישוב תוספת לאורחים נוספים
      const baseOccupancy = room.baseOccupancy || 2;
      const extraGuestCharge = room.extraGuestCharge || 0;
      const extraGuests = Math.max(0, guests - baseOccupancy);
      const extraCharge = extraGuests * extraGuestCharge;
      
      // מחיר סופי ללילה
      const pricePerNight = basePricePerNight + extraCharge;
      
      // מחיר כולל
      const totalPrice = pricePerNight * nights;
      
      return {
        pricePerNight,
        totalPrice,
        extraGuests,
        extraCharge
      };
    }
  };
  
  // מחיר סופי מחושב עם התאריכים
  const roomPricing = room ? calculateRoomPrice(room, bookingData.guests, nightsCount, isTourist, checkIn, checkOut) : { pricePerNight: 0, totalPrice: 0 };
  
  // עדכון הפונקציה submitBooking
  const submitBooking = async () => {
    setLoading(true);
    
    try {
      // יצירת אובייקט ההזמנה
      const bookingPayload = {
        firstName: bookingData.firstName,
        lastName: bookingData.lastName,
        email: bookingData.email,
        phone: bookingData.phone,
        guests: parseInt(bookingData.guests, 10),
        code: bookingData.code || '',
        notes: bookingData.notes,
        room: roomId,
        checkIn: checkInStr,
        checkOut: checkOutStr,
        isTourist: isTourist,
        creditCard: {
          cardNumber: bookingData.creditCard.cardNumber.replace(/\s/g, ''),
          expiryDate: bookingData.creditCard.expiryDate,
          cvv: bookingData.creditCard.cvv
        }
      };
      
      console.log('שולח בקשת הזמנה עם הנתונים:', {
        firstName: bookingPayload.firstName,
        lastName: bookingPayload.lastName,
        email: bookingPayload.email,
        room: bookingPayload.room,
        checkIn: bookingPayload.checkIn,
        checkOut: bookingPayload.checkOut,
        guests: bookingPayload.guests,
        hasCreditCard: bookingPayload.creditCard ? 'כן' : 'לא'
      });
      
      // שליחת ההזמנה לשרת דרך ה-API הציבורי
      const response = await axios.post(`${API_URL}/api/bookings/public/create`, bookingPayload);
      
      console.log('התקבלה תשובה מהשרת:', response.data);
      
      // מעבר לדף אישור
      navigate('/airport-booking/confirmation', {
        state: {
          bookingData: {
            bookingNumber: response.data.data.bookingNumber,
            checkIn: checkInStr,
            checkOut: checkOutStr,
            roomCategory: room.category || room.roomType || 'חדר רגיל',
            roomNumber: room.roomNumber,
            totalPrice: roomPricing.totalPrice,
            guests: bookingData.guests,
            nights: response.data.data.nights || nightsCount,
            price: response.data.data.price || roomPricing.totalPrice
          }
        }
      });
    } catch (err) {
      console.error('שגיאה ביצירת ההזמנה:', err);
      
      // הצגת שגיאה מפורטת יותר למשתמש
      if (err.response && err.response.data) {
        const errorMsg = err.response.data.message || 'אירעה שגיאה לא ידועה';
        const errorDetails = err.response.data.error || '';
        
        console.error('פרטי שגיאה מהשרת:', {
          status: err.response.status,
          message: errorMsg,
          details: errorDetails
        });
        
        setError(`אירעה שגיאה ביצירת ההזמנה: ${errorMsg}${errorDetails ? ` (${errorDetails})` : ''}`);
      } else {
        setError('אירעה שגיאה בתקשורת עם השרת. אנא נסה שנית.');
      }
      
      setLoading(false);
    }
  };
  
  // עדכון הפונקציה fetchRoom
  useEffect(() => {
    if (!validParams) {
      setError('פרמטרים חסרים בכתובת. אנא חזור לעמוד החיפוש ונסה שנית.');
      setLoading(false);
      return;
    }
    
    const fetchRoom = async () => {
      setRoomLoading(true);
      
      try {
        // בדיקת זמינות החדר דרך ה-API הציבורי
        const availabilityResponse = await axios.get(`${API_URL}/api/bookings/check-availability`, {
          params: {
            roomId,
            checkIn: checkInStr,
            checkOut: checkOutStr
          }
        });
        
        if (!availabilityResponse.data.available) {
          setError('החדר כבר לא זמין בתאריכים שנבחרו. אנא חזור לעמוד החיפוש ובחר חדר אחר.');
          setLoading(false);
          return;
        }
        
        // טעינת פרטי החדר דרך ה-API הציבורי
        const roomResponse = await axios.get(`${API_URL}${API_ENDPOINTS.rooms.public.byId(roomId)}`);
        setRoom(roomResponse.data);
        
        // עדכון מספר האורחים הראשוני לפי הפרמטר מה-URL או ברירת המחדל של החדר
        setBookingData(prev => ({
          ...prev,
          guests: urlGuests || roomResponse.data.baseOccupancy || 1
        }));
        
      } catch (err) {
        console.error('שגיאה בטעינת נתוני החדר:', err);
        setError('אירעה שגיאה בטעינת נתוני החדר. אנא נסה שנית.');
      } finally {
        setRoomLoading(false);
        setLoading(false);
      }
    };
    
    fetchRoom();
  }, [roomId, checkInStr, checkOutStr, nightsCount, validParams]);
  
  // עדכון המחיר כשמספר האורחים משתנה
  useEffect(() => {
    if (room && bookingData.guests) {
      const newPricing = calculateRoomPrice(room, bookingData.guests, nightsCount, isTourist, checkIn, checkOut);
      // כאן אפשר להוסיף לוגיקה נוספת אם נדרש
    }
  }, [bookingData.guests, room, nightsCount, isTourist, checkIn, checkOut]);
  
  // פורמט תאריכים לתצוגה
  const formattedCheckIn = validParams ? format(checkIn, 'EEEE, d MMMM yyyy', { locale: dateLocale }) : '';
  const formattedCheckOut = validParams ? format(checkOut, 'EEEE, d MMMM yyyy', { locale: dateLocale }) : '';
  
  // עדכון נתוני הטופס
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('creditCard.')) {
      const cardField = name.split('.')[1];
      setBookingData({
        ...bookingData,
        creditCard: {
          ...bookingData.creditCard,
          [cardField]: value
        }
      });
    } else {
      setBookingData({
        ...bookingData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
    
    // ניקוי שגיאה אם קיימת
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };
  
  // אימות פרטי האורח
  const validateGuestDetails = () => {
    const errors = {};
    
    if (!bookingData.firstName.trim()) {
      errors.firstName = 'שם פרטי הוא שדה חובה';
    }
    
    if (!bookingData.lastName.trim()) {
      errors.lastName = 'שם משפחה הוא שדה חובה';
    }
    
    if (!bookingData.email.trim()) {
      errors.email = 'אימייל הוא שדה חובה';
    } else if (!/\S+@\S+\.\S+/.test(bookingData.email)) {
      errors.email = 'אנא הזן כתובת אימייל תקינה';
    }
    
    if (!bookingData.phone.trim()) {
      errors.phone = 'מספר טלפון הוא שדה חובה';
    } else if (!/^\d{9,10}$/.test(bookingData.phone.replace(/[^\d]/g, ''))) {
      errors.phone = 'אנא הזן מספר טלפון תקין';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // אימות פרטי תשלום
  const validatePaymentDetails = () => {
    const errors = {};
    
    if (!bookingData.creditCard.cardNumber.trim()) {
      errors['creditCard.cardNumber'] = 'מספר כרטיס הוא שדה חובה';
    } else if (!/^\d{16}$/.test(bookingData.creditCard.cardNumber.replace(/\s/g, ''))) {
      errors['creditCard.cardNumber'] = 'אנא הזן מספר כרטיס תקין (16 ספרות)';
    }
    
    if (!bookingData.creditCard.expiryDate.trim()) {
      errors['creditCard.expiryDate'] = 'תאריך תפוגה הוא שדה חובה';
    } else {
      // בדיקת פורמט תוקף - תמיכה בפורמטים שונים כמו בטופס הרגיל
      const cleanExpiryDate = bookingData.creditCard.expiryDate.replace(/\s|-/g, '');
      const isValidFormat = /^(0[1-9]|1[0-2])\/?\d{2}$/.test(cleanExpiryDate) || // MM/YY או MMYY
                           /^(0[1-9]|1[0-2])\d{2}$/.test(cleanExpiryDate) || // MMYY
                           /^\d{2}\/\d{2}$/.test(cleanExpiryDate) || // YY/MM (בטעות)
                           /^\d{4}$/.test(cleanExpiryDate); // MMYY
      
      if (!isValidFormat) {
        errors['creditCard.expiryDate'] = 'אנא הזן תאריך תפוגה תקין (MMYY או MM/YY)';
      }
    }
    
    if (!bookingData.creditCard.cvv.trim()) {
      errors['creditCard.cvv'] = 'קוד אבטחה הוא שדה חובה';
    } else if (!/^\d{3,4}$/.test(bookingData.creditCard.cvv)) {
      errors['creditCard.cvv'] = 'אנא הזן קוד אבטחה תקין (3-4 ספרות)';
    }
    
    if (!bookingData.creditCard.holderName.trim()) {
      errors['creditCard.holderName'] = 'שם בעל הכרטיס הוא שדה חובה';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // אימות אישור הזמנה
  const validateConfirmation = () => {
    const errors = {};
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // המשך לשלב הבא
  const handleNext = () => {
    let isValid = false;
    
    // אימות בהתאם לשלב הנוכחי
    switch (activeStep) {
      case 0:
        isValid = validateGuestDetails();
        break;
      case 1:
        isValid = validatePaymentDetails();
        break;
      case 2:
        isValid = validateConfirmation();
        if (isValid) {
          submitBooking();
          return;
        }
        break;
      default:
        isValid = true;
    }
    
    if (isValid) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };
  
  // חזרה לשלב הקודם
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  // תצוגת תוכן השלב הנוכחי
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
              {t('booking.personalDetails')}
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="firstName"
                  label={t('booking.firstName')}
                  fullWidth
                  value={bookingData.firstName}
                  onChange={handleChange}
                  error={!!formErrors.firstName}
                  helperText={formErrors.firstName}
                  required
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="lastName"
                  label={t('booking.lastName')}
                  fullWidth
                  value={bookingData.lastName}
                  onChange={handleChange}
                  error={!!formErrors.lastName}
                  helperText={formErrors.lastName}
                  required
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="email"
                  label={t('booking.email')}
                  type="email"
                  fullWidth
                  value={bookingData.email}
                  onChange={handleChange}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                  required
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="phone"
                  label={t('booking.phone')}
                  fullWidth
                  value={bookingData.phone}
                  onChange={handleChange}
                  error={!!formErrors.phone}
                  helperText={formErrors.phone}
                  required
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="code"
                  label={`${t('booking.idNumber')} (${t('booking.optional')})`}
                  fullWidth
                  value={bookingData.code}
                  onChange={handleChange}
                  inputProps={{ 
                    maxLength: 4, 
                    style: { textAlign: 'center' },
                    pattern: "[0-9]{4}"
                  }}
                  placeholder="0000"
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="notes"
                  label={t('booking.notes')}
                  multiline
                  rows={2}
                  fullWidth
                  value={bookingData.notes}
                  onChange={handleChange}
                  size="small"
                />
              </Grid>
            </Grid>
          </Box>
        );
      case 1:
        return (
          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
              {t('booking.paymentDetails')}
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3, borderRadius: '8px' }}>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                {t('booking.creditCard')}
              </Typography>
              <Typography variant="body2">
                {t('booking.paymentMethod')}
              </Typography>
            </Alert>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  name="creditCard.cardNumber"
                  label={t('booking.creditCard')}
                  fullWidth
                  value={bookingData.creditCard.cardNumber}
                  onChange={handleChange}
                  error={!!formErrors['creditCard.cardNumber']}
                  helperText={formErrors['creditCard.cardNumber']}
                  required
                  placeholder="#### #### #### ####"
                  inputProps={{ maxLength: 19, dir: "ltr", style: { textAlign: 'center' } }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="creditCard.expiryDate"
                  label={t('booking.expiryDate') || 'Expiry Date'}
                  fullWidth
                  value={bookingData.creditCard.expiryDate}
                  onChange={handleChange}
                  error={!!formErrors['creditCard.expiryDate']}
                  helperText={formErrors['creditCard.expiryDate']}
                  required
                  placeholder="MM/YY"
                  inputProps={{ maxLength: 5, dir: "ltr", style: { textAlign: 'center' } }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="creditCard.cvv"
                  label="CVV"
                  fullWidth
                  value={bookingData.creditCard.cvv}
                  onChange={handleChange}
                  error={!!formErrors['creditCard.cvv']}
                  helperText={formErrors['creditCard.cvv']}
                  required
                  placeholder="###"
                  inputProps={{ maxLength: 4, dir: "ltr", style: { textAlign: 'center' } }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="creditCard.holderName"
                  label={t('booking.holderName') || 'Cardholder Name'}
                  fullWidth
                  value={bookingData.creditCard.holderName}
                  onChange={handleChange}
                  error={!!formErrors['creditCard.holderName']}
                  helperText={formErrors['creditCard.holderName']}
                  required
                  size="small"
                />
              </Grid>
            </Grid>
          </Box>
        );
      case 2:
        return (
          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
              {t('booking.confirm')}
            </Typography>
            
            <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: '10px' }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                {t('booking.bookingDetails')}
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    {t('booking.firstName')} {t('booking.lastName')}
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {bookingData.firstName} {bookingData.lastName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    {t('search.guests')}
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {bookingData.guests}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    {t('search.checkIn')}
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {formattedCheckIn}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    {t('search.checkOut')}
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {formattedCheckOut}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    {t('booking.roomDetails')}
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {room?.category} ({t('rooms.roomNumber')} {room?.roomNumber})
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    {t('booking.totalPrice')}
                  </Typography>
                  <Typography variant="body1" fontWeight={700} color="primary.main">
                    {roomPricing.totalPrice} ₪
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        );
      default:
        return t('common.unknownStep') || 'Unknown step';
    }
  };
  
  // נוסיף פונקציית עזר ליצירת תמונת דמה
  const renderRoomImage = () => {
    // בדיקה אם יש תמונה זמינה
    if (room?.images && room.images.length > 0 && room.images[0]) {
      return (
        <CardMedia
          component="img"
          height="160"
          image={room.images[0]}
          alt={room?.category}
        />
      );
    }
    
    // אם אין תמונה, נציג תמונת דמה
    return (
      <Box
        sx={{
          height: 160,
          background: 'linear-gradient(135deg, #f3f4f6 25%, #e5e7eb 25%, #e5e7eb 50%, #f3f4f6 50%, #f3f4f6 75%, #e5e7eb 75%, #e5e7eb 100%)',
          backgroundSize: '20px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6b7280'
        }}
      >
        <Typography variant="body2" sx={{ backgroundColor: 'rgba(255,255,255,0.7)', p: 1, borderRadius: 1 }}>
          {room ? `${t('rooms.roomNumber')} ${room.category} - ${room.roomNumber}` : t('common.loading')}
        </Typography>
      </Box>
    );
  };
  

  
  return (
    <PublicSiteLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 600 }}>
            {t('booking.title')}
          </Typography>
          
          {error ? (
            <Alert severity="error" sx={{ mb: 4 }}>
              {error}
            </Alert>
          ) : loading && !roomLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {/* טופס הזמנה */}
              <Grid item xs={12} md={6} order={{ xs: 2, md: 1 }}>
                <Paper elevation={1} sx={{ p: { xs: 1, sm: 2 }, borderRadius: '10px' }}>
                  <Stepper 
                    activeStep={activeStep} 
                    alternativeLabel={!isMobile} 
                    orientation={isMobile ? 'vertical' : 'horizontal'}
                    connector={null}
                    sx={{
                      '& .MuiStepConnector-root': {
                        display: 'none'
                      }
                    }}
                  >
                    {translatedSteps.map((label, index) => {
                      const stepProps = {};
                      const labelProps = {};
                      return (
                        <Step key={label} {...stepProps}>
                          <StepLabel {...labelProps}>{label}</StepLabel>
                        </Step>
                      );
                    })}
                  </Stepper>
                  
                  {getStepContent(activeStep)}
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    {activeStep === 0 ? (
                      <Button
                        component={Link}
                        to={`/airport-booking/search-results?checkIn=${checkInStr}&checkOut=${checkOutStr}&nights=${nightsCount}&guests=${urlGuests}&isTourist=${isTourist}`}
                        color="inherit"
                        sx={{ mr: 1 }}
                        size="small"
                      >
{t('common.backToResults')}
                      </Button>
                    ) : (
                      <Button
                        color="inherit"
                        onClick={handleBack}
                        sx={{ mr: 1 }}
                        size="small"
                      >
{t('common.back')}
                      </Button>
                    )}
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={loading}
                      size="small"
                    >
{activeStep === translatedSteps.length - 1 ? t('common.finishBooking') : t('common.continue')}
                                              {loading && activeStep === translatedSteps.length - 1 && (
                        <CircularProgress size={20} sx={{ ml: 1 }} />
                      )}
                    </Button>
                  </Box>
                </Paper>
              </Grid>
              
              {/* סיכום הזמנה */}
              <Grid item xs={12} md={6} order={{ xs: 1, md: 2 }}>
                <Card elevation={2} sx={{ borderRadius: '10px', position: { xs: 'static', md: 'sticky' }, top: 20 }}>
                  {roomLoading ? (
                    <Box sx={{ p: 3 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : (
                    <>
                      {renderRoomImage()}
                      
                      <CardContent>
                        <Typography variant="h6" component="h2" fontWeight={600} sx={{ fontSize: '1.1rem', mb: 2 }}>
                          {room?.category}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <EventAvailableIcon sx={{ color: 'primary.main', mr: 1, fontSize: 18 }} />
                          <Typography variant="body2" sx={{ fontSize: { xs: '0.9rem', sm: '0.85rem' } }}>
                            {formattedCheckIn} - {formattedCheckOut}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <PersonOutlineIcon sx={{ color: 'primary.main', mr: 1, fontSize: 18 }} />
                          <Typography variant="body2" sx={{ fontSize: { xs: '0.9rem', sm: '0.85rem' } }}>
{t('common.upToGuests')} {room?.maxOccupancy} {t('common.guests')}
                          </Typography>
                        </Box>
                        
                        {isTourist && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Typography variant="body2" sx={{ 
                              bgcolor: 'success.light', 
                              color: 'success.contrastText', 
                              px: 1, 
                              py: 0.5, 
                              borderRadius: 1,
                              fontSize: '0.7rem'
                            }}>
{t('common.touristPrices')}
                            </Typography>
                          </Box>
                        )}
                        
                        <Divider sx={{ mb: 1.5 }} />
                        
                        {/* פירוט מחירים בטבלה קומפקטית */}
                        <Box sx={{ 
                          bgcolor: '#f8fafc', 
                          borderRadius: 1, 
                          p: 1.5, 
                          mb: 1.5,
                          border: '1px solid #e2e8f0'
                        }}>
                          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr auto 1fr auto 1fr auto' }, gap: 1, alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ fontSize: '0.9rem', color: 'text.primary', fontWeight: 500 }}>
₪{roomPricing.pricePerNight}{t('common.perNight')}
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.9rem', color: 'text.primary' }}>×</Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.9rem', color: 'text.primary', fontWeight: 500 }}>
{nightsCount} {t('common.nights')}
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.9rem', color: 'text.primary' }}>×</Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.9rem', color: 'text.primary', fontWeight: 500 }}>
{bookingData.guests} {t('common.guests')}
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: '1rem', fontWeight: 600, color: 'primary.main' }}>
                              = ₪{roomPricing.totalPrice}
                            </Typography>
                          </Box>
                          {roomPricing.extraGuests > 0 && (
                            <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'warning.main', mt: 0.5, textAlign: 'center' }}>
{t('common.includesExtra')} {roomPricing.extraGuests} {roomPricing.extraGuests > 1 ? t('common.extraGuests') : t('common.extraGuest')} (+₪{roomPricing.extraCharge})
                            </Typography>
                          )}
                        </Box>
                        
                        <Divider sx={{ mb: 2 }} />
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="body1" fontWeight={600}>
{t('common.totalPayment')}
                          </Typography>
                          <Typography variant="h6" fontWeight={700} color="primary.main">
                            {roomPricing.totalPrice} ₪
                          </Typography>
                        </Box>

                        <Divider sx={{ mb: 1.5 }} />

                        {/* מדיניות התשלום - קומפקטית */}
                        <Box sx={{ mb: 1.5 }}>
                          <Typography variant="body2" sx={{ fontSize: '0.9rem', mb: 0.5 }}>
                            <Typography component="span" sx={{ fontWeight: 600, color: 'success.main', fontSize: '0.9rem' }}>
{t('common.paymentDetails')}
                            </Typography>
                            {' '}
                            <Typography component="span" sx={{ color: 'text.primary', fontSize: '0.9rem' }}>
                              {t('common.priceIncludes')}
                            </Typography>
                          </Typography>
                        </Box>

                        <Box sx={{ mb: 1.5 }}>
                          <Typography variant="body2" sx={{ fontSize: '0.9rem', mb: 0.5 }}>
                            <Typography component="span" sx={{ fontWeight: 600, color: 'warning.main', fontSize: '0.9rem' }}>
{t('common.cancellationPolicy')}
                            </Typography>
                            {' '}
                            <Typography component="span" sx={{ color: 'text.primary', fontSize: '0.9rem' }}>
                              {t('common.cancellationPolicyShort')} {formattedCancellationDate} {t('common.cancellationAfter')}
                            </Typography>
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                            <Typography component="span" sx={{ fontWeight: 600, color: 'info.main', fontSize: '0.9rem' }}>
{t('common.checkInOutTimes')}
                            </Typography>
                            {' '}
                            <Typography component="span" sx={{ color: 'text.primary', fontSize: '0.9rem' }}>
                              {t('common.checkInOutShort')}
                            </Typography>
                          </Typography>
                        </Box>
                      </CardContent>
                    </>
                  )}
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>
        

      </Container>
    </PublicSiteLayout>
  );
};

export default BookingFormPage; 