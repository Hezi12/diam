import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  FormControlLabel,
  Switch,
  Typography,
  MenuItem,
  Paper,
  Box,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  InputAdornment,
  CircularProgress,
  Alert,
  DialogContentText,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { he } from 'date-fns/locale';
import { addDays, differenceInDays } from 'date-fns';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Person as PersonIcon,
  CreditCard as CreditCardIcon,
  Hotel as HotelIcon,
  Receipt as ReceiptIcon,
  Comment as CommentIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import axios from 'axios';

// רכיב של חישובי מחירים
import PriceCalculator from './PriceCalculator';

// רכיב דיאלוג יצירת חשבונית
import CreateInvoiceDialog from '../invoices/CreateInvoiceDialog';

/**
 * טופס ליצירה/עריכה של הזמנה
 */
const NewBookingForm = ({
  open,
  onClose,
  onSave,
  rooms,
  location,
  editBooking = null, // אופציונלי - הזמנה לעריכה
  initialData = null, // אופציונלי - נתונים התחלתיים
  onDelete = null // פונקציה למחיקת הזמנה
}) => {
  // הגדרת צבעים לפי מיקום
  const locationColors = {
    airport: {
      main: '#0071e3',
      bgLight: 'rgba(0, 113, 227, 0.08)'
    },
    rothschild: {
      main: '#4570e5',
      bgLight: 'rgba(69, 112, 229, 0.08)'
    }
  };

  // הגדרת צבעי אקסנט
  const accentColors = {
    green: '#06a271',
    red: '#e34a6f',
    orange: '#f7971e'
  };

  // הגדרת סגנון עיצוב
  const style = {
    card: {
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      p: 2.5,
    },
    button: {
      borderRadius: '4px',
      textTransform: 'none',
    },
    dialog: {
      borderRadius: '8px',
    }
  };

  const currentColors = locationColors[location] || locationColors.airport;

  // האם אנחנו במצב עריכה
  const isEditMode = !!editBooking;

  // הגדרת מצב התחלתי של הטופס - משמש לאיפוס בעת פתיחת טופס חדש
  const initialFormData = {
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
    guests: 2,
    
    // פרטי מחירים - מאופסים ל-0 
    price: 0,
    pricePerNight: 0,
    pricePerNightNoVat: 0,
    
    // פרטי תשלום
    paymentStatus: 'unpaid',
    paymentAmount: 0,
    discount: 0,
    creditCard: {
      cardNumber: '',
      expiryDate: '',
      cvv: '',
    },
    
    // פרטים נוספים
    source: 'direct',
    notes: '',
  };

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
    guests: 2,
    
    // פרטי מחירים
    price: 0,
    pricePerNight: 0,
    pricePerNightNoVat: 0,
    
    // פרטי תשלום
    paymentStatus: 'unpaid',
    paymentAmount: 0,
    discount: 0,
    creditCard: {
      cardNumber: '',
      expiryDate: '',
      cvv: '',
    },
    
    // פרטים נוספים
    source: 'direct',
    notes: '',
  });

  // מצב שדות תיקוף
  const [errors, setErrors] = useState({});

  // המצב של נעילת שדה מחיר לחישוב
  const [lockedField, setLockedField] = useState(null);

  // המצב של שדות נעולים בטופס
  const [lockedFields, setLockedFields] = useState({});

  // המצב של שגיאות כלליות
  const [error, setError] = useState('');

  // מצב חלון אישור המחיקה
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // מצב חלון יצירת חשבונית
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);

  // מצב תהליך שליחת הטופס
  const [isSubmitting, setIsSubmitting] = useState(false);

  // איפוס הטופס כאשר הדיאלוג נפתח
  useEffect(() => {
    if (open) {
      if (editBooking) {
        try {
          // מצב עריכה - מילוי הטופס בנתוני ההזמנה הקיימת
          const editFormData = {
            ...editBooking,
            // המרת רכיב חדר מאובייקט למזהה אם צריך
            room: typeof editBooking.room === 'object' && editBooking.room._id
              ? editBooking.room._id
              : editBooking.room,
            // המרת תאריכים לאובייקטי Date
            checkIn: new Date(editBooking.checkIn),
            checkOut: new Date(editBooking.checkOut),
          };
          setFormData(editFormData);

          // נעילת שדות אם ההזמנה במצב "הושלמה"
          if (editBooking.status === 'completed') {
            setLockedFields({
              room: true,
              checkIn: true,
              checkOut: true,
              isTourist: true,
            });
          } else {
            setLockedFields({});
          }
        } catch (error) {
          console.error('שגיאה בטעינת נתוני עריכה:', error);
          setError('שגיאה בטעינת פרטי ההזמנה לעריכה');
        }
      } else if (initialData) {
        // יש לנו נתונים התחלתיים (למשל מלחיצה על תא בלוח השנה)
        const defaultData = {
          // פרטי אורח
          firstName: '',
          lastName: '',
          phone: '',
          email: '',
          
          // פרטי הזמנה
          room: initialData.room || '',
          checkIn: initialData.checkIn || new Date(),
          checkOut: initialData.checkOut || addDays(new Date(), 1),
          nights: initialData.nights || differenceInDays(initialData.checkOut || addDays(new Date(), 1), initialData.checkIn || new Date()) || 1,
          isTourist: false,
          guests: 2,
          
          // פרטי מחירים
          price: 0,
          pricePerNight: 0,
          pricePerNightNoVat: 0,
          
          // פרטי תשלום
          paymentStatus: 'unpaid',
          paymentAmount: 0,
          discount: 0,
          creditCard: {
            cardNumber: '',
            expiryDate: '',
            cvv: '',
          },
          
          // סטטוס הזמנה ופרטים נוספים
          source: 'direct',
          status: 'pending',
          notes: '',
        };
        
        setFormData(defaultData);
        setLockedFields({});
        
        // אם יש חדר בנתונים ההתחלתיים, נטען את פרטי המחיר שלו
        if (initialData.room) {
          const roomFromProps = rooms.find(room => room._id === initialData.room);
          if (roomFromProps) {
            const price = defaultData.isTourist ? roomFromProps.basePrice : roomFromProps.vatPrice;
            setFormData(prev => ({
              ...prev,
              pricePerNight: price,
              pricePerNightNoVat: roomFromProps.basePrice,
              price: price * prev.nights
            }));
          }
        }
      } else {
        // מצב הזמנה חדשה - איפוס מלא של הטופס לערכי ברירת מחדל
      setFormData({
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
          guests: 2,
          
          // פרטי מחירים
          price: 0,
          pricePerNight: 0,
          pricePerNightNoVat: 0,
          
          // פרטי תשלום
          paymentStatus: 'unpaid',
          paymentAmount: 0,
          discount: 0,
          creditCard: {
            cardNumber: '',
            expiryDate: '',
            cvv: '',
          },
          
          // סטטוס הזמנה ופרטים נוספים
          source: 'direct',
          status: 'pending',
          notes: '',
        });
        setLockedFields({});
      }
      
      setErrors({});
      setLockedField(null);
      setError('');
    }
  }, [open, editBooking, initialData, rooms]);

  /**
   * טעינת הגדרות החדר והמחירים
   * @param {string} roomId - מזהה החדר
   * @returns {Promise<void>}
   */
  const fetchRoomData = async (roomId) => {
    if (!roomId) return;
    
    try {
      // בדיקה אם roomId הוא אובייקט, במקרה כזה נקח את ה-_id שלו
      const actualRoomId = typeof roomId === 'object' && roomId._id ? roomId._id : roomId;
      
      // ננסה קודם למצוא את החדר במערך החדרים המקומי
      const roomFromProps = rooms.find(room => room._id === actualRoomId);
      
      if (roomFromProps) {
        // חישוב מחירים לפי סטטוס תייר
        const vatPrice = roomFromProps.vatPrice || 0;
        const noVatPrice = roomFromProps.basePrice || 0;
        const pricePerNight = formData.isTourist ? noVatPrice : vatPrice;
        const pricePerNightNoVat = noVatPrice;
        
        // חישוב מחיר כולל לפי מספר הלילות
        const totalPrice = parseFloat((pricePerNight * formData.nights).toFixed(2));
        
        // עדכון הטופס
        setFormData(prev => ({
          ...prev,
          // וידוא שהחדר הוא מזהה ולא אובייקט
          room: actualRoomId,
          pricePerNight,
          pricePerNightNoVat,
          price: totalPrice
        }));
        
        return;
      }
      
      // אם לא מצאנו בפרופס, ננסה לקבל מהשרת
      const response = await axios.get(`/api/rooms/id/${actualRoomId}`);
      const roomData = response.data;
      
      if (roomData) {
        const vatPrice = roomData.vatPrice || 0;
        const noVatPrice = roomData.basePrice || 0;
        const pricePerNight = formData.isTourist ? noVatPrice : vatPrice;
        const pricePerNightNoVat = noVatPrice;
        
        // חישוב מחיר כולל לפי מספר הלילות
        const totalPrice = parseFloat((pricePerNight * formData.nights).toFixed(2));
        
        // עדכון הטופס
        setFormData(prev => ({
          ...prev,
          // וידוא שהחדר הוא מזהה ולא אובייקט
          room: actualRoomId,
          pricePerNight,
          pricePerNightNoVat,
          price: totalPrice
        }));
      }
    } catch (error) {
      console.error('שגיאה בטעינת פרטי החדר:', error);
      setError('שגיאה בטעינת פרטי החדר. נסה שנית מאוחר יותר.');
    }
  };

  // עדכון המחיר לפי בחירת החדר
  useEffect(() => {
    if (formData.room) {
      // איפוס המחיר הנוכחי לפני עדכון המחיר החדש
      setFormData(prev => ({
        ...prev,
        pricePerNight: 0,
        pricePerNightNoVat: 0,
        price: 0
      }));
      
      // טעינת המחיר מהחדר הנבחר
      fetchRoomData(formData.room);
    }
  }, [formData.room, formData.isTourist]);
  
  // עדכון המחיר הכולל כאשר מספר הלילות משתנה
  useEffect(() => {
    if (formData.pricePerNight && formData.nights) {
      // חישוב המחיר הכולל לפי מספר הלילות ומחיר ללילה
      const totalPrice = parseFloat((formData.pricePerNight * formData.nights).toFixed(2));
    
    setFormData(prev => ({
      ...prev,
        price: totalPrice
    }));
    }
  }, [formData.nights, formData.pricePerNight]);

  // חישוב מחיר והתאמות לפי תאריכים וחדר נבחר
  useEffect(() => {
    // חישוב מספר לילות
    if (formData.checkIn && formData.checkOut) {
      const nights = differenceInDays(formData.checkOut, formData.checkIn);
      
      // עדכון ערך הלילות בטופס
      setFormData(prev => ({ 
        ...prev, 
        nights: nights 
      }));
      
      // אם יש חדר נבחר, עדכן את המחירים בהתאם להגדרות החדר
      if (formData.room) {
        fetchRoomData(formData.room);
      }
    }
  }, [formData.checkIn, formData.checkOut, formData.room, formData.isTourist]);

  // בדיקת תקינות הטופס
  const validateForm = () => {
    const newErrors = {};
    
    // בדיקת שדות חובה לפי המודל בשרת
    if (!formData.firstName) newErrors.firstName = 'יש למלא שם פרטי';
    if (!formData.lastName) newErrors.lastName = 'יש למלא שם משפחה';
    if (!formData.room) newErrors.room = 'יש לבחור חדר';
    if (!formData.checkIn) newErrors.checkIn = 'יש לבחור תאריך צ\'ק-אין';
    if (!formData.checkOut) newErrors.checkOut = 'יש לבחור תאריך צ\'ק-אאוט';
    
    // בדיקת פורמט אימייל (אם הוזן)
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'כתובת אימייל לא תקינה';
    }
    
    // בדיקת תאריכים
    if (formData.checkIn && formData.checkOut && formData.checkIn >= formData.checkOut) {
      newErrors.checkOut = 'תאריך צ\'ק-אאוט חייב להיות אחרי צ\'ק-אין';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // טיפול בשינוי שדה בטופס
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // טיפול מיוחד עבור שדה room
    if (name === 'room') {
      // וידוא שערך room תמיד מאוחסן כ-ID ולא כאובייקט
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // טיפול בשינוי בפרטי תשלום
  const handlePaymentDetailChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      creditCard: {
        ...prev.creditCard,
        [name]: value
      }
    }));
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
      nights: nights,
      price: parseFloat((prev.pricePerNight * nights).toFixed(2))
    }));
  };

  // טיפול בשינוי תאריך צ'ק-אאוט
  const handleCheckOutChange = (date) => {
    const newCheckOut = date;
    
    // חישוב מספר לילות
    const nights = differenceInDays(newCheckOut, formData.checkIn);
    
    if (nights <= 0) {
      // אם מספר הלילות הוא 0 או שלילי, הגדר את צ'ק-אאוט ליום אחד אחרי צ'ק-אין
      const newDate = addDays(formData.checkIn, 1);
      
      setFormData(prev => ({
        ...prev,
        checkOut: newDate,
        nights: 1,
        price: parseFloat(prev.pricePerNight.toFixed(2))
      }));
      
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      checkOut: newCheckOut,
      nights: nights,
      price: parseFloat((prev.pricePerNight * nights).toFixed(2))
    }));
  };

  // טיפול בשינוי מספר לילות
  const handleNightsChange = (e) => {
    const nights = parseInt(e.target.value) || 0;
    
    if (nights <= 0) {
      setErrors(prev => ({ ...prev, nights: 'מספר לילות חייב להיות גדול מ-0' }));
      return;
    }
    
    // חישוב תאריך צ'ק-אאוט חדש
    const newCheckOut = addDays(formData.checkIn, nights);
    
    setFormData(prev => ({
      ...prev,
      checkOut: newCheckOut,
      nights: nights,
      price: parseFloat((prev.pricePerNight * nights).toFixed(2))
    }));
    
    setErrors(prev => ({ ...prev, nights: undefined }));
  };

  // טיפול בשינוי סטטוס תייר
  const handleTouristChange = (e) => {
    const isTourist = e.target.checked;
    
    // אם זה תייר, המחיר הוא בלי מע״מ
    setFormData(prev => {
      let pricePerNight;
      
      if (prev.room) {
        const selectedRoom = rooms.find(room => room._id === prev.room);
        pricePerNight = isTourist ? selectedRoom?.basePrice : selectedRoom?.vatPrice;
      } else {
        pricePerNight = isTourist ? prev.pricePerNightNoVat : 
          parseFloat((prev.pricePerNightNoVat * 1.18).toFixed(2));
      }
      
      return {
        ...prev,
        isTourist,
        pricePerNight: pricePerNight || prev.pricePerNight,
        price: parseFloat(((pricePerNight || prev.pricePerNight) * prev.nights).toFixed(2))
      };
    });
  };

  // טיפול בשמירת הטופס
  const handleSubmit = async () => {
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        // וידוא שיש שם משפחה אם לא הוזן
        const lastName = formData.lastName || formData.firstName;
        
        // בדיקה אם room הוא אובייקט והמרה למזהה אם צריך
        const room = typeof formData.room === 'object' && formData.room._id ? formData.room._id : formData.room;
        
        // מילוי שדות ברירת מחדל אם חסרים
        // מבנה JSON להזמנה חדשה/עדכון
        const bookingData = {
          firstName: formData.firstName,
          lastName: lastName,
          phone: formData.phone || '',
          email: formData.email || '',
          
          room: room,
          checkIn: formData.checkIn,
          checkOut: formData.checkOut,
          nights: formData.nights || 1,
          isTourist: formData.isTourist || false,
          
          price: formData.price || 0,
          pricePerNight: formData.pricePerNight || 0,
          pricePerNightNoVat: formData.pricePerNightNoVat || 0,
          
          paymentStatus: formData.paymentStatus || 'unpaid',
          creditCard: formData.creditCard || {
            cardNumber: '',
            expiryDate: '',
            cvv: ''
          },
          
          notes: formData.notes || '',
          
          location: location
        };
        
        // אם מדובר בעריכה, שמור את האיידי והשדות הנוספים
        if (isEditMode && editBooking?._id) {
          bookingData._id = editBooking._id;
          
          // שדות נוספים שהיו בהזמנה המקורית אך לא בטופס
          if (editBooking.createdAt) bookingData.createdAt = editBooking.createdAt;
          if (editBooking.updatedAt) bookingData.updatedAt = editBooking.updatedAt;
          if (editBooking.roomNumber) bookingData.roomNumber = editBooking.roomNumber;
        }
        
        // שליחת הנתונים לפונקציית השמירה/עדכון
        onSave(bookingData);
      } catch (error) {
        console.error('שגיאה בתהליך השליחה:', error);
        setError('אירעה שגיאה בעת שליחת הטופס. אנא נסה שנית.');
      } finally {
        setIsSubmitting(false);
      }
    }
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

  // פונקציות טיפול במחיקה
  const handleDeleteClick = () => {
    // ודא שיש פונקציית מחיקה ושאנחנו במצב עריכה עם הזמנה קיימת
    if (onDelete && editBooking && editBooking._id) {
      setDeleteConfirmOpen(true);
    } else {
      console.error('לא ניתן למחוק: חסרה פונקציית מחיקה או נתוני הזמנה');
    }
  };

  const handleDeleteBooking = () => {
    if (onDelete && editBooking?._id) {
      onDelete(editBooking._id);
      setDeleteConfirmOpen(false);
      onClose();
    } else {
      console.error('לא ניתן למחוק: חסרה פונקציית מחיקה או מזהה הזמנה');
      setDeleteConfirmOpen(false);
    }
  };

  // אפקט לטיפול בהמרת אובייקט room למזהה
  useEffect(() => {
    if (editBooking) {
      // בדיקה אם room הוא אובייקט והמרה למזהה
      if (editBooking.room && typeof editBooking.room === 'object' && editBooking.room._id) {
        // עדכון הפורמדטה עם המזהה של החדר במקום האובייקט
        setFormData(prev => ({
          ...prev,
          room: editBooking.room._id
        }));
      }
    }
  }, [editBooking]);

  // פתיחת דיאלוג חשבונית
  const handleInvoiceClick = () => {
    setInvoiceDialogOpen(true);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: style.dialog.borderRadius,
          overflow: 'hidden',
          width: '95%',
          maxWidth: '1000px'
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
          borderBottom: `1px solid ${currentColors.main}`,
          py: 1.5
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isEditMode ? null : <AddIcon sx={{ marginRight: '10px' }} />}
            <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
              {isEditMode 
                ? `עריכת הזמנה${editBooking?.bookingNumber ? ` ${editBooking.bookingNumber}` : ''} - ${location === 'airport' ? 'אור יהודה' : 'רוטשילד'}`
                : `הזמנה חדשה - ${location === 'airport' ? 'אור יהודה' : 'רוטשילד'}`
              }
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton 
            onClick={handleInvoiceClick} 
            size="small" 
            sx={{ color: currentColors.main, mr: 1 }}
            title="יצירת חשבונית"
          >
            <ReceiptIcon />
          </IconButton>
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
                ...(formData.paymentStatus === 'unpaid' && {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#e34a6f',
                    borderWidth: '2px'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#e34a6f'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#e34a6f'
                  }
                }),
                ...(['cash', 'credit_or_yehuda', 'credit_rothschild', 'transfer_mizrahi', 
                   'bit_mizrahi', 'paybox_mizrahi', 'transfer_poalim', 'bit_poalim', 
                   'paybox_poalim', 'other'].includes(formData.paymentStatus) && {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#06a271',
                    borderWidth: '2px'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#06a271'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#06a271'
                  }
                })
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
                borderRadius: style.card.borderRadius,
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
                borderRadius: style.card.borderRadius,
                boxShadow: style.card.boxShadow,
                borderTop: `3px solid ${currentColors.main}`
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <PersonIcon sx={{ color: currentColors.main, marginRight: '10px' }} />
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
                      inputProps={{
                        style: { 
                          textAlign: 'center',
                          paddingRight: '24px',
                          paddingLeft: '24px',
                          direction: 'rtl',
                        }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: style.button.borderRadius,
                        },
                        '& .MuiInputLabel-root': {
                          right: 18,
                          left: 'auto',
                          transformOrigin: 'top right'
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          textAlign: 'right',
                        },
                        '& .MuiInputLabel-shrink': {
                          transform: 'translate(0, -9px) scale(0.75)',
                          transformOrigin: 'top right'
                        }
                      }}
                  />
                </Grid>
                
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="שם משפחה"
                      fullWidth
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      required
                      size="small"
                      inputProps={{
                        style: { 
                          textAlign: 'center',
                          paddingRight: '24px',
                          paddingLeft: '24px',
                          direction: 'rtl',
                        }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: style.button.borderRadius,
                        },
                        '& .MuiInputLabel-root': {
                          right: 18,
                          left: 'auto',
                          transformOrigin: 'top right'
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          textAlign: 'right',
                        },
                        '& .MuiInputLabel-shrink': {
                          transform: 'translate(0, -9px) scale(0.75)',
                          transformOrigin: 'top right'
                        }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                  <TextField
                    label="טלפון"
                    fullWidth
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      size="small"
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
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: style.button.borderRadius,
                        },
                        '& .MuiInputLabel-root': {
                          right: 18,
                          left: 'auto',
                          transformOrigin: 'top right'
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          textAlign: 'right',
                        },
                        '& .MuiInputLabel-shrink': {
                          transform: 'translate(0, -9px) scale(0.75)',
                          transformOrigin: 'top right'
                        }
                      }}
                  />
                </Grid>
                
                  <Grid item xs={12} sm={6}>
                  <TextField
                    label="אימייל"
                    fullWidth
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                      size="small"
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
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: style.button.borderRadius,
                        },
                        '& .MuiInputLabel-root': {
                          right: 18,
                          left: 'auto',
                          transformOrigin: 'top right'
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          textAlign: 'right',
                        },
                        '& .MuiInputLabel-shrink': {
                          transform: 'translate(0, -9px) scale(0.75)',
                          transformOrigin: 'top right'
                        }
                      }}
                  />
                </Grid>
              </Grid>
              </Paper>
            </Grid>
            
            {/* חלק 2: פרטי כרטיס אשראי */}
            <Grid item xs={12} md={5}>
              <Paper sx={{ 
                p: 3, 
                borderRadius: style.card.borderRadius,
                boxShadow: style.card.boxShadow,
                borderTop: `3px solid ${accentColors.red}`
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <CreditCardIcon sx={{ color: accentColors.red, marginRight: '10px' }} />
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    פרטי אשראי לפיקדון
                  </Typography>
                </Box>
                
                <Grid container spacing={2}>
            <Grid item xs={12}>
                    <TextField
                      name="cardNumber"
                      label="מספר כרטיס"
                      fullWidth
                      value={formData.creditCard.cardNumber}
                      onChange={(e) => setFormData({
                        ...formData, 
                        creditCard: {...formData.creditCard, cardNumber: e.target.value}
                      })}
                      inputProps={{ maxLength: 16, dir: "ltr", style: { textAlign: 'center' } }}
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: style.button.borderRadius,
                        }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={6}>
                    <TextField
                      name="expiryDate"
                      label="תוקף"
                      fullWidth
                      value={formData.creditCard.expiryDate}
                      onChange={(e) => setFormData({
                        ...formData, 
                        creditCard: {...formData.creditCard, expiryDate: e.target.value}
                      })}
                      placeholder="MM/YY"
                      inputProps={{ maxLength: 5, dir: "ltr", style: { textAlign: 'center' } }}
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: style.button.borderRadius,
                        }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={6}>
                    <TextField
                      name="cvv"
                      label="CVV"
                      fullWidth
                      value={formData.creditCard.cvv}
                      onChange={(e) => setFormData({
                        ...formData, 
                        creditCard: {...formData.creditCard, cvv: e.target.value}
                      })}
                      inputProps={{ maxLength: 4, dir: "ltr", style: { textAlign: 'center' } }}
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: style.button.borderRadius,
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            
            {/* חלק 3: פרטי הזמנה */}
            <Grid item xs={12}>
              <Paper sx={{ 
                p: 3, 
                borderRadius: style.card.borderRadius,
                boxShadow: style.card.boxShadow,
                borderTop: `3px solid ${accentColors.green}`
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <HotelIcon sx={{ color: accentColors.green, marginRight: '10px' }} />
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                פרטי הזמנה
              </Typography>
                </Box>
              
              <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth error={!!errors.room} required size="small" sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: style.button.borderRadius,
                      },
                      '& .MuiSelect-select': {
                        paddingRight: '20px',
                        textAlign: 'center',
                      },
                      '& .MuiInputLabel-root': {
                        right: 18,
                        left: 'auto',
                        transformOrigin: 'top right'
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        textAlign: 'right',
                      },
                      '& .MuiInputLabel-shrink': {
                        transform: 'translate(0, -9px) scale(0.75)',
                        transformOrigin: 'top right'
                      }
                    }}>
                    <InputLabel>חדר</InputLabel>
                    <Select
                        name="room"
                      value={formData.room}
                        onChange={handleChange}
                        label="חדר"
                        disabled={rooms.length === 0}
                        size="small"
                    >
                        {rooms.map(room => (
                        <MenuItem key={room._id} value={room._id}>
                            {`חדר ${room.roomNumber} (${room.category})`}
                        </MenuItem>
                      ))}
                    </Select>
                      {errors.room && <FormHelperText>{errors.room}</FormHelperText>}
                  </FormControl>
                </Grid>
                
                  <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                      label="תאריך כניסה"
                    value={formData.checkIn}
                    onChange={handleCheckInChange}
                      disablePast={!isEditMode}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                          error: !!errors.checkIn,
                          helperText: errors.checkIn,
                          size: "small",
                          sx: {
                            '& .MuiOutlinedInput-root': {
                              borderRadius: style.button.borderRadius,
                            }
                          }
                      }
                    }}
                  />
                </Grid>
                
                  <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                      label="תאריך יציאה"
                    value={formData.checkOut}
                    onChange={handleCheckOutChange}
                    minDate={addDays(formData.checkIn, 1)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                          error: !!errors.checkOut,
                          helperText: errors.checkOut,
                          size: "small",
                          sx: {
                            '& .MuiOutlinedInput-root': {
                              borderRadius: style.button.borderRadius,
                            }
                          }
                      }
                    }}
                  />
                </Grid>
                
                  <Grid item xs={12} sm={6} md={3}>
                  <TextField
                      name="nights"
                    label="מספר לילות"
                    fullWidth
                      type="number"
                    value={formData.nights}
                      onChange={handleNightsChange}
                      error={!!errors.nights}
                      helperText={errors.nights}
                      inputProps={{ min: 1, style: { textAlign: 'center' } }}
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: style.button.borderRadius,
                        }
                      }}
                  />
                </Grid>
              </Grid>
              </Paper>
            </Grid>
            
            {/* חלק 4: פרטי מחיר */}
            <Grid item xs={12}>
              <Paper sx={{ 
                p: 3, 
                borderRadius: style.card.borderRadius,
                boxShadow: style.card.boxShadow,
                borderTop: `3px solid ${accentColors.green}`
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <ReceiptIcon sx={{ color: accentColors.green, marginRight: '10px' }} />
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    פרטי מחיר
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={formData.isTourist} 
                        onChange={handleTouristChange}
                        color="primary"
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: accentColors.green,
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: accentColors.green,
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
                  {/* רכיב חישוב מחירים */}
                  <PriceCalculator 
                    formData={formData}
                    setFormData={setFormData}
                    lockedField={lockedField}
                    setLockedField={setLockedField}
                    errors={errors}
                    setErrors={setErrors}
                    style={style}
                  />
                </Grid>
              </Paper>
            </Grid>
            
            {/* חלק 5: הערות */}
            <Grid item xs={12}>
              <Paper sx={{ 
                p: 3, 
                borderRadius: style.card.borderRadius,
                boxShadow: style.card.boxShadow,
                borderTop: `3px solid ${accentColors.orange}`
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <CommentIcon sx={{ color: accentColors.orange, marginRight: '10px' }} />
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    הערות
                  </Typography>
                </Box>
                
              <TextField
                  name="notes"
                fullWidth
                  multiline
                  rows={2}
                value={formData.notes}
                  onChange={handleChange}
                  size="small"
                  placeholder="הקלד הערות נוספות..."
                  inputProps={{
                    style: { 
                      textAlign: 'right',
                      paddingRight: '14px',
                      direction: 'rtl',
                    }
                  }}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: style.button.borderRadius,
                    },
                    '& textarea::placeholder': {
                      textAlign: 'right',
                      direction: 'rtl',
                    }
                  }}
                />
              </Paper>
            </Grid>
          </Grid>
        </LocalizationProvider>
      </DialogContent>
      
      <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
        {isEditMode && onDelete && (
          <Button 
            variant="contained"
            onClick={handleDeleteClick}
            color="error"
            sx={{ 
              bgcolor: accentColors.red, 
              '&:hover': { bgcolor: '#c64064' } 
            }}
            startIcon={<DeleteIcon />}
          >
            מחיקה
          </Button>
        )}
        <Box sx={{ ml: 'auto' }}>
          <Button onClick={onClose} sx={{ mx: 1 }}>ביטול</Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              isEditMode ? 'עדכון' : 'הוספה'
            )}
          </Button>
        </Box>
      </DialogActions>

      {/* חלון אישור מחיקה */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle sx={{ fontWeight: 600, color: accentColors.red }}>אישור מחיקה</DialogTitle>
        <DialogContent>
          <DialogContentText>
            האם אתה בטוח שברצונך למחוק את ההזמנה של {formData.firstName} {formData.lastName}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">ביטול</Button>
          <Button 
            onClick={handleDeleteBooking} 
            color="error" 
            variant="contained" 
            autoFocus
            sx={{ bgcolor: accentColors.red, '&:hover': { bgcolor: '#c64064' } }}
          >
            מחיקה
          </Button>
        </DialogActions>
      </Dialog>

      {/* דיאלוג יצירת חשבונית */}
      <CreateInvoiceDialog
        open={invoiceDialogOpen}
        onClose={() => setInvoiceDialogOpen(false)}
        bookingData={formData}
      />
    </Dialog>
  );
};

export default NewBookingForm;