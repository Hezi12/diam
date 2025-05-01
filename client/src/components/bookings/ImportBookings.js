import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  CircularProgress,
  LinearProgress,
  Checkbox,
  ListItemIcon,
  FormControlLabel
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { format, parse, isValid } from 'date-fns';

/**
 * קומפוננטת ייבוא הזמנות מקובץ אקסל/CSV
 */
const ImportBookings = ({ open, onClose, location, roomTypeMappings, rooms }) => {
  // מצבים לניהול תהליך הייבוא
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedBookings, setProcessedBookings] = useState([]);
  const [selectedBookings, setSelectedBookings] = useState([]);
  const [selectAll, setSelectAll] = useState(true);
  const [results, setResults] = useState({
    added: [],
    deleted: [],
    errors: [],
    skipped: []
  });
  const [showResults, setShowResults] = useState(false);
  const [confirmationMode, setConfirmationMode] = useState(false);
  const [error, setError] = useState('');
  
  // מצבים חדשים לטיפול בבחירת חדרים ידנית
  const [manualRoomAssignmentMode, setManualRoomAssignmentMode] = useState(false);
  const [bookingRequiringManualAssignment, setBookingRequiringManualAssignment] = useState(null);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedRooms, setSelectedRooms] = useState([]); // מערך לבחירת חדרים מרובים
  const [manualAssignmentResults, setManualAssignmentResults] = useState({});

  // איפוס המצב כאשר הדיאלוג נפתח או נסגר
  const resetState = () => {
    setFile(null);
    setIsProcessing(false);
    setProgress(0);
    setProcessedBookings([]);
    setSelectedBookings([]);
    setSelectAll(true);
    setResults({
      added: [],
      deleted: [],
      errors: [],
      skipped: []
    });
    setShowResults(false);
    setConfirmationMode(false);
    setError('');
    setManualRoomAssignmentMode(false);
    setBookingRequiringManualAssignment(null);
    setAvailableRooms([]);
    setSelectedRoom('');
    setSelectedRooms([]);
    setManualAssignmentResults({});
  };

  // טיפול בסגירת הדיאלוג
  const handleClose = () => {
    resetState();
    onClose();
  };

  // הגדרת אזור גרירת הקבצים
  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    multiple: false
  });

  /**
   * פענוח קובץ אקסל/CSV ומיפוי לפורמט המערכת
   */
  const parseFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          // קריאת הקובץ באמצעות ספריית XLSX
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          
          // המרה לפורמט JSON ופיענוח מהשורה השנייה (להתעלם מהכותרות)
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
          
          if (jsonData.length < 2) {
            reject('הקובץ ריק או חסר נתונים');
            return;
          }
          
          // שורת הכותרות
          const headers = jsonData[0];
          
          // מיפוי אינדקסים של העמודות לפי הכותרות
          const columnMap = {
            bookingNumber: headers.findIndex(h => h === 'מספר הזמנה'),
            guestName: headers.findIndex(h => h === 'שם האורח/ים'),
            checkIn: headers.findIndex(h => h === 'צ\'ק-אין'),
            checkOut: headers.findIndex(h => h === 'צ\'ק-אאוט'),
            status: headers.findIndex(h => h === 'סטטוס'),
            rooms: headers.findIndex(h => h === 'חדרים'),
            guests: headers.findIndex(h => h === 'אנשים'),
            price: headers.findIndex(h => h === 'מחיר'),
            notes: headers.findIndex(h => h === 'הערות'),
            bookerCountry: headers.findIndex(h => h === 'Booker country'),
            roomType: headers.findIndex(h => h === 'סוג יחידת האירוח')
          };
          
          // וידוא שכל השדות הנדרשים קיימים
          const requiredColumns = ['checkIn', 'checkOut', 'status', 'roomType']; // שם האורח כבר לא חובה
          const missingColumns = requiredColumns.filter(col => columnMap[col] === -1);
          
          if (missingColumns.length > 0) {
            reject(`חסרות עמודות חובה: ${missingColumns.join(', ')}`);
            return;
          }
          
          console.log('התחלת עיבוד קובץ עם מספר שורות:', jsonData.length - 1);
          
          // עיבוד שורות הנתונים (מהשורה השנייה ואילך)
          const bookingsData = jsonData.slice(1).map((row, index) => {
            // דילוג על שורות עם שגיאות פענוח
            if (!row.length) {
              console.log(`שורה ${index + 2} ריקה - דילוג`);
              return {
                lineNumber: index + 2,
                error: 'שורה ריקה',
                rawData: row
              };
            }
            
            try {
              // המרת תאריכים לפורמט תקין
              let checkIn = row[columnMap.checkIn];
              let checkOut = row[columnMap.checkOut];
              
              if (typeof checkIn === 'string') {
                try {
                  // נסיון פרסור תאריך ממחרוזת
                  const dateObj = parse(checkIn, 'yyyy-MM-dd', new Date());
                  if (isValid(dateObj)) {
                    checkIn = format(dateObj, 'yyyy-MM-dd');
                  } else {
                    // אם הפרסור לא הצליח, ננסה פורמטים אחרים
                    const possibleFormats = ['dd/MM/yyyy', 'MM/dd/yyyy', 'dd-MM-yyyy', 'MM-dd-yyyy', 'yyyy/MM/dd'];
                    
                    for (const fmt of possibleFormats) {
                      const parsedDate = parse(checkIn, fmt, new Date());
                      if (isValid(parsedDate)) {
                        checkIn = format(parsedDate, 'yyyy-MM-dd');
                        break;
                      }
                    }
                  }
                } catch (error) {
                  console.warn(`בעיה בפרסור תאריך צ'ק-אין (${checkIn}):`, error.message);
                  // נסיון נוסף בפרסור רגיל
                  const dateObj = new Date(checkIn);
                  if (isValid(dateObj)) {
                    checkIn = format(dateObj, 'yyyy-MM-dd');
                  } else {
                    throw new Error(`לא ניתן לפרסר את תאריך הצ'ק-אין: ${checkIn}`);
                  }
                }
              } else if (typeof checkIn === 'number') {
                // אם התאריך הוא מספר (מספר סידורי באקסל)
                try {
                  const excelDate = XLSX.SSF.parse_date_code(checkIn);
                  checkIn = `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`;
                } catch (error) {
                  console.error(`שגיאה בפענוח מספר סידורי של תאריך: ${checkIn}`, error);
                  throw new Error(`תאריך צ'ק-אין לא תקין (${checkIn})`);
                }
              } else if (checkIn instanceof Date) {
                // אם התאריך הוא אובייקט Date
                if (isValid(checkIn)) {
                  checkIn = format(checkIn, 'yyyy-MM-dd');
                } else {
                  throw new Error(`תאריך צ'ק-אין לא תקין`);
                }
              } else {
                console.error('סוג תאריך צ\'ק-אין לא מזוהה:', typeof checkIn, checkIn);
                throw new Error(`תאריך צ'ק-אין לא תקין או חסר`);
              }
              
              if (typeof checkOut === 'string') {
                try {
                  // נסיון פרסור תאריך ממחרוזת
                  const dateObj = parse(checkOut, 'yyyy-MM-dd', new Date());
                  if (isValid(dateObj)) {
                    checkOut = format(dateObj, 'yyyy-MM-dd');
                  } else {
                    // אם הפרסור לא הצליח, ננסה פורמטים אחרים
                    const possibleFormats = ['dd/MM/yyyy', 'MM/dd/yyyy', 'dd-MM-yyyy', 'MM-dd-yyyy', 'yyyy/MM/dd'];
                    
                    for (const fmt of possibleFormats) {
                      const parsedDate = parse(checkOut, fmt, new Date());
                      if (isValid(parsedDate)) {
                        checkOut = format(parsedDate, 'yyyy-MM-dd');
                        break;
                      }
                    }
                  }
                } catch (error) {
                  console.warn(`בעיה בפרסור תאריך צ'ק-אאוט (${checkOut}):`, error.message);
                  // נסיון נוסף בפרסור רגיל
                  const dateObj = new Date(checkOut);
                  if (isValid(dateObj)) {
                    checkOut = format(dateObj, 'yyyy-MM-dd');
                  } else {
                    throw new Error(`לא ניתן לפרסר את תאריך הצ'ק-אאוט: ${checkOut}`);
                  }
                }
              } else if (typeof checkOut === 'number') {
                // אם התאריך הוא מספר (מספר סידורי באקסל)
                try {
                  const excelDate = XLSX.SSF.parse_date_code(checkOut);
                  checkOut = `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`;
                } catch (error) {
                  console.error(`שגיאה בפענוח מספר סידורי של תאריך: ${checkOut}`, error);
                  throw new Error(`תאריך צ'ק-אאוט לא תקין (${checkOut})`);
                }
              } else if (checkOut instanceof Date) {
                // אם התאריך הוא אובייקט Date
                if (isValid(checkOut)) {
                  checkOut = format(checkOut, 'yyyy-MM-dd');
                } else {
                  throw new Error(`תאריך צ'ק-אאוט לא תקין`);
                }
              } else {
                console.error('סוג תאריך צ\'ק-אאוט לא מזוהה:', typeof checkOut, checkOut);
                throw new Error(`תאריך צ'ק-אאוט לא תקין או חסר`);
              }
              
              // אימות סדר התאריכים
              try {
                const checkInDate = new Date(checkIn);
                const checkOutDate = new Date(checkOut);
                
                if (checkOutDate <= checkInDate) {
                  console.warn(`תאריך צ'ק-אאוט (${checkOut}) קודם או זהה לתאריך צ'ק-אין (${checkIn}) בשורה ${index + 2}`);
                  throw new Error(`תאריך צ'ק-אאוט חייב להיות מאוחר מתאריך צ'ק-אין`);
                }
                
                // בדיקה שההפרש בין התאריכים סביר (לא יותר מ-30 יום)
                const diffTime = Math.abs(checkOutDate - checkInDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays > 30) {
                  console.warn(`הפרש חריג בין התאריכים (${diffDays} ימים) בשורה ${index + 2}`);
                }
              } catch (error) {
                if (!error.message.includes('צ\'ק-אאוט חייב להיות מאוחר')) {
                  console.error('שגיאה באימות סדר התאריכים:', error);
                }
                throw error;
              }
              
              console.log(`תאריכים לאחר עיבוד בשורה ${index + 2}:`, { checkIn, checkOut });
              
              // לקיחת שם האורח - אם חסר, משתמשים בערך ברירת מחדל
              let guestName = row[columnMap.guestName];
              if (!guestName || String(guestName).trim() === '') {
                console.log(`שורה ${index + 2} ללא שם אורח - משתמש בשם ברירת מחדל`);
                guestName = 'אורח ללא שם';
              }
              
              // המרת סטטוס למבנה הנכון
              let status = row[columnMap.status] || '';
              status = status.toLowerCase();
              
              // המרת סטטוס למבנה המערכת
              if (status === 'ok') {
                status = 'confirmed';
              } else if (status.includes('cancel')) {
                status = 'cancelled';
              }
              
              // המרת מספר החדרים לטיפוס מספרי
              const rooms = parseInt(row[columnMap.rooms]) || 1;
              
              // המרת מספר האורחים לטיפוס מספרי
              const guests = parseInt(row[columnMap.guests]) || 2;
              
              // המרת המחיר לטיפוס מספרי
              const price = parseFloat(row[columnMap.price]) || 0;
              
              // לקיחת ערך סוג יחידת האירוח - שמירה על הערך המקורי (גם אם הוא מספר)
              const roomType = row[columnMap.roomType];

              // רישום מידע על ערך סוג יחידת האירוח לצורכי דיבוג
              console.log(`סוג יחידת האירוח בשורה ${index + 2}:`, {
                value: roomType,
                type: typeof roomType
              });
              
              // יצירת אובייקט נתוני ההזמנה
              return {
                lineNumber: index + 2, // מספר השורה בקובץ (מתחיל מ-2 כי שורה 1 היא כותרות)
                externalBookingNumber: row[columnMap.bookingNumber] || '',
                firstName: guestName,
                checkIn,
                checkOut,
                status,
                rooms,
                guests,
                price,
                notes: row[columnMap.notes] || '',
                bookerCountry: (row[columnMap.bookerCountry] || '').toLowerCase(),
                roomType: roomType,
                // נתונים נוספים שנחשב בהמשך
                rawData: row
              };
            } catch (err) {
              console.error(`שגיאה בעיבוד שורה ${index + 2}:`, err);
              return {
                lineNumber: index + 2,
                error: `שגיאת עיבוד: ${err.message}`,
                rawData: row
              };
            }
          }).filter(booking => booking !== null);
          
          resolve(bookingsData);
        } catch (err) {
          console.error('שגיאה בפענוח הקובץ:', err);
          reject(`שגיאה בפענוח הקובץ: ${err.message}`);
        }
      };
      
      reader.onerror = (e) => {
        reject('שגיאה בקריאת הקובץ');
      };
      
      reader.readAsArrayBuffer(file);
    });
  };

  /**
   * עיבוד הזמנה בשלב הסופי - שמירה בפועל
   */
  const finalizeBooking = async (processedBooking) => {
    try {
      if (processedBooking.result === 'add') {
        // יצירת הזמנה חדשה
        const response = await axios.post('/api/bookings', processedBooking.bookingData);
        
        // החזרת אובייקט התוצאה
        return {
          result: 'added',
          id: response.data._id,
          bookingNumber: response.data.bookingNumber,
          roomNumber: processedBooking.bookingData.roomNumber || '',
          checkIn: processedBooking.bookingData.checkIn,
          checkOut: processedBooking.bookingData.checkOut,
          guestName: processedBooking.bookingData.firstName,
          origRow: processedBooking.booking?.lineNumber || 0,
          roomType: processedBooking.booking?.roomType || '',
          // שכפול של אובייקט ה-booking המקורי כדי למנוע שגיאות גישה
          booking: {
            firstName: processedBooking.bookingData.firstName,
            checkIn: processedBooking.bookingData.checkIn,
            checkOut: processedBooking.bookingData.checkOut,
            externalBookingNumber: processedBooking.bookingData.externalBookingNumber || '',
            lineNumber: processedBooking.booking?.lineNumber || 0,
            roomType: processedBooking.booking?.roomType || processedBooking.bookingData.room || '',
            status: 'confirmed'
          }
        };
      } else if (processedBooking.result === 'error') {
        // החזרת שגיאת עיבוד
        return {
          result: 'error',
          origRow: processedBooking.booking?.lineNumber || 0,
          error: processedBooking.error || 'שגיאה לא ידועה',
          guestName: processedBooking.booking?.firstName || '',
          roomType: processedBooking.booking?.roomType || '',
          // שכפול של אובייקט ה-booking המקורי
          booking: processedBooking.booking ? {
            ...processedBooking.booking,
            firstName: processedBooking.booking.firstName || 'אורח',
            lineNumber: processedBooking.booking.lineNumber || 0
          } : {
            firstName: 'אורח',
            lineNumber: 0,
            checkIn: '',
            checkOut: '',
            roomType: '',
            status: 'error'
          }
        };
      } else if (processedBooking.result === 'skip') {
        // החזרת תוצאת דילוג
        return {
          result: 'skipped',
          origRow: processedBooking.booking?.lineNumber || 0,
          reason: processedBooking.reason || 'דילוג',
          guestName: processedBooking.booking?.firstName || '',
          roomType: processedBooking.booking?.roomType || '',
          // שכפול של אובייקט ה-booking המקורי
          booking: processedBooking.booking ? {
            ...processedBooking.booking,
            firstName: processedBooking.booking.firstName || 'אורח',
            lineNumber: processedBooking.booking.lineNumber || 0
          } : {
            firstName: 'אורח',
            lineNumber: 0,
            checkIn: '',
            checkOut: '',
            roomType: '',
            status: 'skipped'
          }
        };
      } else {
        // מקרה ברירת מחדל - החזרת דילוג
        return {
          result: 'skipped',
          origRow: processedBooking.booking?.lineNumber || 0,
          reason: 'סוג תוצאה לא מוכר',
          guestName: processedBooking.booking?.firstName || '',
          roomType: processedBooking.booking?.roomType || '',
          // שכפול של אובייקט ה-booking המקורי
          booking: processedBooking.booking ? {
            ...processedBooking.booking,
            firstName: processedBooking.booking.firstName || 'אורח',
            lineNumber: processedBooking.booking.lineNumber || 0
          } : {
            firstName: 'אורח',
            lineNumber: 0,
            checkIn: '',
            checkOut: '',
            roomType: '',
            status: 'unknown'
          }
        };
      }
    } catch (error) {
      console.error('שגיאה בסיום הטיפול בהזמנה:', error);
      
      // החזרת שגיאת שרת
      return {
        result: 'error',
        origRow: processedBooking.booking?.lineNumber || 0,
        error: `שגיאת שרת: ${error.response?.data?.message || error.message}`,
        guestName: processedBooking.booking?.firstName || '',
        roomType: processedBooking.booking?.roomType || '',
        // שכפול של אובייקט ה-booking המקורי
        booking: processedBooking.booking ? {
          ...processedBooking.booking,
          firstName: processedBooking.booking.firstName || 'אורח',
          lineNumber: processedBooking.booking.lineNumber || 0
        } : {
          firstName: 'אורח',
          lineNumber: 0,
          checkIn: '',
          checkOut: '',
          roomType: '',
          status: 'error'
        }
      };
    }
  };

  /**
   * טיפול בלחיצה על כפתור "ייבא"
   */
  const handleImport = async () => {
    if (!file) {
      setError('יש לבחור קובץ תחילה');
      return;
    }
    
    setIsProcessing(true);
    setProgress(0);
    setProcessedBookings([]);
    
    try {
      // פענוח הקובץ
      const bookingsData = await parseFile(file);
      
      if (!bookingsData || bookingsData.length === 0) {
        throw new Error('לא נמצאו הזמנות בקובץ');
      }
      
      // עיבוד כל ההזמנות בקובץ - הכנה ראשונית
      const totalBookings = bookingsData.length;
      const processedResults = [];
      
      for (let i = 0; i < bookingsData.length; i++) {
        const booking = bookingsData[i];
        
        // עדכון התקדמות
        setProgress(Math.floor(((i + 1) / totalBookings) * 100));
        
        // דילוג על שורות עם שגיאות פענוח
        if (booking.error) {
          processedResults.push({ 
            result: 'error', 
            booking,
            error: booking.error
          });
          continue;
        }
        
        // מידע לפני עיבוד שורה
        console.log(`מעבד שורה ${booking.lineNumber}:`, {
          firstName: booking.firstName,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          roomType: booking.roomType,
          status: booking.status,
          rooms: booking.rooms,
          guests: booking.guests
        });
        
        // עיבוד ההזמנה ללא שמירה בפועל
        const result = await processBooking(booking);
        processedResults.push(result);
      }
      
      // סיכום כל השורות שנקראו מהקובץ לצורך לוג וניטור
      console.log('סיכום עיבוד ראשוני של הקובץ:', {
        totalRows: bookingsData.length,
        toAdd: processedResults.filter(r => r.result === 'add').length,
        toDelete: processedResults.filter(r => r.result === 'delete').length,
        errors: processedResults.filter(r => r.result === 'error').length,
        skipped: processedResults.filter(r => r.result === 'skip').length
      });
      
      // שמירת תוצאות העיבוד הראשוני
      setProcessedBookings(processedResults);
      setSelectedBookings(processedResults.map((_, index) => index));
      setConfirmationMode(true);
      setIsProcessing(false);
      
    } catch (err) {
      console.error('שגיאה בתהליך הייבוא:', err);
      setError(`שגיאה בתהליך הייבוא: ${err.message}`);
      setIsProcessing(false);
    }
  };

  /**
   * טיפול בלחיצה על כפתור "אישור" בשלב האישור הסופי
   */
  const handleConfirmImport = async () => {
    if (selectedBookings.length === 0) {
      setError('לא נבחרו הזמנות לייבוא');
      return;
    }
    
    // בדיקה אם יש הזמנות שדורשות בחירת חדר ידנית
    const bookingsRequiringManualAssignment = selectedBookings
      .map(index => processedBookings[index])
      .filter(booking => booking.result === 'manual_assignment');
    
    if (bookingsRequiringManualAssignment.length > 0) {
      // התחלת תהליך בחירת חדרים ידנית
      console.log("נמצאו הזמנות הדורשות הקצאת חדרים ידנית:", bookingsRequiringManualAssignment.length);
      handleOpenManualAssignment(bookingsRequiringManualAssignment[0]);
      return;
    }
    
    // אם אין הזמנות שדורשות התערבות ידנית, ממשיכים לייבוא הרגיל
    await performImport();
  };

  /**
   * ביצוע הייבוא בפועל לאחר כל הבדיקות והבחירות הידניות
   */
  const performImport = async () => {
    console.log("התחלת תהליך ייבוא סופי");
    
    setIsProcessing(true);
    setProgress(0);
    setResults({
      added: [],
      deleted: [],
      errors: [],
      skipped: []
    });
    
    try {
      // עיבוד סופי של ההזמנות הנבחרות
      const totalSelected = selectedBookings.length;
      console.log(`מתחיל ייבוא ${totalSelected} הזמנות שנבחרו`);
      
      for (let i = 0; i < selectedBookings.length; i++) {
        const bookingIndex = selectedBookings[i];
        const processedBooking = processedBookings[bookingIndex];
        
        if (!processedBooking) {
          console.error(`הזמנה במיקום ${bookingIndex} לא קיימת`);
          continue;
        }
        
        // עדכון התקדמות
        setProgress(Math.floor(((i + 1) / totalSelected) * 100));
        
        // לוג לפני הייבוא הסופי
        console.log(`מייבא סופית את שורה ${processedBooking.booking?.lineNumber}:`, {
          result: processedBooking.result,
          firstName: processedBooking.booking?.firstName,
          checkIn: processedBooking.booking?.checkIn,
          checkOut: processedBooking.booking?.checkOut,
          roomType: processedBooking.booking?.roomType
        });
        
        // בדיקה אם זו הזמנה שטופלה ידנית
        if (processedBooking.result === 'manual_assignment') {
          const manualAssignment = manualAssignmentResults[processedBooking.booking.lineNumber];
          
          if (manualAssignment) {
            console.log(`הזמנה בשורה ${processedBooking.booking.lineNumber} הוקצו לה חדרים ידנית:`, 
              manualAssignment.roomNames.join(', '));
            
            // יצירת נתוני הזמנה עם החדר שנבחר ידנית
            const bookingData = createBookingDataWithManualAssignment(
              processedBooking.booking, 
              manualAssignment
            );
            
            // עדכון הנתונים לפני שליחה לשרת
            processedBooking.result = 'add';
            processedBooking.bookingData = bookingData;
            processedBooking.manuallyAssigned = true;
          } else {
            console.log(`הזמנה בשורה ${processedBooking.booking.lineNumber} לא הוקצו לה חדרים ידנית - דילוג`);
            // אם לא נבחר חדר, נדלג על ההזמנה
            processedBooking.result = 'skip';
            processedBooking.reason = 'לא הוקצה חדר באופן ידני';
          }
        }
        
        // עיבוד סופי של ההזמנה
        const result = await finalizeBooking(processedBooking);
        
        // עדכון תוצאות
        if (result.result === 'added') {
          setResults(prevResults => ({
            ...prevResults,
            added: [...prevResults.added, result]
          }));
        } else if (result.result === 'deleted') {
          setResults(prevResults => ({
            ...prevResults,
            deleted: [...prevResults.deleted, result]
          }));
        } else if (result.result === 'error') {
          setResults(prevResults => ({
            ...prevResults,
            errors: [...prevResults.errors, result]
          }));
        } else if (result.result === 'skipped') {
          setResults(prevResults => ({
            ...prevResults,
            skipped: [...prevResults.skipped, result]
          }));
        }
      }
      
      // סיכום לאחר הייבוא הסופי
      console.log('סיכום תוצאות ייבוא סופי:', {
        total: selectedBookings.length,
        added: results.added.length,
        deleted: results.deleted.length,
        errors: results.errors.length,
        skipped: results.skipped.length
      });
      
      // הצגת תוצאות
      setConfirmationMode(false);
      setShowResults(true);
    } catch (err) {
      console.error('שגיאה בתהליך אישור הייבוא:', err);
      setError(`שגיאה בתהליך אישור הייבוא: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * טיפול בשינוי בחירת הזמנות בשלב האישור
   */
  const handleToggleBooking = (index) => {
    setSelectedBookings(prev => {
      const currentIndex = prev.indexOf(index);
      if (currentIndex === -1) {
        // הוסף לרשימת הנבחרים
        return [...prev, index];
      } else {
        // הסר מרשימת הנבחרים
        return prev.filter(i => i !== index);
      }
    });
  };

  /**
   * טיפול בבחירת/ביטול כל ההזמנות
   */
  const handleToggleAll = () => {
    if (selectAll) {
      // ביטול בחירת כל ההזמנות
      setSelectedBookings([]);
    } else {
      // בחירת כל ההזמנות
      setSelectedBookings(processedBookings.map((_, index) => index));
    }
    setSelectAll(!selectAll);
  };

  /**
   * המרת תאריך לפורמט עקבי לשליחה ל-API
   * @param {string} dateStr - מחרוזת תאריך
   * @returns {string} תאריך בפורמט מתאים למערכת (yyyy-MM-dd)
   */
  const formatDateForAPI = (dateStr) => {
    try {
      // ניקוי סימני / אם קיימים
      const cleanDateStr = dateStr.replace(/\//g, '-');
      
      // ניסיון ליצור אובייקט תאריך
      const date = new Date(cleanDateStr);
      
      // בדיקה שהתאריך תקין
      if (!isValid(date)) {
        console.error('תאריך לא תקין:', dateStr);
        throw new Error(`תאריך לא תקין: ${dateStr}`);
      }
      
      // החזרת התאריך בפורמט yyyy-MM-dd
      return format(date, 'yyyy-MM-dd');
    } catch (error) {
      console.error('שגיאה בהמרת תאריך:', error);
      throw new Error(`שגיאה בהמרת תאריך: ${dateStr}`);
    }
  };

  /**
   * שליחת הזמנה לשרת - הוספה או מחיקה
   */
  const processBooking = async (booking) => {
    try {
      // בדיקת תקינות נתונים בסיסית - שם האורח לא חובה יותר
      if (!booking.firstName || booking.firstName.trim() === '') {
        // במקום לדחות את ההזמנה, נשתמש בערך ברירת מחדל
        console.log(`הזמנה בשורה ${booking.lineNumber} ללא שם אורח - משתמש בשם ברירת מחדל`);
        booking.firstName = 'אורח ללא שם';
      }

      // בדיקת מספר חדרים
      if (booking.rooms > 1) {
        // במקום לדחות את ההזמנה, נסמן אותה לבחירת חדרים ידנית
        console.log(`הזמנה בשורה ${booking.lineNumber} כוללת ${booking.rooms} חדרים - נדרשת הקצאה ידנית`);
        return { 
          result: 'manual_assignment', 
          booking, 
          reason: `הזמנה כוללת ${booking.rooms} חדרים - נדרשת הקצאת חדרים ידנית`,
          requiresMultipleRooms: true
        };
      }

      // בדיקה אם ההזמנה קיימת כבר במערכת לפי מספר הזמנה חיצוני
      if (booking.externalBookingNumber) {
        // חיפוש הזמנות קיימות לפי מספר הזמנה חיצוני
        const response = await axios.get('/api/bookings/search', {
          params: { query: booking.externalBookingNumber, location }
        });
        
        // אם ההזמנה כבר קיימת במערכת
        if (response.data && response.data.length > 0) {
          const existingBooking = response.data[0];
          
          // אם ההזמנה במצב מבוטל, נמחק אותה
          if (booking.status !== 'confirmed') {
            console.log(`נמצאה הזמנה קיימת ${existingBooking._id} עם סטטוס לא מאושר - מוחק`);
            return { 
              result: 'delete', 
              booking,
              existingBookingId: existingBooking._id
            };
          } 
          // אם ההזמנה כבר קיימת וגם ההזמנה החדשה במצב מאושר, נדלג עליה
          else {
            console.log(`הזמנה כבר קיימת במערכת: ${existingBooking._id} - דילוג`);
            return { 
              result: 'skip', 
              booking, 
              reason: 'הזמנה כבר קיימת במערכת'
            };
          }
        }
      }
      
      // אם ההזמנה אינה במצב מאושר ולא נמצאה במערכת, נדלג עליה
      if (booking.status !== 'confirmed') {
        return { 
          result: 'skip', 
          booking, 
          reason: 'סטטוס לא מאושר'
        };
      }
      
      // ודא שסוג יחידת האירוח תמיד במבנה של מחרוזת
      const roomTypeAsString = String(booking.roomType).trim().toLowerCase();
      
      console.log('מעבד הזמנה עם סוג יחידת אירוח:', {
        original: booking.roomType,
        asString: roomTypeAsString
      });
      
      // בדיקה שיש ממיר חדרים מתאים - שופרה לתמיכה במספרים
      const mapping = roomTypeMappings.find(m => {
        // המר את הטקסט לזיהוי למחרוזת (למקרה שהוא מספר)
        const textToMatchAsString = String(m.textToMatch).trim().toLowerCase();
        return textToMatchAsString === roomTypeAsString;
      });
      
      if (!mapping || (!mapping.primaryRoomId && !mapping.secondaryRoomId)) {
        console.log('לא נמצא ממיר מתאים:', {
          roomType: booking.roomType,
          roomTypeAsString,
          availableMappings: roomTypeMappings.map(m => ({ 
            text: String(m.textToMatch).trim().toLowerCase(),
            primary: m.primaryRoomId,
            secondary: m.secondaryRoomId
          }))
        });
        return { 
          result: 'error', 
          booking, 
          error: `סוג יחידת האירוח "${booking.roomType}" לא מוגדר בטבלת הממירים` 
        };
      }
      
      console.log('נמצא ממיר חדרים:', {
        textToMatch: mapping.textToMatch,
        primaryRoomId: mapping.primaryRoomId,
        secondaryRoomId: mapping.secondaryRoomId
      });
      
      // תחילה נבדוק שני החדרים - ראשי ומשני - ונשמור את התוצאות
      let primaryRoomAvailable = false;
      let secondaryRoomAvailable = false;
      const checkInFormatted = booking.checkIn.replace(/-/g, '/');
      const checkOutFormatted = booking.checkOut.replace(/-/g, '/');
      
      // בדיקת זמינות החדר הראשי
      try {
        console.log('בודק זמינות חדר ראשי:', {
          roomId: mapping.primaryRoomId,
          checkIn: checkInFormatted,
          checkOut: checkOutFormatted
        });
        
        const primaryResponse = await axios.get('/api/bookings/check-availability', {
          params: {
            roomId: mapping.primaryRoomId,
            checkIn: checkInFormatted,
            checkOut: checkOutFormatted
          }
        });
        
        console.log('תוצאת בדיקת זמינות חדר ראשי:', primaryResponse.data);
        primaryRoomAvailable = primaryResponse.data.available;
      } catch (error) {
        console.error('שגיאה בבדיקת זמינות החדר הראשי:', error.response?.data || error.message);
        primaryRoomAvailable = false;
      }
      
      // בדיקת זמינות החדר המשני (אם קיים)
      if (!primaryRoomAvailable && mapping.secondaryRoomId) {
        try {
          console.log('בודק זמינות חדר משני:', {
            roomId: mapping.secondaryRoomId,
            checkIn: checkInFormatted,
            checkOut: checkOutFormatted
          });
          
          const secondaryResponse = await axios.get('/api/bookings/check-availability', {
            params: {
              roomId: mapping.secondaryRoomId,
              checkIn: checkInFormatted,
              checkOut: checkOutFormatted
            }
          });
          
          console.log('תוצאת בדיקת זמינות חדר משני:', secondaryResponse.data);
          secondaryRoomAvailable = secondaryResponse.data.available;
        } catch (error) {
          console.error('שגיאה בבדיקת זמינות החדר המשני:', error.response?.data || error.message);
          secondaryRoomAvailable = false;
        }
      }
      
      // קבלת החלטה איזה חדר להשתמש
      let selectedRoomId = null;
      let usedSecondaryRoom = false;
      
      if (primaryRoomAvailable) {
        selectedRoomId = mapping.primaryRoomId;
        usedSecondaryRoom = false;
        console.log('נבחר חדר ראשי:', { roomId: selectedRoomId });
      } else if (secondaryRoomAvailable) {
        selectedRoomId = mapping.secondaryRoomId;
        usedSecondaryRoom = true;
        console.log('נבחר חדר משני:', { roomId: selectedRoomId });
      } else {
        console.log('שני החדרים אינם זמינים - נדרשת בחירת חדר ידנית');
        
        // במקום לדחות את ההזמנה, נסמן אותה לבחירת חדר ידנית
        return {
          result: 'manual_assignment',
          booking,
          reason: 'אין חדר זמין (ראשי או משני) בתאריכים המבוקשים - נדרשת בחירת חדר ידנית',
          checkInFormatted,
          checkOutFormatted,
          preferredRoomType: mapping.textToMatch
        };
      }
      
      // הכנת נתוני ההזמנה לשליחה לשרת
      const bookingData = {
        firstName: booking.firstName,
        lastName: '',
        checkIn: formatDateForAPI(booking.checkIn),
        checkOut: formatDateForAPI(booking.checkOut),
        room: selectedRoomId,
        location,
        source: booking.source || 'direct',
        externalBookingNumber: booking.externalBookingNumber,
        status: 'confirmed',
        notes: `[מיובא] ${booking.notes}${usedSecondaryRoom ? ' (הוקצה חדר משני)' : ''}`,
        guests: booking.guests,
        nights: calculateNights(booking.checkIn, booking.checkOut),
        isTourist: booking.bookerCountry !== 'il',
        price: booking.price,
        creditCard: {
          cardNumber: '',
          expiryDate: '',
          cvv: ''
        },
        paymentStatus: 'unpaid'
      };
      
      // בשלב ראשון, רק נחזיר את הנתונים לעיבוד מבלי לשלוח לשרת
      return { 
        result: 'add', 
        booking,
        bookingData,
        usedSecondaryRoom
      };
    } catch (error) {
      console.error('שגיאה בעיבוד הזמנה:', error);
      return { 
        result: 'error', 
        booking, 
        error: error.response?.data?.message || error.message,
        originalError: error
      };
    }
  };

  /**
   * חישוב מספר לילות בין תאריך צ'ק-אין לצ'ק-אאוט
   */
  const calculateNights = (checkIn, checkOut) => {
    try {
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      console.error('שגיאה בחישוב מספר לילות:', error);
      return 1; // ברירת מחדל
    }
  };

  /**
   * פונקציה לקבלת רשימת חדרים זמינים בתאריכים מסוימים
   */
  const fetchAvailableRooms = async (checkIn, checkOut) => {
    try {
      const response = await axios.get('/api/rooms', {
        params: { location }
      });
      
      const allRooms = response.data;
      const availableRoomsList = [];
      
      console.log(`התקבלו ${allRooms.length} חדרים מהשרת, מיקום: ${location}`);
      
      // בדיקת זמינות לכל חדר
      for (const room of allRooms) {
        try {
          // וידוא שהחדר שייך למיקום הנוכחי שנבחר
          // הערה: אם ה-API כבר מסנן לפי מיקום או אם החדר לא מכיל שדה location,
          // נשתמש בהנחה שהחדרים שחזרו כבר מסוננים נכון
          if (room.location && room.location !== location) {
            console.log(`דילוג על חדר ${room.roomNumber || room.name} - מיקום שונה (${room.location})`);
            continue; // דילוג על חדרים ממיקום אחר
          }

          const availabilityResponse = await axios.get('/api/bookings/check-availability', {
            params: {
              roomId: room._id,
              checkIn,
              checkOut
            }
          });
          
          if (availabilityResponse.data.available) {
            availableRoomsList.push({
              _id: room._id,
              name: room.name,
              roomType: room.roomType,
              description: room.description || '',
              roomNumber: room.roomNumber
            });
            console.log(`חדר ${room.roomNumber || room.name} נמצא זמין ונוסף לרשימה`);
          } else {
            console.log(`חדר ${room.roomNumber || room.name} אינו זמין בתאריכים המבוקשים`);
          }
        } catch (error) {
          console.error(`שגיאה בבדיקת זמינות חדר ${room.name}:`, error);
        }
      }
      
      // מיון החדרים לפי מספר
      availableRoomsList.sort((a, b) => {
        const roomNumberA = parseInt(a.roomNumber) || 0;
        const roomNumberB = parseInt(b.roomNumber) || 0;
        return roomNumberA - roomNumberB;
      });
      
      console.log(`נמצאו ${availableRoomsList.length} חדרים זמינים במיקום ${location}`);
      return availableRoomsList;
    } catch (error) {
      console.error('שגיאה בקבלת רשימת חדרים:', error);
      throw error;
    }
  };

  /**
   * טיפול בפתיחת דיאלוג בחירת חדרים ידנית
   */
  const handleOpenManualAssignment = async (bookingData) => {
    try {
      setIsProcessing(true);
      setBookingRequiringManualAssignment(bookingData);
      
      const checkInFormatted = bookingData.checkInFormatted || bookingData.booking.checkIn.replace(/-/g, '/');
      const checkOutFormatted = bookingData.checkOutFormatted || bookingData.booking.checkOut.replace(/-/g, '/');
      
      console.log(`מחפש חדרים זמינים במיקום "${location}" בתאריכים ${checkInFormatted} עד ${checkOutFormatted}`);
      
      // קבלת רשימת חדרים זמינים
      const availableRoomsList = await fetchAvailableRooms(checkInFormatted, checkOutFormatted);
      
      if (availableRoomsList.length === 0) {
        setError(`אין חדרים זמינים במיקום ${location} בתאריכים ${checkInFormatted} עד ${checkOutFormatted}`);
        setBookingRequiringManualAssignment(null);
      } else {
        console.log(`נמצאו ${availableRoomsList.length} חדרים זמינים:`, 
          availableRoomsList.map(r => `חדר ${r.roomNumber || getShortRoomName(r)}`).join(', '));
        
        setAvailableRooms(availableRoomsList);
        setSelectedRoom(availableRoomsList[0]?._id || '');
        setManualRoomAssignmentMode(true);
      }
    } catch (error) {
      console.error('שגיאה בפתיחת דיאלוג בחירת חדרים:', error);
      setError(`שגיאה בטעינת חדרים זמינים: ${error.message}`);
      setBookingRequiringManualAssignment(null);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * טיפול באישור בחירת חדר ידנית
   */
  const handleConfirmManualAssignment = () => {
    const requiredRooms = bookingRequiringManualAssignment?.booking.rooms || 1;
    
    console.log(`מאשר הקצאת חדרים ידנית להזמנה בשורה ${bookingRequiringManualAssignment?.booking.lineNumber}, נדרשים ${requiredRooms} חדרים`);
    
    // בחירת חדר בודד
    if (requiredRooms === 1) {
      if (!selectedRoom || !bookingRequiringManualAssignment) {
        setError('לא נבחר חדר');
        return;
      }
      
      // יצירת עותק של הנתונים עם החדר הנבחר
      const assignedRoom = availableRooms.find(room => room._id === selectedRoom);
      const roomName = getShortRoomName(assignedRoom);
      
      console.log(`הוקצה חדר: ${roomName} (מזהה: ${selectedRoom})`);
      
      // שמירת התוצאה
      setManualAssignmentResults(prev => ({
        ...prev,
        [bookingRequiringManualAssignment.booking.lineNumber]: {
          roomIds: [selectedRoom],
          roomNames: [roomName]
        }
      }));
    } 
    // בחירת מספר חדרים
    else {
      if (selectedRooms.length === 0 || !bookingRequiringManualAssignment) {
        setError('לא נבחרו חדרים');
        return;
      }
      
      if (selectedRooms.length < requiredRooms) {
        setError(`נדרשים ${requiredRooms} חדרים, אך נבחרו רק ${selectedRooms.length}`);
        return;
      }
      
      // יצירת רשימת שמות חדרים
      const roomNames = selectedRooms.map(roomId => {
        const room = availableRooms.find(r => r._id === roomId);
        return getShortRoomName(room);
      });
      
      console.log(`הוקצו ${selectedRooms.length} חדרים: ${roomNames.join(', ')}`);
      
      // שמירת התוצאה
      setManualAssignmentResults(prev => ({
        ...prev,
        [bookingRequiringManualAssignment.booking.lineNumber]: {
          roomIds: selectedRooms,
          roomNames: roomNames
        }
      }));
    }
    
    // גם לעדכן את ה-processedBookings כדי לסמן שההזמנה הזו טופלה
    if (bookingRequiringManualAssignment) {
      setProcessedBookings(prevProcessedBookings => {
        // יצירת עותק של המערך
        const updatedBookings = [...prevProcessedBookings];
        
        // מציאת האינדקס של ההזמנה הנוכחית
        const bookingIndex = updatedBookings.findIndex(
          booking => booking && 
          booking.booking && 
          booking.booking.lineNumber === bookingRequiringManualAssignment.booking.lineNumber
        );
        
        // אם נמצאה ההזמנה, עדכון הסטטוס שלה
        if (bookingIndex !== -1) {
          console.log(`מעדכן את סטטוס הזמנה במיקום ${bookingIndex} (שורה ${bookingRequiringManualAssignment.booking.lineNumber}) ל-processed`);
          
          // יצירת עותק של האובייקט עם סטטוס מעודכן
          updatedBookings[bookingIndex] = {
            ...updatedBookings[bookingIndex],
            manuallyProcessed: true,
            // לא משנים את result כאן - זה ישתנה רק בזמן performImport
          };
        }
        
        return updatedBookings;
      });
    }
    
    console.log(`סיום הקצאת חדרים ידנית להזמנה בשורה ${bookingRequiringManualAssignment?.booking.lineNumber}`);
    
    // סגירת הדיאלוג וניקוי
    setManualRoomAssignmentMode(false);
    setBookingRequiringManualAssignment(null);
    setAvailableRooms([]);
    setSelectedRoom('');
    setSelectedRooms([]);
    
    // המשך המעבר על ההזמנות
    processNextBookingRequiringManualAssignment();
  };

  /**
   * פונקציה לחילוץ מספר חדר קצר ממידע החדר
   */
  const getShortRoomName = (room) => {
    if (!room) return 'לא ידוע';
    
    // אם יש מספר חדר מפורש (roomNumber)
    if (room.roomNumber) return room.roomNumber;
    
    // אם יש שדה מספר נפרד
    if (room.number) return room.number;
    
    // אם השם הוא כבר מספר פשוט
    if (room.name) {
      if (/^\d+$/.test(room.name)) return room.name;
      
      // חילוץ מספר מתוך השם (למשל "חדר 101" יחזיר "101")
      const numberMatch = room.name.match(/\d+/);
      if (numberMatch) return numberMatch[0];
    }
    
    // אם אין שום דרך לחלץ מספר ברור, החזר מספר סידורי פשוט
    return (room.id || room._id) ? String(room.id || room._id).slice(-1) : '?';
  };

  /**
   * טיפול בסגירת דיאלוג בחירת חדרים
   */
  const handleCloseManualAssignment = () => {
    setManualRoomAssignmentMode(false);
    setBookingRequiringManualAssignment(null);
    setAvailableRooms([]);
    setSelectedRoom('');
    
    // המשך המעבר על ההזמנות
    processNextBookingRequiringManualAssignment();
  };

  /**
   * מעבר לטיפול בהזמנה הבאה שדורשת בחירת חדר ידנית
   */
  const processNextBookingRequiringManualAssignment = () => {
    console.log("בודק אם יש הזמנות נוספות הדורשות הקצאת חדרים ידנית");
    
    // בדיקה שאנחנו לא כבר בתהליך ייבוא
    if (isProcessing) {
      console.log("דילוג על חיפוש הזמנות נוספות - כבר בתהליך עיבוד");
      return;
    }
    
    // חיפוש ההזמנה הבאה שדורשת בחירת חדר ידנית
    const nextBookingIndex = processedBookings.findIndex((booking, index) => {
      // בודק אם ההזמנה נבחרה, היא דורשת הקצאה ידנית, וטרם טופלה
      return (
        booking && 
        selectedBookings.includes(index) && 
        booking.result === 'manual_assignment' && 
        !booking.manuallyProcessed && // בודק אם ההזמנה כבר טופלה ידנית
        !manualAssignmentResults[booking.booking?.lineNumber] // אין תוצאות הקצאה ידנית
      );
    });
    
    console.log(`בדיקת הזמנות להקצאת חדר, נמצא אינדקס: ${nextBookingIndex}`);
    
    if (nextBookingIndex !== -1) {
      // טיפול בהזמנה הבאה
      const nextBooking = processedBookings[nextBookingIndex];
      console.log(`נמצאה הזמנה נוספת הדורשת הקצאת חדרים ידנית (שורה ${nextBooking.booking?.lineNumber})`);
      
      // פתיחת דיאלוג בחירת חדרים להזמנה הבאה
      setTimeout(() => {
        handleOpenManualAssignment(nextBooking);
      }, 100); // קצת השהיה למקרה שיש בעיות עם עדכוני מצב מרובים
    } else {
      // אם אין עוד הזמנות שדורשות טיפול ידני, ממשיכים לייבוא הסופי
      console.log("כל ההזמנות הידניות טופלו, ממשיך לביצוע הייבוא הסופי");
      setTimeout(() => {
        performImport();
      }, 100);
    }
  };

  /**
   * יצירת נתוני הזמנה עם חדר שנבחר ידנית
   */
  const createBookingDataWithManualAssignment = (booking, manualAssignment) => {
    // אם מדובר במספר חדרים, נייצר הזמנות נפרדות לכל חדר
    if (manualAssignment.roomIds && manualAssignment.roomIds.length > 1) {
      // החזרת נתוני החדר הראשון כחדר העיקרי להזמנה
      return {
        firstName: booking.firstName,
        lastName: '',
        checkIn: formatDateForAPI(booking.checkIn),
        checkOut: formatDateForAPI(booking.checkOut),
        room: manualAssignment.roomIds[0],
        location,
        source: booking.source || 'direct',
        externalBookingNumber: booking.externalBookingNumber,
        status: 'confirmed',
        notes: `[מיובא] ${booking.notes} (הוקצה חדר ידנית: ${manualAssignment.roomNames.join(', ')})`,
        guests: booking.guests,
        nights: calculateNights(booking.checkIn, booking.checkOut),
        isTourist: booking.bookerCountry !== 'il',
        price: booking.price,
        creditCard: {
          cardNumber: '',
          expiryDate: '',
          cvv: ''
        },
        paymentStatus: 'unpaid',
        additionalRooms: manualAssignment.roomIds.slice(1) // שמירת מזהי החדרים הנוספים
      };
    } else {
      // הזמנה עם חדר בודד
      return {
        firstName: booking.firstName,
        lastName: '',
        checkIn: formatDateForAPI(booking.checkIn),
        checkOut: formatDateForAPI(booking.checkOut),
        room: manualAssignment.roomIds[0],
        location,
        source: booking.source || 'direct',
        externalBookingNumber: booking.externalBookingNumber,
        status: 'confirmed',
        notes: `[מיובא] ${booking.notes} (הוקצה חדר ידנית: ${manualAssignment.roomNames[0]})`,
        guests: booking.guests,
        nights: calculateNights(booking.checkIn, booking.checkOut),
        isTourist: booking.bookerCountry !== 'il',
        price: booking.price,
        creditCard: {
          cardNumber: '',
          expiryDate: '',
          cvv: ''
        },
        paymentStatus: 'unpaid'
      };
    }
  };

  /**
   * טיפול בבחירת או ביטול בחירת חדר במצב בחירה מרובה
   */
  const handleToggleRoomSelection = (roomId) => {
    setSelectedRooms(prev => {
      // אם החדר כבר נבחר, הסר אותו
      if (prev.includes(roomId)) {
        return prev.filter(id => id !== roomId);
      }
      
      // אחרת, הוסף אותו אם עדיין יש מקום לחדרים נוספים
      const requiredRooms = bookingRequiringManualAssignment.booking.rooms || 1;
      if (prev.length < requiredRooms) {
        return [...prev, roomId];
      }
      
      // אם כבר נבחרו מספיק חדרים, החלף את החדר האחרון שנבחר
      const newSelection = [...prev];
      newSelection.pop();
      return [...newSelection, roomId];
    });
  };

  return (
    <Dialog
      open={open}
      onClose={isProcessing ? undefined : handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        ייבוא הזמנות מקובץ
      </DialogTitle>
      
      <DialogContent>
        {/* כאן יוצג דיאלוג בחירת חדרים ידנית */}
        {manualRoomAssignmentMode && bookingRequiringManualAssignment && (
          <Box sx={{ 
            mt: 2, 
            p: 2, 
            border: '2px solid',
            borderColor: 'primary.main',
            borderRadius: 2,
            bgcolor: 'background.paper',
            position: 'relative',
            zIndex: 5,
            boxShadow: 3
          }}>
            <Typography variant="h6" gutterBottom>
              בחירת חדר ידנית
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" gutterBottom>
                <strong>שם אורח:</strong> {bookingRequiringManualAssignment.booking.firstName}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>תאריכי שהות:</strong> {bookingRequiringManualAssignment.booking.checkIn} עד {bookingRequiringManualAssignment.booking.checkOut}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>סוג יחידת דיור:</strong> {
                  typeof bookingRequiringManualAssignment.booking.roomType === 'number' 
                    ? 'מספר ' + bookingRequiringManualAssignment.booking.roomType 
                    : bookingRequiringManualAssignment.booking.roomType
                }
                {bookingRequiringManualAssignment.preferredRoomType && 
                  bookingRequiringManualAssignment.preferredRoomType !== bookingRequiringManualAssignment.booking.roomType && (
                    <span> (סוג מועדף: {bookingRequiringManualAssignment.preferredRoomType})</span>
                  )
                }
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>סיבה לבחירה ידנית:</strong> {bookingRequiringManualAssignment.reason}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>נדרשים:</strong> {bookingRequiringManualAssignment.booking.rooms || 1} חדרים
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1" gutterBottom>
                  {bookingRequiringManualAssignment.booking.rooms > 1 
                    ? `בחר ${bookingRequiringManualAssignment.booking.rooms} חדרים זמינים:` 
                    : 'בחר חדר זמין:'}
                </Typography>
                
                {isProcessing ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <CircularProgress size={30} />
                  </Box>
                ) : availableRooms.length > 0 ? (
                  <Paper sx={{ p: 2, mt: 1 }}>
                    {availableRooms.map(room => {
                      const roomName = getShortRoomName(room);
                      
                      return (
                        <Box key={room._id} sx={{ mb: 1 }}>
                          {bookingRequiringManualAssignment.booking.rooms > 1 ? (
                            // בחירה מרובה לכמה חדרים
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={selectedRooms.includes(room._id)}
                                  onChange={() => handleToggleRoomSelection(room._id)}
                                />
                              }
                              label={`חדר ${roomName}`}
                            />
                          ) : (
                            // בחירה בודדת לחדר אחד
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={selectedRoom === room._id}
                                  onChange={() => setSelectedRoom(room._id)}
                                />
                              }
                              label={`חדר ${roomName}`}
                            />
                          )}
                        </Box>
                      );
                    })}
                  </Paper>
                ) : (
                  <Alert severity="warning">
                    אין חדרים זמינים בתאריכים המבוקשים
                  </Alert>
                )}
              </Box>
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={handleCloseManualAssignment} color="inherit" sx={{ mr: 1 }}>
                  דלג על הזמנה זו
                </Button>
                <Button 
                  onClick={handleConfirmManualAssignment} 
                  variant="contained" 
                  color="primary"
                  disabled={bookingRequiringManualAssignment.booking.rooms > 1 
                    ? selectedRooms.length === 0 
                    : !selectedRoom}
                >
                  אשר בחירה
                </Button>
              </Box>
            </Box>
          </Box>
        )}
        
        {/* הדיאלוג הנפרד שיצרנו קודם - מוסתר כרגע */}
        <Dialog
          open={false}
          onClose={handleCloseManualAssignment}
          maxWidth="sm"
          fullWidth
        >
          {/* תוכן שהיה כאן קודם */}
        </Dialog>
        
        {/* אזור בחירת/גרירת קובץ */}
        {!showResults && !isProcessing && !confirmationMode && !manualRoomAssignmentMode && (
          <Box sx={{ mt: 2 }}>
            <Paper
              {...getRootProps()}
              sx={{
                p: 4,
                textAlign: 'center',
                backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
                border: '2px dashed',
                borderColor: isDragActive ? 'primary.main' : 'divider',
                borderRadius: 2,
                cursor: 'pointer'
              }}
            >
              <input {...getInputProps()} />
              {file ? (
                <Typography>
                  הקובץ שנבחר: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} קילובייט)
                </Typography>
              ) : (
                <Typography>
                  {isDragActive
                    ? 'שחרר כאן לייבוא הקובץ'
                    : 'גרור לכאן קובץ אקסל או CSV, או לחץ לבחירת קובץ'}
                </Typography>
              )}
            </Paper>
            
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                בקובץ הייבוא צריכות להיות העמודות הבאות (בשורת הכותרות): 
                מספר הזמנה, צ'ק-אין, צ'ק-אאוט, סטטוס, חדרים, אנשים, מחיר, הערות, Booker country, סוג יחידת האירוח
              </Typography>
            </Alert>
          </Box>
        )}
        
        {/* תצוגה של אישור הזמנות לפני ייבוא סופי */}
        {confirmationMode && !isProcessing && !manualRoomAssignmentMode && (
          <Box sx={{ mt: 2 }}>
            <Paper sx={{ mb: 2, p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  בחר הזמנות לייבוא סופי
                </Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectAll}
                      onChange={handleToggleAll}
                    />
                  }
                  label="בחר הכל"
                />
              </Box>
              <List dense>
                {processedBookings.map((processedBooking, index) => {
                  // שינוי צבע רקע לפי סוג הפעולה
                  let bgColor = 'inherit';
                  let statusText = '';
                  
                  if (processedBooking.result === 'add') {
                    bgColor = 'success.light';
                    statusText = 'יתווסף';
                  } else if (processedBooking.result === 'delete') {
                    bgColor = 'warning.light';
                    statusText = 'יימחק';
                  } else if (processedBooking.result === 'error') {
                    bgColor = 'error.light';
                    statusText = 'שגיאה';
                  } else if (processedBooking.result === 'skip') {
                    bgColor = 'grey.200';
                    statusText = 'ידלג';
                  } else if (processedBooking.result === 'manual_assignment') {
                    bgColor = 'info.light';
                    statusText = 'דרוש שיבוץ ידני';
                  }
                  
                  return (
                    <ListItem 
                      key={`confirmation-${index}`} 
                      divider={index < processedBookings.length - 1}
                      button
                      onClick={() => handleToggleBooking(index)}
                      sx={{ backgroundColor: bgColor }}
                    >
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={selectedBookings.includes(index)}
                          tabIndex={-1}
                          disableRipple
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          processedBooking.result === 'error' 
                          ? `שגיאה - שורה ${processedBooking.booking.lineNumber} - מספר הזמנה: ${processedBooking.booking.externalBookingNumber || 'ללא'}`
                          : `${statusText} - ${processedBooking.booking.firstName} | שורה ${processedBooking.booking.lineNumber} - מספר הזמנה: ${processedBooking.booking.externalBookingNumber || 'ללא'}`
                        }
                        secondary={
                          processedBooking.result === 'error'
                          ? processedBooking.error
                          : processedBooking.result === 'manual_assignment'
                            ? processedBooking.reason
                            : processedBooking.result === 'add'
                              ? `צ'ק-אין: ${processedBooking.booking.checkIn}, צ'ק-אאוט: ${processedBooking.booking.checkOut}, חדר: ${typeof processedBooking.booking.roomType === 'number' ? 'מספר ' + processedBooking.booking.roomType : processedBooking.booking.roomType}${processedBooking.usedSecondaryRoom ? ' (הוקצה חדר משני)' : ''}`
                              : processedBooking.result === 'delete'
                                ? `סטטוס: ${processedBooking.booking.status} | נמצאה הזמנה קיימת שתימחק`
                                : processedBooking.reason === 'הזמנה כבר קיימת במערכת'
                                  ? `הזמנה כבר קיימת במערכת ולכן לא תתווסף שוב`
                                  : processedBooking.reason || `סטטוס: ${processedBooking.booking.status}`
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Paper>
            
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                שים לב! הזמנות המסומנות כ"דרוש שיבוץ ידני" יפתחו דיאלוג לבחירת חדר ידנית. יש לבטל סימון להזמנות שלא ברצונך לייבא.
              </Typography>
            </Alert>
          </Box>
        )}
        
        {/* תצוגת התקדמות */}
        {isProcessing && !manualRoomAssignmentMode && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {confirmationMode ? 'מייבא הזמנות, אנא המתן...' : 'מעבד קובץ, אנא המתן...'}
            </Typography>
            <LinearProgress variant="determinate" value={progress} sx={{ mb: 2 }} />
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress size={48} />
            </Box>
          </Box>
        )}
        
        {/* תצוגת תוצאות */}
        {showResults && !isProcessing && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="body1" fontWeight="bold">
                תהליך הייבוא הסתיים בהצלחה
              </Typography>
              <Typography variant="body2">
                הזמנות שנוספו: {results.added.length} | 
                הזמנות שנמחקו: {results.deleted.length} | 
                שגיאות: {results.errors.length} | 
                הזמנות שדולגו: {results.skipped.length}
              </Typography>
            </Alert>
            
            {/* רשימת הזמנות שנוספו */}
            {results.added.length > 0 && (
              <Paper sx={{ mb: 2, p: 2 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  הזמנות שנוספו בהצלחה
                </Typography>
                <List dense>
                  {results.added.map((result, index) => (
                    <ListItem key={`added-${index}`} divider={index < results.added.length - 1}>
                      <ListItemText
                        primary={`${result.booking.firstName} | שורה ${result.booking.lineNumber} - מספר הזמנה: ${result.booking.externalBookingNumber || 'ללא'}`}
                        secondary={`צ'ק-אין: ${result.booking.checkIn}, צ'ק-אאוט: ${result.booking.checkOut}, חדר: ${typeof result.booking.roomType === 'number' ? 'מספר ' + result.booking.roomType : result.booking.roomType}${result.usedSecondaryRoom ? ' (הוקצה חדר משני)' : ''}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
            
            {/* רשימת הזמנות שנמחקו */}
            {results.deleted.length > 0 && (
              <Paper sx={{ mb: 2, p: 2 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  הזמנות שנמחקו
                </Typography>
                <List dense>
                  {results.deleted.map((result, index) => (
                    <ListItem key={`deleted-${index}`} divider={index < results.deleted.length - 1}>
                      <ListItemText
                        primary={`${result.booking.firstName} | שורה ${result.booking.lineNumber} - מספר הזמנה: ${result.booking.externalBookingNumber || 'ללא'}`}
                        secondary={`סטטוס: ${result.booking.status}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
            
            {/* רשימת שגיאות */}
            {results.errors.length > 0 && (
              <Paper sx={{ mb: 2, p: 2, bgcolor: 'error.light' }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  שגיאות בייבוא
                </Typography>
                <List dense>
                  {results.errors.map((result, index) => (
                    <ListItem key={`error-${index}`} divider={index < results.errors.length - 1}>
                      <ListItemText
                        primary={`שורה ${result.booking?.lineNumber || result.lineNumber} - ${result.booking?.firstName || 'שם לא זמין'}`}
                        secondary={
                          <>
                            <Typography variant="body2" color="error">
                              שגיאה: {result.error}
                            </Typography>
                            {result.booking && 
                              <Typography variant="body2">
                                פרטים: צ'ק-אין: {result.booking.checkIn}, צ'ק-אאוט: {result.booking.checkOut}, 
                                סוג חדר: {result.booking.roomType || 'לא צוין'}
                              </Typography>
                            }
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
            
            {/* הזמנות שדולגו */}
            {results.skipped.length > 0 && (
              <Paper sx={{ mb: 2, p: 2 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  הזמנות שדולגו
                </Typography>
                <List dense>
                  {results.skipped.map((result, index) => (
                    <ListItem key={`skipped-${index}`} divider={index < results.skipped.length - 1}>
                      <ListItemText
                        primary={`${result.booking.firstName || 'שם לא זמין'} | שורה ${result.booking.lineNumber} - מספר הזמנה: ${result.booking.externalBookingNumber || 'ללא'}`}
                        secondary={
                          <>
                            <Typography variant="body2">
                              סיבה: {result.reason === 'הזמנה כבר קיימת במערכת'
                                ? `הזמנה כבר קיימת במערכת ולכן לא התווספה שוב`
                                : result.reason || `סטטוס: ${result.booking.status}`}
                            </Typography>
                            <Typography variant="body2">
                              פרטים: צ'ק-אין: {result.booking.checkIn}, צ'ק-אאוט: {result.booking.checkOut}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        {!showResults && !isProcessing && !confirmationMode && !manualRoomAssignmentMode && (
          <>
            <Button onClick={handleClose}>ביטול</Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleImport}
              disabled={!file}
            >
              ייבא הזמנות
            </Button>
          </>
        )}
        
        {confirmationMode && !isProcessing && !manualRoomAssignmentMode && (
          <>
            <Button onClick={handleClose}>ביטול</Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleConfirmImport}
              disabled={selectedBookings.length === 0}
            >
              אישור ייבוא ({selectedBookings.length} הזמנות)
            </Button>
          </>
        )}
        
        {(showResults || (isProcessing && !manualRoomAssignmentMode)) && (
          <Button 
            onClick={handleClose}
            disabled={isProcessing}
          >
            סגור
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ImportBookings; 