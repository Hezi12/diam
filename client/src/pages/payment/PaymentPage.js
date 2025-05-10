import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Grid,
  useTheme
} from '@mui/material';
import {
  CreditCard as CreditCardIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  AccessTime as AccessTimeIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';

// תתי רכיבים
import PaymentInfo from './PaymentInfo';
import PaymentForm from './PaymentForm';

/**
 * דף תשלום עבור אורחים
 * מאפשר לצפות בפרטי ההזמנה ולמלא פרטי אשראי
 */
const PaymentPage = () => {
  const { paymentCode } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  
  // שלב תהליך התשלום הנוכחי
  const [activeStep, setActiveStep] = useState(0);
  
  // מצב טעינה וטעויות
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // נתוני התשלום וההזמנה
  const [paymentData, setPaymentData] = useState({
    bookingId: '',
    guestName: '',
    amount: 0,
    language: 'he',
    checkIn: null,
    checkOut: null,
    roomId: '',
    roomNumber: '',
    timestamp: 0
  });
  
  // פרטי כרטיס אשראי
  const [creditCardData, setCreditCardData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });
  
  // האם התהליך הושלם
  const [isComplete, setIsComplete] = useState(false);
  
  // הפעולות לביצוע בטעינה ראשונית
  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        setLoading(true);
        
        // פענוח הפרמטרים מה-URL
        if (!paymentCode) {
          throw new Error(paymentData.language === 'he' ? 'קוד תשלום חסר' : 'Payment code is missing');
        }
        
        // פענוח הנתונים מקוד התשלום עם תמיכה בתווי UTF-8
        const decodedParams = JSON.parse(decodeURIComponent(atob(paymentCode)));
        
        // בדיקות תקינות
        if (!decodedParams.b || !decodedParams.n || !decodedParams.r) {
          throw new Error(decodedParams.l === 'en' ? 'Missing parameters in the payment link' : 'פרמטרים חסרים בקישור');
        }
        
        // בדיקת תוקף (אם הקישור נוצר לפני יותר מ-7 ימים)
        const linkTimestamp = decodedParams.t || 0;
        const now = Date.now();
        const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
        
        if (now - linkTimestamp > sevenDaysInMs) {
          throw new Error(decodedParams.l === 'en' ? 'Payment link has expired' : 'קישור התשלום פג תוקף');
        }
        
        // אם זו הזמנה קיימת, נטען מידע נוסף מהשרת
        if (decodedParams.b !== 'new') {
          try {
            const response = await axios.get(`/api/bookings/payment-info/${decodedParams.b}`);
            
            // עדכון הנתונים
            setPaymentData({
              bookingId: decodedParams.b,
              guestName: response.data.firstName || decodedParams.n,
              amount: decodedParams.a || response.data.price,
              language: decodedParams.l || 'he',
              checkIn: response.data.checkIn || decodedParams.i,
              checkOut: response.data.checkOut || decodedParams.o,
              roomId: response.data.room._id || decodedParams.r,
              timestamp: decodedParams.t
            });
          } catch (err) {
            console.error('שגיאה בטעינת פרטי הזמנה:', err);
            
            // אם לא הצלחנו לקבל מידע מהשרת, נשתמש במידע מהקישור בלבד
            setPaymentData({
              bookingId: decodedParams.b,
              guestName: decodedParams.n,
              amount: decodedParams.a || 0,
              language: decodedParams.l || 'he',
              checkIn: decodedParams.i ? new Date(decodedParams.i) : null,
              checkOut: decodedParams.o ? new Date(decodedParams.o) : null,
              roomId: decodedParams.r,
              timestamp: decodedParams.t
            });
          }
        } else {
          // עבור הזמנה חדשה, נשתמש רק בפרמטרים מהקישור
          setPaymentData({
            bookingId: 'new',
            guestName: decodedParams.n,
            amount: decodedParams.a || 0,
            language: decodedParams.l || 'he',
            checkIn: decodedParams.i ? new Date(decodedParams.i) : null,
            checkOut: decodedParams.o ? new Date(decodedParams.o) : null,
            roomId: decodedParams.r,
            timestamp: decodedParams.t
          });
        }
        
        setError('');
      } catch (err) {
        console.error('שגיאה בטעינת נתוני תשלום:', err);
        setError(err.message || (paymentData.language === 'he' ? 'שגיאה בטעינת נתוני תשלום' : 'Error loading payment data'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchPaymentData();
  }, [paymentCode]);
  
  // טיפול במעבר לשלב הבא
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };
  
  // טיפול בחזרה לשלב הקודם
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  
  // עדכון פרטי כרטיס אשראי
  const handleCreditCardChange = (updatedData) => {
    setCreditCardData(updatedData);
  };
  
  // שמירת פרטי כרטיס האשראי
  const handleSubmitPayment = async () => {
    try {
      setLoading(true);
      
      // יצירת אובייקט הנתונים לשליחה
      const paymentSubmission = {
        bookingId: paymentData.bookingId,
        roomId: paymentData.roomId,
        guestName: paymentData.guestName,
        creditCard: {
          cardNumber: creditCardData.cardNumber,
          expiryDate: creditCardData.expiryDate,
          cvv: creditCardData.cvv
        }
      };
      
      // שליחת הנתונים לשרת
      await axios.post('/api/bookings/submit-payment', paymentSubmission);
      
      // עדכון שהתהליך הושלם
      setIsComplete(true);
      setActiveStep(2);
      setError('');
    } catch (err) {
      console.error('שגיאה בשמירת פרטי תשלום:', err);
      setError(paymentData.language === 'he' 
        ? 'שגיאה בשמירת פרטי התשלום. אנא נסה שנית.' 
        : 'Error saving payment details. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // שלבי תהליך התשלום
  const steps = [
    'אישור פרטי הזמנה',
    'הזנת פרטי אשראי',
    'סיום'
  ];
  
  // רינדור של תוכן לפי השלב הנוכחי
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <PaymentInfo 
            paymentData={paymentData} 
            onNext={handleNext}
          />
        );
      case 1:
        return (
          <PaymentForm 
            onBack={handleBack}
            onSubmit={handleSubmitPayment}
            onChange={handleCreditCardChange}
            creditCardData={creditCardData}
            loading={loading}
            language={paymentData.language}
          />
        );
      case 2:
        return (
          <Box sx={{ 
            textAlign: 'center', 
            py: { xs: 2, sm: 3 },
            px: { xs: 1, sm: 2 }
          }}>
            <CheckCircleIcon sx={{ 
              fontSize: { xs: 50, sm: 64 }, 
              color: 'success.main',
              mb: 2 
            }} />
            
            <Typography variant="h5" gutterBottom sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
              {paymentData.language === 'he' ? 'פרטי התשלום נשמרו בהצלחה!' : 'Payment details saved successfully!'}
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1, mb: 3, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              {paymentData.language === 'he' 
                ? 'פרטי כרטיס האשראי שלך נשמרו במערכת ויחויבו בהתאם למדיניות המלון.' 
                : 'Your credit card details have been saved and will be charged according to the hotel policy.'}
            </Typography>
            
            <Button 
              variant="contained" 
              onClick={() => window.close()}
              sx={{ mt: 2, px: { xs: 3, sm: 2 }, py: { xs: 1, sm: 0.5 } }}
            >
              {paymentData.language === 'he' ? 'סגור חלון' : 'Close Window'}
            </Button>
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };
  
  // תוכן כאשר יש שגיאה
  if (error) {
    const isHebrew = paymentData.language === 'he';
    return (
      <Container maxWidth="sm" sx={{ mt: { xs: 2, md: 4 }, mb: { xs: 2, md: 4 }, px: { xs: 2, sm: 3 } }}>
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <WarningIcon sx={{ fontSize: { xs: 50, sm: 64 }, color: 'error.main', mb: 2 }} />
            
            <Typography variant="h5" gutterBottom sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
              {isHebrew ? 'שגיאה' : 'Error'}
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1, mb: 3, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              {error === 'קוד תשלום חסר' && !isHebrew ? 'Payment code is missing' :
               error === 'פרמטרים חסרים בקישור' && !isHebrew ? 'Missing parameters in the payment link' :
               error === 'קישור התשלום פג תוקף' && !isHebrew ? 'Payment link has expired' :
               error === 'שגיאה בטעינת נתוני תשלום' && !isHebrew ? 'Error loading payment data' :
               error === 'שגיאה בשמירת פרטי התשלום. אנא נסה שנית.' && !isHebrew ? 'Error saving payment details. Please try again.' :
               error}
            </Typography>
            
            <Button 
              variant="contained" 
              onClick={() => window.location.reload()}
              sx={{ px: { xs: 3, sm: 2 }, py: { xs: 1, sm: 0.5 } }}
            >
              {isHebrew ? 'נסה שנית' : 'Try Again'}
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }
  
  // תוכן בזמן טעינה
  if (loading && activeStep === 0) {
    return (
      <Container maxWidth="sm" sx={{ mt: { xs: 2, md: 4 }, mb: { xs: 2, md: 4 }, px: { xs: 2, sm: 3 } }}>
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CircularProgress sx={{ mb: 2 }} />
            
            <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
              {paymentData.language === 'he' ? 'טוען פרטי הזמנה...' : 'Loading booking details...'}
            </Typography>
          </Box>
        </Paper>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ mt: { xs: 2, md: 4 }, mb: { xs: 2, md: 4 }, px: { xs: 2, sm: 3 } }}>
      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
        {/* כותרת */}
        <Box sx={{ 
          bgcolor: theme.palette.primary.main, 
          color: 'white',
          py: 2, 
          px: { xs: 2, sm: 3 },
          borderRadius: '8px 8px 0 0',
          mb: 3,
          mx: { xs: -2, md: -3 },
          mt: { xs: -2, md: -3 }
        }}>
          <Typography variant="h5" align="center" gutterBottom sx={{ fontSize: { xs: '1.3rem', sm: '1.5rem' } }}>
            {paymentData.language === 'he' ? 'תשלום מאובטח' : 'Secure Payment'}
          </Typography>
          
          <Typography variant="subtitle1" align="center">
            {paymentData.language === 'he' ? 'דיאם' : 'Diam'}
          </Typography>
        </Box>
        
        {/* שלבי התהליך */}
        <Stepper 
          activeStep={activeStep} 
          sx={{ 
            mb: { xs: 3, md: 4 },
            '& .MuiStepLabel-label': {
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }
          }}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{paymentData.language === 'he' ? label : 
                label === 'אישור פרטי הזמנה' ? 'Booking Details' : 
                label === 'הזנת פרטי אשראי' ? 'Credit Card Details' : 
                'Complete'
              }</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {/* תוכן השלב הנוכחי */}
        {getStepContent(activeStep)}
      </Paper>
    </Container>
  );
};

export default PaymentPage; 