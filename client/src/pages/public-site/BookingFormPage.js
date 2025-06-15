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
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Checkbox,
  FormHelperText,
  Alert,
  Card,
  CardMedia,
  CardContent,
  Divider,
  useMediaQuery,
  useTheme,
  CircularProgress,
  IconButton
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Payment as PaymentIcon,
  EventAvailable as EventAvailableIcon,
  PersonOutline as PersonOutlineIcon
} from '@mui/icons-material';
import { parseISO, format, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';
import axios from 'axios';
import { API_URL, API_ENDPOINTS } from '../../config/apiConfig';

import PublicSiteLayout from '../../components/public-site/PublicSiteLayout';

// שלבי הטופס
const steps = ['פרטי האורח', 'פרטי תשלום', 'אישור הזמנה'];

const BookingFormPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  
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
    notes: '',
    paymentMethod: 'credit',
    creditCard: {
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      holderName: ''
    },
    agreeToTerms: false
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
  
  /**
   * חישוב מחיר עם אורחים נוספים וסטטוס תייר
   * @param {Object} room - נתוני החדר
   * @param {number} guests - מספר אורחים
   * @param {number} nights - מספר לילות
   * @param {boolean} isTourist - האם תייר
   * @returns {Object} - אובייקט עם המחירים המחושבים
   */
  const calculateRoomPrice = (room, guests, nights, isTourist) => {
    if (!room) return { pricePerNight: 0, totalPrice: 0 };
    
    // מחיר בסיס לפי סטטוס תייר
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
  };
  
  // מחיר סופי מחושב
  const roomPricing = room ? calculateRoomPrice(room, bookingData.guests, nightsCount, isTourist) : { pricePerNight: 0, totalPrice: 0 };
  
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
        notes: bookingData.notes,
        room: roomId,
        checkIn: checkInStr,
        checkOut: checkOutStr,
        isTourist: isTourist,
        creditCard: bookingData.paymentMethod === 'credit' ? {
          cardNumber: bookingData.creditCard.cardNumber.replace(/\s/g, ''),
          expiryDate: bookingData.creditCard.expiryDate,
          cvv: bookingData.creditCard.cvv
        } : undefined
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
          bookingNumber: response.data.data.bookingNumber,
          checkIn: checkInStr,
          checkOut: checkOutStr,
          roomCategory: room.category,
          roomNumber: room.roomNumber,
          totalPrice: roomPricing.totalPrice,
          guests: bookingData.guests
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
      const newPricing = calculateRoomPrice(room, bookingData.guests, nightsCount, isTourist);
      // כאן אפשר להוסיף לוגיקה נוספת אם נדרש
    }
  }, [bookingData.guests, room, nightsCount, isTourist]);
  
  // פורמט תאריכים לתצוגה
  const formattedCheckIn = validParams ? format(checkIn, 'EEEE, d בMMMM yyyy', { locale: he }) : '';
  const formattedCheckOut = validParams ? format(checkOut, 'EEEE, d בMMMM yyyy', { locale: he }) : '';
  
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
    
    if (bookingData.paymentMethod === 'credit') {
      if (!bookingData.creditCard.cardNumber.trim()) {
        errors['creditCard.cardNumber'] = 'מספר כרטיס הוא שדה חובה';
      } else if (!/^\d{16}$/.test(bookingData.creditCard.cardNumber.replace(/\s/g, ''))) {
        errors['creditCard.cardNumber'] = 'אנא הזן מספר כרטיס תקין (16 ספרות)';
      }
      
      if (!bookingData.creditCard.expiryDate.trim()) {
        errors['creditCard.expiryDate'] = 'תאריך תפוגה הוא שדה חובה';
      } else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(bookingData.creditCard.expiryDate)) {
        errors['creditCard.expiryDate'] = 'אנא הזן תאריך תפוגה תקין (MM/YY)';
      }
      
      if (!bookingData.creditCard.cvv.trim()) {
        errors['creditCard.cvv'] = 'קוד אבטחה הוא שדה חובה';
      } else if (!/^\d{3,4}$/.test(bookingData.creditCard.cvv)) {
        errors['creditCard.cvv'] = 'אנא הזן קוד אבטחה תקין (3-4 ספרות)';
      }
      
      if (!bookingData.creditCard.holderName.trim()) {
        errors['creditCard.holderName'] = 'שם בעל הכרטיס הוא שדה חובה';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // אימות אישור הזמנה
  const validateConfirmation = () => {
    const errors = {};
    
    if (!bookingData.agreeToTerms) {
      errors.agreeToTerms = 'יש לאשר את תנאי השימוש כדי להמשיך';
    }
    
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
              פרטי האורח
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="firstName"
                  label="שם פרטי"
                  fullWidth
                  value={bookingData.firstName}
                  onChange={handleChange}
                  error={!!formErrors.firstName}
                  helperText={formErrors.firstName}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="lastName"
                  label="שם משפחה"
                  fullWidth
                  value={bookingData.lastName}
                  onChange={handleChange}
                  error={!!formErrors.lastName}
                  helperText={formErrors.lastName}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="email"
                  label="אימייל"
                  type="email"
                  fullWidth
                  value={bookingData.email}
                  onChange={handleChange}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="phone"
                  label="טלפון"
                  fullWidth
                  value={bookingData.phone}
                  onChange={handleChange}
                  error={!!formErrors.phone}
                  helperText={formErrors.phone}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="guests"
                  label="מספר אורחים"
                  type="number"
                  fullWidth
                  value={bookingData.guests}
                  onChange={handleChange}
                  InputProps={{
                    inputProps: {
                      min: 1,
                      max: room?.maxOccupancy || 1
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="notes"
                  label="הערות מיוחדות"
                  multiline
                  rows={3}
                  fullWidth
                  value={bookingData.notes}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </Box>
        );
      case 1:
        return (
          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
              פרטי תשלום (לפיקדון בלבד)
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              נדרשים פרטי כרטיס אשראי לצורך הבטחת ההזמנה (פיקדון). התשלום המלא יתבצע במקום האירוח.
            </Alert>
            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <RadioGroup
                name="paymentMethod"
                value={bookingData.paymentMethod}
                onChange={handleChange}
              >
                <FormControlLabel
                  value="credit"
                  control={<Radio />}
                  label="כרטיס אשראי"
                />
              </RadioGroup>
            </FormControl>
            
            {bookingData.paymentMethod === 'credit' && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    name="creditCard.cardNumber"
                    label="מספר כרטיס"
                    fullWidth
                    value={bookingData.creditCard.cardNumber}
                    onChange={handleChange}
                    error={!!formErrors['creditCard.cardNumber']}
                    helperText={formErrors['creditCard.cardNumber']}
                    required
                    placeholder="#### #### #### ####"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="creditCard.expiryDate"
                    label="תוקף (MM/YY)"
                    fullWidth
                    value={bookingData.creditCard.expiryDate}
                    onChange={handleChange}
                    error={!!formErrors['creditCard.expiryDate']}
                    helperText={formErrors['creditCard.expiryDate']}
                    required
                    placeholder="MM/YY"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="creditCard.cvv"
                    label="קוד אבטחה (CVV)"
                    fullWidth
                    value={bookingData.creditCard.cvv}
                    onChange={handleChange}
                    error={!!formErrors['creditCard.cvv']}
                    helperText={formErrors['creditCard.cvv']}
                    required
                    placeholder="###"
                    type="password"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="creditCard.holderName"
                    label="שם בעל הכרטיס"
                    fullWidth
                    value={bookingData.creditCard.holderName}
                    onChange={handleChange}
                    error={!!formErrors['creditCard.holderName']}
                    helperText={formErrors['creditCard.holderName']}
                    required
                  />
                </Grid>
              </Grid>
            )}
          </Box>
        );
      case 2:
        return (
          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
              אישור הזמנה
            </Typography>
            
            <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: '10px' }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                פרטי ההזמנה
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    שם האורח
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {bookingData.firstName} {bookingData.lastName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    מספר אורחים
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {bookingData.guests}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    תאריך צ'ק-אין
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {formattedCheckIn}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    תאריך צ'ק-אאוט
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {formattedCheckOut}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    חדר
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {room?.category} (חדר {room?.roomNumber})
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    סה"כ לתשלום
                  </Typography>
                  <Typography variant="body1" fontWeight={700} color="primary.main">
                    {roomPricing.totalPrice} ₪
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
            
            <FormControlLabel
              control={
                <Checkbox
                  name="agreeToTerms"
                  checked={bookingData.agreeToTerms}
                  onChange={handleChange}
                  color="primary"
                />
              }
              label="אני מאשר/ת את תנאי השימוש ומדיניות הביטולים"
            />
            {formErrors.agreeToTerms && (
              <FormHelperText error>{formErrors.agreeToTerms}</FormHelperText>
            )}
          </Box>
        );
      default:
        return 'שלב לא ידוע';
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
          {room ? `חדר ${room.category} - ${room.roomNumber}` : 'טוען פרטי חדר...'}
        </Typography>
      </Box>
    );
  };
  
  return (
    <PublicSiteLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <IconButton 
            component={Link} 
            to={`/airport-booking/search-results?checkIn=${checkInStr}&checkOut=${checkOutStr}&nights=${nightsCount}&guests=${urlGuests}&isTourist=${isTourist}`}
            sx={{ mb: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          
          <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 600 }}>
            הזמנת חדר
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
            <Grid container spacing={4}>
              {/* טופס הזמנה */}
              <Grid item xs={12} md={8}>
                <Paper elevation={1} sx={{ p: 3, borderRadius: '10px' }}>
                  <Stepper activeStep={activeStep} alternativeLabel={!isMobile} orientation={isMobile ? 'vertical' : 'horizontal'}>
                    {steps.map((label, index) => {
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
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                    <Button
                      color="inherit"
                      disabled={activeStep === 0}
                      onClick={handleBack}
                      sx={{ mr: 1 }}
                    >
                      חזור
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={loading}
                    >
                      {activeStep === steps.length - 1 ? 'סיים הזמנה' : 'המשך'}
                      {loading && activeStep === steps.length - 1 && (
                        <CircularProgress size={24} sx={{ ml: 1 }} />
                      )}
                    </Button>
                  </Box>
                </Paper>
              </Grid>
              
              {/* סיכום הזמנה */}
              <Grid item xs={12} md={4}>
                <Card elevation={2} sx={{ borderRadius: '10px', position: 'sticky', top: 20 }}>
                  {roomLoading ? (
                    <Box sx={{ p: 3 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : (
                    <>
                      {renderRoomImage()}
                      
                      <CardContent>
                        <Typography variant="h6" component="h2" fontWeight={600}>
                          {room?.category}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          חדר {room?.roomNumber}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <EventAvailableIcon sx={{ color: 'primary.main', mr: 1, fontSize: 20 }} />
                          <Typography variant="body2">
                            {formattedCheckIn} - {formattedCheckOut}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <PersonOutlineIcon sx={{ color: 'primary.main', mr: 1, fontSize: 20 }} />
                          <Typography variant="body2">
                            עד {room?.maxOccupancy} אורחים
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
                              fontSize: '0.75rem'
                            }}>
                              תייר - מחירים ללא מע״מ
                            </Typography>
                          </Box>
                        )}
                        
                        <Divider sx={{ mb: 2 }} />
                        
                        <Box sx={{ mb: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">מחיר בסיס ללילה:</Typography>
                            <Typography variant="body2">{isTourist ? room?.basePrice : room?.vatPrice} ₪</Typography>
                          </Box>
                          {roomPricing.extraGuests > 0 && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2">תוספת {roomPricing.extraGuests} אורח{roomPricing.extraGuests > 1 ? 'ים' : ''} נוסף{roomPricing.extraGuests > 1 ? 'ים' : ''}:</Typography>
                              <Typography variant="body2">{roomPricing.extraCharge} ₪</Typography>
                            </Box>
                          )}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                            <Typography variant="body2" fontWeight={600}>מחיר ללילה:</Typography>
                            <Typography variant="body2" fontWeight={600}>{roomPricing.pricePerNight} ₪</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">מספר לילות:</Typography>
                            <Typography variant="body2">{nightsCount}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">מספר אורחים:</Typography>
                            <Typography variant="body2">{bookingData.guests}</Typography>
                          </Box>
                        </Box>
                        
                        <Divider sx={{ mb: 2 }} />
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body1" fontWeight={600}>
                            סה"כ לתשלום:
                          </Typography>
                          <Typography variant="h6" fontWeight={700} color="primary.main">
                            {roomPricing.totalPrice} ₪
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                          <PaymentIcon sx={{ color: 'success.main', mr: 1, fontSize: 20 }} />
                          <Typography variant="body2" color="success.main">
                            תשלום בהגעה למלון
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