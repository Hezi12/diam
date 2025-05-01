import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  FormHelperText,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';
import { differenceInDays, format, parse, parseISO, addDays } from 'date-fns';
import axios from 'axios';
import { STYLE_CONSTANTS } from '../../styles/StyleConstants';
import { useSnackbar } from 'notistack';
import BookingTabs from '../../components/bookings/BookingTabs';
import ImportBookings from '../../components/bookings/ImportBookings';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Save as SaveIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';

/**
 * דף הזנת הזמנות מהירה
 */
const QuickBooking = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [location, setLocation] = useState('airport');
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);

  // מצב הטופס
  const [formData, setFormData] = useState({
    firstName: '',
    rooms: 1, // חדר אחד
    checkIn: format(new Date(), 'yyyy-MM-dd'),
    checkOut: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    roomType: '',
    guests: 2,
    price: '',
    notes: '',
    source: 'direct',
    externalBookingNumber: '',
    primaryRoomId: '',
    status: 'confirmed'
  });

  // מצב טבלת ממירים
  const [roomTypeMappings, setRoomTypeMappings] = useState([]);
  const [showMappingsDialog, setShowMappingsDialog] = useState(false);
  const [newMapping, setNewMapping] = useState({
    textToMatch: '',
    primaryRoomId: ''
  });
  const [editingIndex, setEditingIndex] = useState(-1);

  // טעינת חדרים
  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/rooms/location/${location}`);
        // סינון חדרים שאינם למכירה
        const availableRooms = response.data.filter(room => room.category !== 'Not for Sale');
        setRooms(availableRooms);
      } catch (error) {
        console.error('שגיאה בטעינת חדרים:', error);
        enqueueSnackbar('שגיאה בטעינת רשימת החדרים', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [location, enqueueSnackbar]);

  // עדכון ימי שהייה בעת שינוי תאריכים
  useEffect(() => {
    if (formData.checkIn && formData.checkOut) {
      try {
        // המרת מחרוזות לאובייקטי תאריך באמצעות parseISO
        const checkInDate = typeof formData.checkIn === 'string' ? parseISO(formData.checkIn) : formData.checkIn;
        const checkOutDate = typeof formData.checkOut === 'string' ? parseISO(formData.checkOut) : formData.checkOut;
        
        const nights = differenceInDays(checkOutDate, checkInDate);
        if (nights >= 0) {
          setFormData(prev => ({ ...prev, nights }));
        }
      } catch (error) {
        console.error('שגיאה בחישוב מספר לילות:', error);
      }
    }
  }, [formData.checkIn, formData.checkOut]);

  // טעינת ממירים מהשרת
  const refreshRoomMappings = async () => {
    try {
      console.log('מרענן רשימת ממירי חדרים מהשרת...');
      const response = await axios.get(`/api/room-mappings/location/${location}`);
      if (response.data && Array.isArray(response.data)) {
        // המרת הנתונים מהשרת למבנה הנתונים של הממירים המקומיים
        const mappings = response.data.map(mapping => ({
          _id: mapping._id,
          textToMatch: mapping.textToMatch,
          primaryRoomId: mapping.primaryRoomId._id || mapping.primaryRoomId
        }));
        
        setRoomTypeMappings(mappings);
        
        // עדכון האחסון המקומי עם הנתונים המעודכנים מהשרת
        localStorage.setItem('roomTypeMappings', JSON.stringify(mappings));
        console.log('ממירי חדרים עודכנו בהצלחה', mappings.length);
      }
    } catch (error) {
      console.error('שגיאה בטעינת ממירי חדרים מהשרת:', error);
      
      // במקרה של שגיאה, ננסה לטעון מהאחסון המקומי כגיבוי
      const savedMappings = localStorage.getItem('roomTypeMappings');
      if (savedMappings) {
        try {
          const parsedMappings = JSON.parse(savedMappings);
          setRoomTypeMappings(parsedMappings);
          console.log('ממירי חדרים נטענו מהאחסון המקומי', parsedMappings.length);
        } catch (parseError) {
          console.error('שגיאה בניתוח ממירי חדרים מאחסון מקומי:', parseError);
        }
      }
    }
  };

  // טעינה ראשונית של ממירים כאשר הדף נטען
  useEffect(() => {
    refreshRoomMappings();
  }, [location]);

  // עדכון שמירת ממירים
  useEffect(() => {
    // רק אם יש שינוי בממירים (אחרי הטעינה הראשונית)
    if (roomTypeMappings.length > 0) {
      saveRoomMappingsToServer(roomTypeMappings);
    }
  }, [roomTypeMappings]);

  // טיפול בשינוי מיקום
  const handleLocationChange = (newLocation) => {
    setLocation(newLocation);
    setFormData(prev => ({ ...prev, roomType: '' }));
  };

  // טיפול בשינוי שדות
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // ניקוי שגיאות בעת שינוי שדה
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // טיפול בשינוי תאריך צ'ק-אין
  const handleCheckInChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, checkIn: value }));
    
    // ניקוי שגיאות בעת שינוי שדה
    if (errors.checkIn) {
      setErrors(prev => ({ ...prev, checkIn: '' }));
    }
  };

  // טיפול בשינוי תאריך צ'ק-אאוט
  const handleCheckOutChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, checkOut: value }));
    
    // ניקוי שגיאות בעת שינוי שדה
    if (errors.checkOut) {
      setErrors(prev => ({ ...prev, checkOut: '' }));
    }
  };

  // טיפול בשינוי שדה סוג יחידת דיור
  const handleRoomTypeChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, roomType: value }));
    
    // בדיקה אם קיים ממיר לערך הזה
    const mapping = roomTypeMappings.find(m => m.textToMatch.trim().toLowerCase() === value.trim().toLowerCase());
    if (mapping) {
      // בשלב זה רק שומרים את מיפוי הממיר, בדיקת הזמינות תתבצע בעת שליחת הטופס
      setFormData(prev => ({ 
        ...prev, 
        primaryRoomId: mapping.primaryRoomId
      }));
      
      // מציאת החדר המתאים
      const primaryRoom = rooms.find(r => r._id === mapping.primaryRoomId);
      
      let roomInfoText = '';
      if (primaryRoom) {
        roomInfoText = `חדר מתאים: ${primaryRoom.roomNumber} - ${primaryRoom.category}`;
      }
      
      if (roomInfoText) {
        enqueueSnackbar(roomInfoText, { variant: 'info' });
      }
    } else {
      setFormData(prev => ({ ...prev, primaryRoomId: '' }));
    }
    
    // ניקוי שגיאות בעת שינוי שדה
    if (errors.roomType) {
      setErrors(prev => ({ ...prev, roomType: '' }));
    }
  };

  // פתיחת דיאלוג ממירים
  const handleOpenMappingsDialog = () => {
    setShowMappingsDialog(true);
    setNewMapping({ textToMatch: '', primaryRoomId: '' });
    setEditingIndex(-1);
  };

  // הוספת ממיר חדש
  const handleAddMapping = async () => {
    if (!newMapping.textToMatch.trim() || !newMapping.primaryRoomId) {
      enqueueSnackbar('יש למלא לפחות טקסט לזיהוי וחדר ראשי', { variant: 'error' });
      return;
    }

    try {
      let response;
      
      if (editingIndex >= 0) {
        // עריכת ממיר קיים
        const updatedMapping = {
          ...newMapping,
          location
        };
        
        // אם יש לממיר מזהה, נשתמש בו לעדכון בשרת
        if (roomTypeMappings[editingIndex]._id) {
          const mappingId = roomTypeMappings[editingIndex]._id;
          response = await axios.put(`/api/room-mappings/${mappingId}`, {
            textToMatch: updatedMapping.textToMatch,
            primaryRoomId: updatedMapping.primaryRoomId
          });
          
          // עדכון הממיר במערך המקומי
          const updatedMappings = [...roomTypeMappings];
          updatedMappings[editingIndex] = { 
            ...response.data.mapping,
            primaryRoomId: response.data.mapping.primaryRoomId._id || response.data.mapping.primaryRoomId
          };
          setRoomTypeMappings(updatedMappings);
        } else {
          // הממיר אינו קיים בשרת, נשלח כחדש
          response = await axios.post('/api/room-mappings', {
            location,
            textToMatch: updatedMapping.textToMatch,
            primaryRoomId: updatedMapping.primaryRoomId
          });
          
          // עדכון הממיר במערך המקומי
          const updatedMappings = [...roomTypeMappings];
          updatedMappings[editingIndex] = {
            ...response.data.mapping,
            primaryRoomId: response.data.mapping.primaryRoomId._id || response.data.mapping.primaryRoomId
          };
          setRoomTypeMappings(updatedMappings);
        }
        
        setEditingIndex(-1);
      } else {
        // הוספת ממיר חדש
        response = await axios.post('/api/room-mappings', {
          location,
          textToMatch: newMapping.textToMatch,
          primaryRoomId: newMapping.primaryRoomId
        });
        
        // הוספת הממיר למערך המקומי
        setRoomTypeMappings(prev => [...prev, {
          ...response.data.mapping,
          primaryRoomId: response.data.mapping.primaryRoomId._id || response.data.mapping.primaryRoomId
        }]);
      }
      
      setNewMapping({ textToMatch: '', primaryRoomId: '' });
      enqueueSnackbar('הממיר נשמר בהצלחה בשרת', { variant: 'success' });
    } catch (error) {
      console.error('שגיאה בשמירת ממיר:', error);
      
      // במקרה של שגיאה, נשמור רק באחסון המקומי
      if (editingIndex >= 0) {
        // עריכת ממיר קיים
        const updatedMappings = [...roomTypeMappings];
        updatedMappings[editingIndex] = { ...newMapping };
        setRoomTypeMappings(updatedMappings);
        setEditingIndex(-1);
      } else {
        // הוספת ממיר חדש
        setRoomTypeMappings(prev => [...prev, { ...newMapping }]);
      }
      
      setNewMapping({ textToMatch: '', primaryRoomId: '' });
      enqueueSnackbar('הממיר נשמר באחסון מקומי בלבד (שגיאת שרת)', { variant: 'warning' });
    }
  };

  // עריכת ממיר
  const handleEditMapping = (index) => {
    setEditingIndex(index);
    setNewMapping({ ...roomTypeMappings[index] });
  };

  // מחיקת ממיר
  const handleDeleteMapping = async (index) => {
    try {
      const mappingToDelete = roomTypeMappings[index];
      
      // אם יש לממיר מזהה מהשרת, מחק אותו גם מהשרת
      if (mappingToDelete._id) {
        await axios.delete(`/api/room-mappings/${mappingToDelete._id}`);
        console.log(`ממיר נמחק מהשרת: ${mappingToDelete._id}`);
      }
      
      // מחיקה מהמערך המקומי
      const updatedMappings = [...roomTypeMappings];
      updatedMappings.splice(index, 1);
      setRoomTypeMappings(updatedMappings);
      
      // עדכון האחסון המקומי - חשוב למניעת הופעת הממיר מחדש
      localStorage.setItem('roomTypeMappings', JSON.stringify(updatedMappings));
      
      // רענון הממירים מהשרת
      await refreshRoomMappings();
      
      enqueueSnackbar('הממיר נמחק בהצלחה', { variant: 'info' });
    } catch (error) {
      console.error('שגיאה במחיקת ממיר:', error);
      
      // במקרה של שגיאה, מחק רק מהמערך המקומי
      const updatedMappings = [...roomTypeMappings];
      updatedMappings.splice(index, 1);
      setRoomTypeMappings(updatedMappings);
      
      // עדכון האחסון המקומי גם במקרה של שגיאה
      localStorage.setItem('roomTypeMappings', JSON.stringify(updatedMappings));
      
      enqueueSnackbar('הממיר נמחק מהאחסון המקומי בלבד (שגיאת שרת)', { variant: 'warning' });
    }
  };

  // עדכון אימות טופס
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'שם האורח נדרש';
    }
    
    if (formData.rooms !== 1) {
      newErrors.rooms = 'מספר החדרים חייב להיות 1';
    }
    
    if (!formData.roomType) {
      newErrors.roomType = 'יש להזין סוג יחידת דיור';
    }
    
    if (!formData.price) {
      newErrors.price = 'יש להזין מחיר';
    }
    
    if (formData.status !== 'confirmed' && formData.status !== 'cancelled_by_guest') {
      newErrors.status = 'הסטטוס חייב להיות ok או cancelled_by_guest';
    }
    
    // בדיקת תקינות פורמט תאריכים
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    
    if (!dateRegex.test(formData.checkIn)) {
      newErrors.checkIn = 'פורמט תאריך לא תקין. נדרש: YYYY-MM-DD';
    }
    
    if (!dateRegex.test(formData.checkOut)) {
      newErrors.checkOut = 'פורמט תאריך לא תקין. נדרש: YYYY-MM-DD';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // שליחת טופס
  const handleSubmit = async () => {
    if (!validateForm()) {
      setFormError('יש לתקן את השגיאות בטופס');
      return;
    }
    
    // אם הסטטוס הוא cancelled_by_guest, נציג הודעה ולא נשמור
    if (formData.status === 'cancelled_by_guest') {
      enqueueSnackbar('ההזמנה לא נשמרה כי הסטטוס הוא cancelled_by_guest', { variant: 'warning' });
      return;
    }
    
    setSubmitting(true);
    setFormError('');
    
    try {
      // בדיקה האם יש ממיר עבור טקסט יחידת הדיור
      const mapping = roomTypeMappings.find(
        m => m.textToMatch.trim().toLowerCase() === formData.roomType.trim().toLowerCase()
      );
      
      if (!mapping || !mapping.primaryRoomId) {
        setFormError('סוג יחידת הדיור לא מוגדר בטבלת הממירים. אנא הוסף אותו לטבלה.');
        setSubmitting(false);
        return;
      }
      
      // מנסים את החדר
      let selectedRoomId = mapping.primaryRoomId;
      let isRoomAvailable = false; // נתחיל עם לא זמין ואז נשנה בהתאם
      let selectedRoom = null;
      
      console.log('פרטי ממיר החדרים:', {
        textToMatch: mapping.textToMatch,
        primaryRoomId: mapping.primaryRoomId
      });
      
      // בדיקת זמינות החדר
      if (selectedRoomId) {
        try {
          console.log('בודק זמינות עבור חדר:', selectedRoomId, 'בתאריכים:', formData.checkIn, 'עד', formData.checkOut);
          
          // פורמט תאריכים תקין לבקשת ה-API
          const checkInFormatted = formData.checkIn.replace(/-/g, '/');
          const checkOutFormatted = formData.checkOut.replace(/-/g, '/');
          
          const availabilityResponse = await axios.get('/api/bookings/check-availability', {
            params: {
              roomId: selectedRoomId,
              checkIn: checkInFormatted,
              checkOut: checkOutFormatted
            }
          });
          
          console.log('תשובת בדיקת זמינות חדר:', availabilityResponse.data);
          isRoomAvailable = availabilityResponse.data.available;
          
          if (isRoomAvailable) {
            selectedRoom = rooms.find(r => r._id === selectedRoomId);
            console.log('החדר זמין:', selectedRoom?.roomNumber);
          }
        } catch (error) {
          console.error('שגיאה בבדיקת זמינות חדר:', error);
          isRoomAvailable = false;
        }
      }
      
      // אם החדר אינו זמין, הצג הודעת שגיאה
      if (!isRoomAvailable) {
        setFormError('אין חדר זמין בתאריכים המבוקשים. נסה תאריכים אחרים או סוג יחידת דיור אחר.');
        setSubmitting(false);
        return;
      }
      
      // בדיקה אם החדר קיים
      selectedRoom = rooms.find(r => r._id === selectedRoomId);
      if (!selectedRoom) {
        setFormError('החדר שנבחר אינו תקין');
        setSubmitting(false);
        return;
      }
      
      // הכנת נתוני ההזמנה
      const bookingData = {
        firstName: formData.firstName,
        lastName: '',
        checkIn: formData.checkIn.replace(/-/g, '/'), // פורמט תאריכים לפי דרישת השרת
        checkOut: formData.checkOut.replace(/-/g, '/'),
        room: selectedRoomId,
        location,
        source: formData.source,
        externalBookingNumber: formData.externalBookingNumber,
        status: 'confirmed', // תמיד נשמור מאושר
        notes: formData.notes,
        guests: parseInt(formData.guests),
        nights: parseInt(formData.nights),
        // חישוב האם מדובר בתייר
        isTourist: formData.bookerCountry !== 'il',
        price: parseFloat(formData.price),
        creditCard: {
          cardNumber: '',
          expiryDate: '',
          cvv: ''
        },
        paymentStatus: 'unpaid' // הוספת סטטוס תשלום כברירת מחדל
      };
      
      console.log('שולח נתוני הזמנה לשרת:', { ...bookingData, creditCard: '***מוסתר***', room: selectedRoomId });
      
      // שליחת הנתונים לשרת
      const response = await axios.post('/api/bookings', bookingData);
      
      enqueueSnackbar(`ההזמנה נוצרה בהצלחה עבור חדר ${selectedRoom.roomNumber}`, { variant: 'success' });
      
      // איפוס הטופס
      setFormData({
        firstName: '',
        rooms: 1, // חדר אחד
        checkIn: format(new Date(), 'yyyy-MM-dd'),
        checkOut: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
        roomType: '',
        guests: 2,
        price: '',
        notes: '',
        source: 'direct',
        externalBookingNumber: '',
        primaryRoomId: '',
        status: 'confirmed'
      });
      
    } catch (error) {
      console.error('שגיאה ביצירת הזמנה:', error);
      
      let errorMessage = 'שגיאה ביצירת ההזמנה';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      setFormError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // אפשרויות מקור הזמנה (מסונכרן עם הסכמה של מונגו)
  const bookingSources = [
    { value: 'direct', label: 'ישיר' },
    { value: 'home_website', label: 'אתר הבית (Home Website)' },
    { value: 'diam', label: 'Diam' },
    { value: 'airport_stay', label: 'Airport Stay' },
    { value: 'rothschild_stay', label: 'Rothschild Stay' },
    { value: 'booking', label: 'Booking.com' },
    { value: 'expedia', label: 'Expedia' },
    { value: 'airbnb', label: 'Airbnb' },
    { value: 'agoda', label: 'Agoda' },
    { value: 'other', label: 'אחר' },
  ];

  // אפשרויות סטטוס
  const statusOptions = [
    { value: 'confirmed', label: 'ok' },
    { value: 'cancelled_by_guest', label: 'cancelled_by_guest' },
  ];

  // טיפול בשינוי שדות הממיר
  const handleMappingChange = (e) => {
    const { name, value } = e.target;
    setNewMapping(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // טיפול בפתיחת דיאלוג ייבוא
  const handleOpenImportDialog = () => {
    setShowImportDialog(true);
  };

  // טיפול בסגירת דיאלוג ייבוא
  const handleCloseImportDialog = () => {
    setShowImportDialog(false);
  };

  // שמירת ממירים בשרת כאשר הם משתנים
  const saveRoomMappingsToServer = async (mappings) => {
    try {
      // שמירה בשרת
      for (const mapping of mappings) {
        // בדיקה אם יש לממיר מזהה (אם הוא חדש או קיים)
        if (!mapping._id) {
          // ממיר חדש - יצירה בשרת
          await axios.post('/api/room-mappings', {
            location,
            textToMatch: mapping.textToMatch,
            primaryRoomId: mapping.primaryRoomId
          });
        }
      }
      
      // שמירה באחסון מקומי כגיבוי
      localStorage.setItem('roomTypeMappings', JSON.stringify(mappings));
      
      // מסיר את הקריאה לרענון כדי למנוע לולאה אינסופית
      console.log('ממירי חדרים נשמרו בהצלחה באחסון מקומי ובשרת');
    } catch (error) {
      console.error('שגיאה בשמירת ממירי חדרים בשרת:', error);
      enqueueSnackbar('שמירת הממירים בשרת נכשלה. ננסה שוב מאוחר יותר', { variant: 'error' });
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 5 }}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          borderRadius: 2,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          borderTop: `3px solid ${STYLE_CONSTANTS.colors[location]?.main || STYLE_CONSTANTS.colors.airport.main}`,
        }}
      >
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight={500}>הזנת הזמנה מהירה</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button 
              variant="outlined" 
              color="primary" 
              size="small" 
              onClick={handleOpenImportDialog}
              startIcon={<CloudUploadIcon />}
            >
              ייבוא הזמנות
            </Button>
            <Button 
              variant="outlined" 
              color="primary" 
              size="small" 
              onClick={handleOpenMappingsDialog}
              startIcon={<EditIcon />}
            >
              ניהול ממירי חדרים
            </Button>
            <BookingTabs location={location} onLocationChange={handleLocationChange} />
          </Box>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {formError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {formError}
          </Alert>
        )}
        
        <Grid container spacing={3}>
          {/* שורה ראשונה */}
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>מתחם</InputLabel>
              <Select
                value={location}
                label="מתחם"
                name="location"
                onChange={(e) => handleLocationChange(e.target.value)}
                disabled
              >
                <MenuItem value="airport">Airport Guest House</MenuItem>
                <MenuItem value="rothschild">Rothschild</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>מקור הזמנה</InputLabel>
              <Select
                value={formData.source}
                label="מקור הזמנה"
                name="source"
                onChange={handleChange}
              >
                {bookingSources.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="מספר הזמנה"
              name="externalBookingNumber"
              value={formData.externalBookingNumber}
              onChange={handleChange}
              placeholder="מספר הזמנה חיצוני"
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="שם האורח/ים"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="שם האורח"
              error={!!errors.firstName}
              helperText={errors.firstName}
              required
            />
          </Grid>
          
          {/* שורה שנייה */}
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="צ'ק אין"
              name="checkIn"
              value={formData.checkIn}
              onChange={handleCheckInChange}
              placeholder="2025-04-30"
              error={!!errors.checkIn}
              helperText={errors.checkIn || "פורמט: YYYY-MM-DD"}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="צ'ק אאוט"
              name="checkOut"
              value={formData.checkOut}
              onChange={handleCheckOutChange}
              placeholder="2025-05-01"
              error={!!errors.checkOut}
              helperText={errors.checkOut || "פורמט: YYYY-MM-DD"}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small" error={!!errors.status}>
              <InputLabel>סטטוס</InputLabel>
              <Select
                value={formData.status}
                label="סטטוס"
                name="status"
                onChange={handleChange}
              >
                {statusOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.status && <FormHelperText>{errors.status}</FormHelperText>}
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="חדרים"
              name="rooms"
              type="number"
              value={formData.rooms}
              onChange={handleChange}
              error={!!errors.rooms}
              helperText={errors.rooms || "חייב להיות 1"}
              inputProps={{ min: 1, max: 1 }}
            />
          </Grid>
          
          {/* שורה שלישית */}
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="אנשים"
              name="guests"
              type="number"
              value={formData.guests}
              onChange={handleChange}
              inputProps={{ min: 1 }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="מחיר"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              error={!!errors.price}
              helperText={errors.price}
              required
              InputProps={{
                endAdornment: <InputLabel>₪</InputLabel>,
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="הערות"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              multiline
              rows={1}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Booker country"
              name="bookerCountry"
              value={formData.bookerCountry}
              onChange={handleChange}
              placeholder="il"
              helperText="כל ערך שאינו 'il' ייחשב כתייר"
            />
          </Grid>
          
          {/* שורה רביעית */}
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="סוג יחידת דיור"
              name="roomType"
              value={formData.roomType}
              onChange={handleRoomTypeChange}
              placeholder="למשל: Double Room"
              error={!!errors.roomType}
              helperText={errors.roomType || "הזן סוג יחידת דיור"}
              required
            />
          </Grid>
          
          <Grid item xs={12} md={9}>
            {/* שדות נוספים אם נדרש */}
          </Grid>
          
          {/* כפתורים */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={submitting}
                sx={{ borderRadius: '4px', minWidth: '120px' }}
              >
                {submitting ? <CircularProgress size={24} color="inherit" /> : 'שמור הזמנה'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* דיאלוג ניהול ממירי חדרים */}
      <Dialog 
        open={showMappingsDialog} 
        onClose={() => setShowMappingsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          ניהול ממירי סוגי יחידות דיור
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ mb: 3, mt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              הגדר טקסט למיפוי אוטומטי לחדרים. כאשר תזין את הטקסט המדויק בשדה "סוג יחידת דיור", 
              המערכת תנסה להשתמש בחדר העדיפות הראשונה. אם הוא תפוס, היא תנסה את חדר העדיפות השנייה.
            </Typography>
            
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="טקסט לזיהוי"
                  name="textToMatch"
                  value={newMapping.textToMatch}
                  onChange={handleMappingChange}
                  placeholder="למשל: Double Room"
                />
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>חדר ראשי (עדיפות 1)</InputLabel>
                  <Select
                    value={newMapping.primaryRoomId}
                    label="חדר ראשי (עדיפות 1)"
                    name="primaryRoomId"
                    onChange={handleMappingChange}
                  >
                    {rooms.map(room => (
                      <MenuItem key={room._id} value={room._id}>
                        {room.roomNumber} - {room.category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={2}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={handleAddMapping}
                  startIcon={editingIndex >= 0 ? <SaveIcon /> : <AddIcon />}
                >
                  {editingIndex >= 0 ? 'שמור' : 'הוסף'}
                </Button>
              </Grid>
            </Grid>
          </Box>
          
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'background.default' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>טקסט לזיהוי</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>חדר ראשי (עדיפות 1)</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>פעולות</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roomTypeMappings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        לא הוגדרו ממירים. הוסף ממיר חדש.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  roomTypeMappings.map((mapping, index) => {
                    // מציאת החדר המתאימים
                    const primaryRoom = rooms.find(r => r._id === mapping.primaryRoomId);
                    const primaryRoomDisplay = primaryRoom ? `${primaryRoom.roomNumber} - ${primaryRoom.category}` : 'חדר לא נמצא';
                    
                    return (
                      <TableRow key={index}>
                        <TableCell>{mapping.textToMatch}</TableCell>
                        <TableCell>{primaryRoomDisplay}</TableCell>
                        <TableCell align="center">
                          <IconButton 
                            size="small" 
                            color="primary" 
                            onClick={() => handleEditMapping(index)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => handleDeleteMapping(index)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowMappingsDialog(false)}>סגור</Button>
        </DialogActions>
      </Dialog>

      {/* דיאלוג ייבוא הזמנות */}
      <ImportBookings
        open={showImportDialog}
        onClose={handleCloseImportDialog}
        location={location}
        roomTypeMappings={roomTypeMappings}
        rooms={rooms}
      />
    </Container>
  );
};

export default QuickBooking; 