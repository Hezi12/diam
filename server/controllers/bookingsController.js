const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Counter = require('../models/Counter');
const capitalController = require('./capitalController');
const { deleteBookingImages } = require('../middleware/bookingImageUpload');
const path = require('path');

// אמצעי תשלום שיסתננו כשהסינון פעיל
const FILTERED_PAYMENT_METHODS = [
  'cash2',
  'bit_poalim',
  'transfer_poalim', 
  'paybox_poalim'
];

/**
 * פונקציה עזר לבניית query עם סינון אופציונלי
 * @param {Object} baseQuery - השאילתה הבסיסית
 * @param {string} filterMode - מצב הסינון (active/inactive)
 * @returns {Object} - השאילתה המעודכנת
 */
const buildFilteredQuery = (baseQuery, filterMode) => {
  if (filterMode === 'active') {
    // אם הסינון פעיל, נוציא הזמנות עם אמצעי תשלום מסוננים
    const filteredQuery = {
      ...baseQuery,
      $and: [
        baseQuery.$and || baseQuery,
        {
          $or: [
            { paymentStatus: 'unpaid' }, // הזמנות לא שולמות תמיד יוצגו
            { paymentStatus: { $nin: FILTERED_PAYMENT_METHODS } } // הזמנות ששולמו באמצעי לא מסוננים
          ]
        }
      ]
    };
    return filteredQuery;
  }
  return baseQuery; // אם הסינון לא פעיל, מחזיר את השאילתה המקורית
};

// קבלת כל ההזמנות
exports.getAllBookings = async (req, res) => {
  try {
    const { filterMode } = req.query; // קבלת מצב הסינון מהקלינט
    
    let query = {};
    query = buildFilteredQuery(query, filterMode);
    
    const bookings = await Booking.find(query)
      .populate('room', 'roomNumber category basePrice')
      .sort({ checkIn: 1 });
    
    // הוספת מידע על חשבוניות לכל הזמנה
    const Invoice = require('../models/Invoice');
    const bookingsWithInvoiceInfo = await Promise.all(
      bookings.map(async (booking) => {
        const bookingObj = booking.toObject();
        
        // בדיקה אם יש חשבוניות להזמנה זו
        const invoices = await Invoice.find({ booking: booking._id });
        bookingObj.hasAnyInvoice = invoices.length > 0;
        bookingObj.invoicesCount = invoices.length;
        
        return bookingObj;
      })
    );
    
    res.json(bookingsWithInvoiceInfo);
  } catch (error) {
    console.error('Error getting bookings:', error);
    res.status(500).json({ message: 'שגיאה בקבלת רשימת ההזמנות' });
  }
};

// קבלת הזמנות לפי מיקום
exports.getBookingsByLocation = async (req, res) => {
  try {
    const { location } = req.params;
    const { filterMode } = req.query; // קבלת מצב הסינון מהקלינט
    
    // וידוא שהמיקום תקין
    if (!['airport', 'rothschild'].includes(location)) {
      return res.status(400).json({ message: 'מיקום לא תקין' });
    }
    
    let query = { location };
    query = buildFilteredQuery(query, filterMode);
    
    const bookings = await Booking.find(query)
      .populate('room', 'roomNumber category basePrice')
      .sort({ checkIn: 1 });
    
    // הוספת מידע על חשבוניות לכל הזמנה
    const Invoice = require('../models/Invoice');
    const bookingsWithInvoiceInfo = await Promise.all(
      bookings.map(async (booking) => {
        const bookingObj = booking.toObject();
        
        // בדיקה אם יש חשבוניות להזמנה זו
        const invoices = await Invoice.find({ booking: booking._id });
        bookingObj.hasAnyInvoice = invoices.length > 0;
        bookingObj.invoicesCount = invoices.length;
        
        return bookingObj;
      })
    );
    
    res.json(bookingsWithInvoiceInfo);
  } catch (error) {
    console.error('Error getting bookings by location:', error);
    res.status(500).json({ message: 'שגיאה בקבלת רשימת ההזמנות' });
  }
};

// קבלת הזמנות בטווח תאריכים 
exports.getBookingsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, location, filterMode, hideRefusals } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'נדרשים תאריך התחלה ותאריך סיום' });
    }
    
    // המרת תאריכים לפורמט אחיד ללא שעות
    const startDateParts = new Date(startDate).toISOString().split('T')[0].split('-');
    const endDateParts = new Date(endDate).toISOString().split('T')[0].split('-');
    
    // יצירת תאריכים חדשים עם הגדרת השעה ל-00:00:00 UTC
    const formattedStartDate = new Date(Date.UTC(
      parseInt(startDateParts[0]),
      parseInt(startDateParts[1]) - 1, // בג'אווסקריפט החודשים הם 0-11
      parseInt(startDateParts[2])
    ));
    
    const formattedEndDate = new Date(Date.UTC(
      parseInt(endDateParts[0]),
      parseInt(endDateParts[1]) - 1, // בג'אווסקריפט החודשים הם 0-11
      parseInt(endDateParts[2])
    ));
    
    // בניית פילטר חיפוש משופר לכיסוי כל המקרים האפשריים:
    const dateFilter = {
      $or: [
        // מקרה 1: הזמנות שמתחילות בטווח המבוקש (צ'ק-אין בתוך הטווח)
        { 
          checkIn: { $gte: formattedStartDate, $lte: formattedEndDate } 
        },
        
        // מקרה 2: הזמנות שמסתיימות בטווח המבוקש (צ'ק-אאוט בתוך הטווח)
        { 
          checkOut: { $gt: formattedStartDate, $lte: formattedEndDate } 
        },
        
        // מקרה 3: הזמנות שמקיפות את הטווח כולו (צ'ק-אין לפני, צ'ק-אאוט אחרי)
        { 
          checkIn: { $lt: formattedStartDate },
          checkOut: { $gt: formattedEndDate }
        },
        
        // מקרה 4: הזמנות שחלק מהן בתוך הטווח (צ'ק-אין לפני הטווח, צ'ק-אאוט אחרי תחילת הטווח)
        {
          checkIn: { $lt: formattedStartDate },
          checkOut: { $gt: formattedStartDate, $lte: formattedEndDate }
        }
      ]
    };
    
    // הוספת פילטר לפי מיקום אם נדרש
    let filter = location ? 
      { ...dateFilter, location } :
      dateFilter;
    
    // הוספת סינון אם נדרש
    filter = buildFilteredQuery(filter, filterMode);
    
    const bookings = await Booking.find(filter)
      .populate('room', 'roomNumber category basePrice')
      .sort({ checkIn: 1 });
    
    // הוספת מידע על חשבוניות לכל הזמנה
    const Invoice = require('../models/Invoice');
    const bookingsWithInvoiceInfo = await Promise.all(
      bookings.map(async (booking) => {
        const bookingObj = booking.toObject();
        
        // בדיקה אם יש חשבוניות להזמנה זו
        const invoices = await Invoice.find({ booking: booking._id });
        bookingObj.hasAnyInvoice = invoices.length > 0;
        bookingObj.invoicesCount = invoices.length;
        
        return bookingObj;
      })
    );
    
    // 🛡️ סינון הזמנות עם סירוב עבור לוח המודעות (רק אם נדרש)
    let finalBookings = bookingsWithInvoiceInfo;
    if (hideRefusals === 'true') {
      finalBookings = bookingsWithInvoiceInfo.filter(booking => {
        // אם אין הערות, ההזמנה תוצג
        if (!booking.notes) return true;
        
        // בדיקה מדויקת של מילות סירוב בעברית ואנגלית
        const notesLower = booking.notes.toLowerCase();
        const refusalKeywords = ['סירוב', 'refusal', 'refuse', 'declined', 'reject', 'rejection'];
        
        // אם נמצאה מילת סירוב, לא להציג את ההזמנה
        const hasRefusal = refusalKeywords.some(keyword => notesLower.includes(keyword));
        
        if (hasRefusal) {
          console.log(`🚫 מסתיר הזמנה #${booking.bookingNumber} מלוח המודעות בגלל סירוב בהערות: "${booking.notes}"`);
        }
        
        return !hasRefusal;
      });
    }
    
    res.json(finalBookings);
  } catch (error) {
    console.error('Error getting bookings by date range:', error);
    res.status(500).json({ message: 'שגיאה בקבלת רשימת ההזמנות לפי טווח תאריכים' });
  }
};

// קבלת הזמנה לפי מזהה
exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id)
      .populate('room', 'roomNumber category basePrice vatPrice fridayPrice fridayVatPrice');
    
    if (!booking) {
      return res.status(404).json({ message: 'הזמנה לא נמצאה' });
    }
    
    // הוספת מידע על חשבוניות
    const bookingObj = booking.toObject();
    const Invoice = require('../models/Invoice');
    const invoices = await Invoice.find({ booking: booking._id });
    bookingObj.hasAnyInvoice = invoices.length > 0;
    bookingObj.invoicesCount = invoices.length;
    
    res.json(bookingObj);
  } catch (error) {
    console.error('Error getting booking by id:', error);
    res.status(500).json({ message: 'שגיאה בקבלת פרטי ההזמנה' });
  }
};

// יצירת הזמנה חדשה
exports.createBooking = async (req, res) => {
  try {
    const { 
      room: roomId,
      location,
      firstName,
      lastName,
      phone,
      email,
      checkIn,
      checkOut,
      nights,
      isTourist,
      price,
      pricePerNight,
      pricePerNightNoVat,
      paymentStatus,
      creditCard,
      status,
      notes,
      code,
      reviewHandled
    } = req.body;
    
    // בדיקה אם החדר קיים
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'החדר המבוקש לא נמצא' });
    }
    
    // רישום מידע התחלתי
    console.log('נתוני הזמנה שהתקבלו:', {
      room: roomId,
      roomNumber: room.roomNumber,
      checkIn: checkIn ? new Date(checkIn).toISOString() : null,
      checkOut: checkOut ? new Date(checkOut).toISOString() : null,
      nights,
      firstName,
      lastName
    });
    
    // עבודה עם תאריכים בלבד, ללא שעות
    const formattedCheckIn = new Date(checkIn);
    const formattedCheckOut = new Date(checkOut);
    
    // המרה ל-UTC לצורך אחידות בשמירה
    // פירוק התאריך לרכיבים (שנה, חודש, יום) והרכבה מחדש ב-UTC
    const checkInUTC = new Date(Date.UTC(
      formattedCheckIn.getFullYear(),
      formattedCheckIn.getMonth(),
      formattedCheckIn.getDate()
    ));
    
    const checkOutUTC = new Date(Date.UTC(
      formattedCheckOut.getFullYear(),
      formattedCheckOut.getMonth(),
      formattedCheckOut.getDate()
    ));
    
    console.log('תאריכי הזמנה לאחר המרה ל-UTC:', {
      original: {
        checkIn: formattedCheckIn.toISOString(),
        checkOut: formattedCheckOut.toISOString()
      },
      formatted: {
        checkIn: checkInUTC.toISOString(),
        checkOut: checkOutUTC.toISOString()
      }
    });
    
    // בדיקת זמינות חדר
    const conflictingBooking = await Booking.checkRoomAvailability(
      roomId,
      checkInUTC,
      checkOutUTC
    );
    
    if (conflictingBooking) {
      return res.status(400).json({ 
        message: 'החדר כבר מוזמן בתאריכים אלו',
        conflict: {
          guestName: `${conflictingBooking.firstName} ${conflictingBooking.lastName}`,
          checkIn: conflictingBooking.checkIn,
          checkOut: conflictingBooking.checkOut,
          roomNumber: conflictingBooking.room.roomNumber
        }
      });
    }
    
    // חישוב מספר לילות במידה ולא סופק
    const calculatedNights = nights || Math.ceil((checkOutUTC - checkInUTC) / (1000 * 60 * 60 * 24));
    
    // יצירת מספר הזמנה רץ באופן atomic עם retry logic
    const locationKey = `bookingNumber_${location || room.location}`;
    let bookingNumber;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        bookingNumber = await Counter.getNextSequence(locationKey);
        console.log(`מספר הזמנה חדש (ניסיון ${attempts + 1}):`, bookingNumber);
        break;
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error('שגיאה ביצירת מספר הזמנה');
        }
        // המתנה קצרה לפני ניסיון נוסף
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // יצירת אובייקט ההזמנה עם retry logic לשמירה
    let newBooking;
    let saveAttempts = 0;
    const maxSaveAttempts = 3;
    
    while (saveAttempts < maxSaveAttempts) {
      try {
        newBooking = new Booking({
          room: roomId,
          location: location || room.location,
          firstName,
          lastName,
          phone,
          email,
          checkIn: checkInUTC,
          checkOut: checkOutUTC,
          nights: calculatedNights,
          isTourist: isTourist || false,
          guests: req.body.guests || 2,
          price,
          pricePerNight,
          pricePerNightNoVat,
          paymentStatus: paymentStatus || 'unpaid',
          creditCard,
          status: status || 'pending',
          notes,
          bookingNumber,
          source: req.body.source || 'direct',
          externalBookingNumber: req.body.externalBookingNumber || '',
          code: code || '',
          reviewHandled: reviewHandled || false
        });
        
        await newBooking.save();
        console.log(`הזמנה נשמרה בהצלחה בניסיון ${saveAttempts + 1}`);
        break;
        
      } catch (saveError) {
        saveAttempts++;
        console.log(`❌ שגיאה בשמירת הזמנה (ניסיון ${saveAttempts}/${maxSaveAttempts}):`, saveError.message);
        
        // אם זו שגיאת מספר הזמנה כפול, נקבל מספר חדש וננסה שוב
        if (saveError.code === 11000 && saveError.message.includes('bookingNumber')) {
          if (saveAttempts >= maxSaveAttempts) {
            throw new Error('נכשל ביצירת הזמנה אחרי מספר ניסיונות');
          }
          // קבלת מספר הזמנה חדש
          bookingNumber = await Counter.getNextSequence(locationKey);
          console.log(`מספר הזמנה חדש לאחר כפילות: ${bookingNumber}`);
          // המתנה קצרה לפני ניסיון נוסף
          await new Promise(resolve => setTimeout(resolve, 200));
        } else {
          // שגיאה אחרת - נזרוק אותה
          throw saveError;
        }
      }
    }
    
    // אם ההזמנה כוללת תשלום, נעדכן את נתוני ההון
    if (newBooking.paymentStatus && newBooking.paymentStatus !== 'unpaid' && newBooking.price > 0) {
      await capitalController.updateCapitalOnNewIncome(newBooking.paymentStatus, newBooking.price);
    }
    
    // החזרת ההזמנה המלאה עם נתוני חדר
    const savedBooking = await Booking.findById(newBooking._id)
      .populate('room', 'roomNumber category basePrice vatPrice');
    
    await savedBooking.populate('room');
    
    console.log('הזמנה נשמרה בהצלחה:', {
      bookingNumber: savedBooking.bookingNumber,
      checkIn: savedBooking.checkIn.toISOString(),
      checkOut: savedBooking.checkOut.toISOString(),
      room: savedBooking.room.roomNumber,
      nights: savedBooking.nights,
      source: savedBooking.source,
      externalBookingNumber: savedBooking.externalBookingNumber || '(לא הוגדר)'
    });
    
    res.status(201).json({
      success: true,
      data: savedBooking,
      message: `הזמנה מספר ${savedBooking.bookingNumber} נוצרה בהצלחה`
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ 
      message: 'שגיאה ביצירת הזמנה חדשה',
      error: error.message 
    });
  }
};

// עדכון הזמנה קיימת
exports.updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // וידוא שההזמנה קיימת
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'הזמנה לא נמצאה' });
    }

    // בדיקה האם זה עדכון של drag & drop שצריך לשמור על המחיר
    const isDragUpdate = updateData.preservePrice === true;
    
    console.log('🔄 עדכון הזמנה:', {
      id,
      isDragUpdate,
      preservePrice: updateData.preservePrice,
      originalPrice: booking.price,
      requestedPrice: updateData.price
    });
    
    // רישום מידע התחלתי
    console.log(`עדכון הזמנה ${id}:`, {
      checkIn: updateData.checkIn ? new Date(updateData.checkIn).toISOString() : undefined,
      checkOut: updateData.checkOut ? new Date(updateData.checkOut).toISOString() : undefined,
      room: updateData.room,
      nights: updateData.nights
    });
    
    // טיפול בתאריכים במידה והם מעודכנים
    if (updateData.checkIn && updateData.checkOut) {
      const formattedCheckIn = new Date(updateData.checkIn);
      const formattedCheckOut = new Date(updateData.checkOut);
      
      // המרה ל-UTC לצורך אחידות בשמירה
      updateData.checkIn = new Date(Date.UTC(
        formattedCheckIn.getFullYear(),
        formattedCheckIn.getMonth(),
        formattedCheckIn.getDate()
      ));
      
      updateData.checkOut = new Date(Date.UTC(
        formattedCheckOut.getFullYear(),
        formattedCheckOut.getMonth(),
        formattedCheckOut.getDate()
      ));
      
      console.log('תאריכי הזמנה מעודכנים לאחר המרה ל-UTC:', {
        original: {
          checkIn: formattedCheckIn.toISOString(),
          checkOut: formattedCheckOut.toISOString()
        },
        formatted: {
          checkIn: updateData.checkIn.toISOString(),
          checkOut: updateData.checkOut.toISOString()
        }
      });
      
      // עדכון מספר לילות
      if (!updateData.nights) {
        updateData.nights = Math.ceil(
          (updateData.checkOut - updateData.checkIn) / (1000 * 60 * 60 * 24)
        );
      }
      
      // בדיקת התנגשות עם הזמנות קיימות אם החדר עודכן או התאריכים השתנו
      if (
        (updateData.room && updateData.room !== booking.room.toString()) ||
        (updateData.checkIn && updateData.checkOut && 
         (updateData.checkIn.toISOString() !== booking.checkIn.toISOString() || 
          updateData.checkOut.toISOString() !== booking.checkOut.toISOString()))
      ) {
        const roomToCheck = updateData.room || booking.room;
        
        const conflictingBooking = await Booking.checkRoomAvailability(
          roomToCheck,
          updateData.checkIn,
          updateData.checkOut,
          id // להוציא את ההזמנה הנוכחית מהבדיקה
        );
        
        if (conflictingBooking) {
          return res.status(400).json({
            message: 'החדר כבר מוזמן בתאריכים אלו',
            conflict: {
              guestName: `${conflictingBooking.firstName} ${conflictingBooking.lastName}`,
              checkIn: conflictingBooking.checkIn,
              checkOut: conflictingBooking.checkOut,
              roomNumber: conflictingBooking.room.roomNumber
            }
          });
        }
      }
    }
    
    // אם זה עדכון drag & drop, נשמור על כל פרטי המחיר הקיימים
    if (isDragUpdate) {
      console.log('💰 שמירה על המחיר הקיים בגרירה');
      
      // הסרת כל נתוני מחיר מה-updateData כדי לשמור על הקיימים
      delete updateData.price;
      delete updateData.pricePerNight;
      delete updateData.pricePerNightNoVat;
      delete updateData.preservePrice; // ניקוי הפלג הטכני
      
      console.log('📋 נתונים שיעודכנו (ללא מחיר):', Object.keys(updateData));
    }

    // הוספת שדות שצריכים להתעדכן במפורש
    if (updateData.reviewHandled !== undefined) {
      console.log('🔄 עדכון מעקב חוות דעת:', updateData.reviewHandled);
    }
    
    if (updateData.manualInvoiceHandled !== undefined) {
      console.log('🧾 עדכון סימון חשבונית ידנית:', updateData.manualInvoiceHandled);
    }

    if (updateData.passportImageHandled !== undefined) {
      console.log('📷 עדכון סימון תמונת דרכון:', updateData.passportImageHandled);
    }

    // עדכון ההזמנה
    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('room', 'roomNumber category basePrice vatPrice');
    
    console.log('הזמנה עודכנה בהצלחה:', {
      bookingNumber: updatedBooking.bookingNumber,
      checkIn: updatedBooking.checkIn.toISOString(),
      checkOut: updatedBooking.checkOut.toISOString(),
      room: updatedBooking.room.roomNumber,
      nights: updatedBooking.nights
    });
    
    // אם שינוי בסטטוס התשלום או בסכום, נעדכן את נתוני ההון
    const oldPaymentStatus = booking.paymentStatus;
    const oldPrice = booking.price;
    const newPaymentStatus = updateData.paymentStatus || oldPaymentStatus;
    const newPrice = updateData.price !== undefined ? updateData.price : oldPrice;
    
    // עדכון נתוני הון אם יש שינוי בתשלום
    if (oldPaymentStatus !== newPaymentStatus || oldPrice !== newPrice) {
      // ביטול ההכנסה הקודמת אם הייתה בתשלום
      if (oldPaymentStatus && oldPaymentStatus !== 'unpaid' && oldPrice > 0) {
        await capitalController.revertCapitalOnExpenseDelete(oldPaymentStatus, oldPrice);
      }
      
      // הוספת ההכנסה החדשה אם היא בתשלום
      if (newPaymentStatus && newPaymentStatus !== 'unpaid' && newPrice > 0) {
        await capitalController.updateCapitalOnNewIncome(newPaymentStatus, newPrice);
      }
    }
    
    res.json({
      success: true,
      booking: updatedBooking, // שמירה על התבנית הקיימת
      data: updatedBooking,
      message: isDragUpdate ? 'ההזמנה הועברה בהצלחה' : 'ההזמנה עודכנה בהצלחה'
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ 
      message: 'שגיאה בעדכון ההזמנה',
      error: error.message 
    });
  }
};

// מחיקת הזמנה
exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    
    // קבלת ההזמנה לפני המחיקה
    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({ message: 'הזמנה לא נמצאה' });
    }
    
    // ביטול הכנסה בנתוני הון אם הייתה בתשלום
    if (booking.paymentStatus && booking.paymentStatus !== 'unpaid' && booking.price > 0) {
      await capitalController.revertCapitalOnExpenseDelete(booking.paymentStatus, booking.price);
    }
    
    // מחיקת ההזמנה
    await Booking.findByIdAndDelete(id);
    
    res.status(200).json({ message: 'הזמנה נמחקה בהצלחה' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ message: 'שגיאה במחיקת ההזמנה' });
  }
};

// בדיקת זמינות חדר בתאריכים מסוימים
exports.checkRoomAvailability = async (req, res) => {
  try {
    const { roomId, checkIn, checkOut, excludeBookingId } = req.query;
    
    if (!roomId || !checkIn || !checkOut) {
      return res.status(400).json({ message: 'חסרים פרמטרים: roomId, checkIn, checkOut' });
    }
    
    // המרת תאריכים לפורמט אחיד ללא שעות
    const checkInParts = new Date(checkIn).toISOString().split('T')[0].split('-');
    const checkOutParts = new Date(checkOut).toISOString().split('T')[0].split('-');
    
    // יצירת תאריכים חדשים עם הגדרת השעה ל-00:00:00 UTC
    const formattedCheckIn = new Date(Date.UTC(
      parseInt(checkInParts[0]),
      parseInt(checkInParts[1]) - 1, // בג'אווסקריפט החודשים הם 0-11
      parseInt(checkInParts[2])
    ));
    
    const formattedCheckOut = new Date(Date.UTC(
      parseInt(checkOutParts[0]),
      parseInt(checkOutParts[1]) - 1, // בג'אווסקריפט החודשים הם 0-11
      parseInt(checkOutParts[2])
    ));
    
    console.log('בדיקת זמינות חדר:', {
      checkIn: formattedCheckIn.toISOString(),
      checkOut: formattedCheckOut.toISOString()
    });
    
    // בניית שאילתת חיפוש
    const query = {
      room: roomId,
      status: { $nin: ['cancelled'] },
      $or: [
        { checkIn: { $lt: formattedCheckOut, $gte: formattedCheckIn } },
        { checkOut: { $gt: formattedCheckIn, $lt: formattedCheckOut } },
        { 
          checkIn: { $lte: formattedCheckIn },
          checkOut: { $gte: formattedCheckOut }
        }
      ]
    };
    
    // אם יש excludeBookingId, לא לבדוק את ההזמנה הזו
    if (excludeBookingId) {
      query._id = { $ne: excludeBookingId };
    }
    
    const existingBooking = await Booking.findOne(query);
    
    if (existingBooking) {
      return res.json({ 
        available: false,
        conflict: {
          bookingId: existingBooking._id,
          guestName: existingBooking.firstName + ' ' + existingBooking.lastName,
          checkIn: existingBooking.checkIn,
          checkOut: existingBooking.checkOut
        }
      });
    }
    
    // החדר פנוי
    return res.json({ available: true });
  
  } catch (error) {
    console.error('Error checking room availability:', error);
    res.status(500).json({ message: 'שגיאה בבדיקת זמינות החדר' });
  }
};

// חיפוש הזמנות לפי טקסט חופשי
exports.searchBookings = async (req, res) => {
  try {
    const { query, location, startDate, endDate } = req.query;
    
    // הגדרת פילטר בסיסי
    let filter = {};
    
    // הוספת תנאי מיקום אם קיים
    if (location) {
      filter.location = location;
    }
    
    // חיפוש לפי טווח תאריכים אם סופקו הפרמטרים המתאימים
    if (startDate && endDate) {
      // המרת תאריכים לפורמט אחיד ללא שעות
      const startDateParts = new Date(startDate).toISOString().split('T')[0].split('-');
      const endDateParts = new Date(endDate).toISOString().split('T')[0].split('-');
      
      // יצירת תאריכים חדשים עם הגדרת השעה ל-00:00:00 UTC
      const formattedStartDate = new Date(Date.UTC(
        parseInt(startDateParts[0]),
        parseInt(startDateParts[1]) - 1, // בג'אווסקריפט החודשים הם 0-11
        parseInt(startDateParts[2])
      ));
      
      const formattedEndDate = new Date(Date.UTC(
        parseInt(endDateParts[0]),
        parseInt(endDateParts[1]) - 1, // בג'אווסקריפט החודשים הם 0-11
        parseInt(endDateParts[2])
      ));
      
      console.log('חיפוש הזמנות בטווח תאריכים:', {
        startDate: formattedStartDate.toISOString(),
        endDate: formattedEndDate.toISOString(),
        location
      });
      
      // בניית פילטר חיפוש משופר לטווח תאריכים
      const dateFilter = {
        $or: [
          // מקרה 1: הזמנות שמתחילות בטווח המבוקש (צ'ק-אין בתוך הטווח)
          { 
            checkIn: { $gte: formattedStartDate, $lte: formattedEndDate } 
          },
          
          // מקרה 2: הזמנות שמסתיימות בטווח המבוקש (צ'ק-אאוט בתוך הטווח)
          { 
            checkOut: { $gt: formattedStartDate, $lte: formattedEndDate } 
          },
          
          // מקרה 3: הזמנות שמקיפות את הטווח כולו (צ'ק-אין לפני, צ'ק-אאוט אחרי)
          { 
            checkIn: { $lt: formattedStartDate },
            checkOut: { $gt: formattedEndDate }
          },
          
          // מקרה 4: הזמנות שחלק מהן בתוך הטווח (צ'ק-אין לפני הטווח, צ'ק-אאוט אחרי תחילת הטווח)
          {
            checkIn: { $lt: formattedStartDate },
            checkOut: { $gt: formattedStartDate, $lte: formattedEndDate }
          }
        ]
      };
      
      // שילוב פילטר התאריכים עם הפילטר הבסיסי
      filter = { ...filter, ...dateFilter };
    }
    
    // חיפוש לפי טקסט חופשי אם סופק פרמטר query
    if (query && query.trim() !== '') {
      // פיצול מילות המפתח לחיפוש
      const keywords = query.trim().split(/\s+/).filter(word => word.length > 0);
      
      // יצירת תבנית חיפוש לכל השדות הטקסטואליים
      const searchPattern = keywords.map(keyword => new RegExp(keyword, 'i'));
      
      // בדיקה אם אחת ממילות המפתח היא מספר (לשימוש עבור מספר הזמנה)
      const numberKeywords = keywords
        .map(k => parseInt(k))
        .filter(n => !isNaN(n));
      
      // בניית תנאי חיפוש מורכב
      const searchConditions = [
        { firstName: { $in: searchPattern } },
        { lastName: { $in: searchPattern } },
        { phone: { $in: searchPattern } },
        { email: { $in: searchPattern } },
        { roomNumber: { $in: searchPattern } },
        { externalBookingNumber: { $in: searchPattern } }
      ];
      
      // הוספת חיפוש למספר הזמנה רק אם יש מספרים בחיפוש
      if (numberKeywords.length > 0) {
        searchConditions.push({ bookingNumber: { $in: numberKeywords } });
      }
      
      // שילוב פילטר החיפוש הטקסטואלי עם הפילטר הקיים
      const textFilter = { $or: searchConditions };
      
      // אם יש כבר פילטר תאריכים, נשלב את שניהם ב-$and
      if (Object.keys(filter).length > 0 && !filter.location) {
        filter = { $and: [filter, textFilter] };
      } else if (filter.location && Object.keys(filter).length === 1) {
        // אם יש רק פילטר מיקום, נוסיף את תנאי החיפוש ונשמור על פילטר המיקום
        filter = { $and: [{ location }, textFilter] };
      } else {
        // אם אין פילטרים אחרים או יש כבר פילטר מורכב, נשלב לפי התנאים
        filter = { ...filter, ...textFilter };
      }
    }
    
    console.log('פילטר חיפוש:', JSON.stringify(filter, null, 2));
    
    // אם אין פילטרים פרט למיקום, נחזיר שגיאה
    if (Object.keys(filter).length === 0 || (Object.keys(filter).length === 1 && filter.location)) {
      return res.status(400).json({ 
        message: 'נדרש לפחות אחד מהפרמטרים: טקסט לחיפוש או טווח תאריכים' 
      });
    }
    
    // ביצוע החיפוש
    const bookings = await Booking.find(filter)
      .populate('room', 'roomNumber category basePrice')
      .sort({ checkIn: -1 }) // הזמנות עדכניות קודם
      .limit(50); // הגבלה ל-50 תוצאות
    
    console.log(`נמצאו ${bookings.length} הזמנות מתאימות לחיפוש`);
    res.json(bookings);
  } catch (error) {
    console.error('Error searching bookings:', error);
    res.status(500).json({ message: 'שגיאה בחיפוש הזמנות' });
  }
};

// יצירת הזמנה מהאתר הציבורי
exports.createPublicBooking = async (req, res) => {
  try {
    console.log('התקבלה בקשה ליצירת הזמנה מהאתר הציבורי:', JSON.stringify(req.body, null, 2));
    
    const {
      firstName,
      lastName,
      email,
      phone,
      guests,
      room,
      checkIn,
      checkOut,
      notes,
      creditCard,
      isTourist,
      language = 'he', // 🔥 הוספת שפת הלקוח עם ברירת מחדל עברית
      // 🆕 פרמטרים חדשים למערכת הנחות
      finalPrice,
      originalPrice,
      appliedDiscounts = [],
      discountAmount = 0
    } = req.body;
    
    // בדיקת שדות חובה
    if (!firstName || !lastName || !email || !phone || !room || !checkIn || !checkOut) {
      console.log('שגיאה: חסרים שדות חובה', { firstName, lastName, email, phone, room, checkIn, checkOut });
      return res.status(400).json({ message: 'חסרים שדות חובה' });
    }
    
    console.log('בדיקת זמינות חדר:', { room, checkIn, checkOut });
    
    // המרת תאריכים לפורמט אחיד ללא שעות
    const checkInParts = new Date(checkIn).toISOString().split('T')[0].split('-');
    const checkOutParts = new Date(checkOut).toISOString().split('T')[0].split('-');
    
    // יצירת תאריכים חדשים עם הגדרת השעה ל-00:00:00 UTC
    const checkInDate = new Date(Date.UTC(
      parseInt(checkInParts[0]),
      parseInt(checkInParts[1]) - 1, // בג'אווסקריפט החודשים הם 0-11
      parseInt(checkInParts[2])
    ));
    
    const checkOutDate = new Date(Date.UTC(
      parseInt(checkOutParts[0]),
      parseInt(checkOutParts[1]) - 1, // בג'אווסקריפט החודשים הם 0-11
      parseInt(checkOutParts[2])
    ));
    
    console.log('תאריכים לאחר המרה:', { 
      checkInDate: checkInDate.toISOString(), 
      checkOutDate: checkOutDate.toISOString() 
    });
    
    try {
      // בדיקה אם החדר זמין
      const existingBooking = await Booking.checkRoomAvailability(room, checkInDate, checkOutDate);
      
      if (existingBooking) {
        console.log('החדר אינו זמין, נמצאה הזמנה קיימת:', existingBooking);
        return res.status(409).json({
          message: 'החדר אינו זמין בתאריכים שנבחרו',
          conflict: {
            bookingId: existingBooking._id,
            guestName: existingBooking.firstName + ' ' + existingBooking.lastName,
            checkIn: existingBooking.checkIn,
            checkOut: existingBooking.checkOut
          }
        });
      }
    } catch (availabilityError) {
      console.error('שגיאה בבדיקת זמינות החדר:', availabilityError);
      return res.status(500).json({ message: 'שגיאה בבדיקת זמינות החדר' });
    }
    
    console.log('מחפש את החדר במסד הנתונים:', room);
    
    // קבלת נתוני החדר לחישוב ואימות המחיר
    try {
      const roomData = await Room.findById(room);
      if (!roomData) {
        console.log('החדר לא נמצא:', room);
        return res.status(404).json({ message: 'החדר שנבחר לא נמצא' });
      }
      
      console.log('נמצא חדר:', { 
        id: roomData._id, 
        roomNumber: roomData.roomNumber, 
        location: roomData.location,
        vatPrice: roomData.vatPrice,
        basePrice: roomData.basePrice
      });
      
      // חישוב מספר הלילות ופרמטרים בסיסיים
      const nights = Math.floor((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
      const guestsCount = parseInt(guests, 10) || 2;
      
      console.log('פרמטרי הזמנה:', { 
        nights, 
        guests: guestsCount, 
        isTourist,
        appliedDiscounts: appliedDiscounts.length,
        discountAmount 
      });
      
      // 🎯 שימוש בנתוני המחיר מהקליינט עם ולידציה בסיסית
      let validatedOriginalPrice = originalPrice || 0;
      let validatedFinalPrice = finalPrice || 0;
      
      // אם לא הגיעו נתוני מחיר מהקליינט, נחשב מחיר בסיסי
      if (!validatedFinalPrice || validatedFinalPrice <= 0) {
        console.log('💰 חישוב מחיר fallback (לא התקבל מהקליינט)');
        const DiscountService = require('../services/discountService');
        
        const calculatedPrice = DiscountService.calculateBasePrice({
          room: roomData,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          nights,
          guests: guestsCount,
          isTourist: isTourist || false
        });
        
        validatedOriginalPrice = calculatedPrice;
        validatedFinalPrice = calculatedPrice;
      }
      
      console.log('💰 נתוני מחיר סופיים:', {
        originalPrice: validatedOriginalPrice,
        finalPrice: validatedFinalPrice,
        discountAmount: discountAmount || 0,
        appliedDiscountsCount: appliedDiscounts?.length || 0
      });
      
      // חישוב מחירים נוספים
      const pricePerNight = nights > 0 ? parseFloat((validatedFinalPrice / nights).toFixed(2)) : 0;
      const pricePerNightNoVat = parseFloat((pricePerNight / 1.18).toFixed(2));
      const finalPriceRounded = parseFloat(validatedFinalPrice.toFixed(2));
      
      // ולידציה בסיסית
      if (finalPriceRounded < 0) {
        return res.status(400).json({ 
          message: 'מחיר סופי לא יכול להיות שלילי' 
        });
      }
      
      if (finalPriceRounded > 10000) {
        console.warn('⚠️  מחיר חשוד גבוה מאוד:', finalPriceRounded);
      }
      
      // יצירת מספר הזמנה רץ באופן atomic עם retry במקרה של כפילות
      const locationKey = `bookingNumber_${roomData.location}`;
      let bookingNumber;
      let newBooking;
      let attempts = 0;
      const maxAttempts = 5;
      
      while (attempts < maxAttempts) {
        try {
          bookingNumber = await Counter.getNextSequence(locationKey);
          console.log(`מספר הזמנה חדש (ניסיון ${attempts + 1}):`, bookingNumber);
          
          // יצירת ההזמנה החדשה
          const newBookingData = {
            firstName,
            lastName,
            email,
            phone,
            guests: guestsCount,
            room,
            roomNumber: roomData.roomNumber,
            location: roomData.location,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            nights,
            price: finalPriceRounded, // 🆕 המחיר הסופי עם הנחות
            pricePerNight: pricePerNight,
            pricePerNightNoVat: pricePerNightNoVat,
            notes,
            bookingNumber,
            source: 'home_website',
            paymentMethod: creditCard ? 'credit-card' : 'cash',
            paymentStatus: 'unpaid',
            status: 'pending',
            isTourist: isTourist || false,
            language: language,
            // 🆕 שמירת פרטי הנחות
            originalPrice: validatedOriginalPrice,
            discountAmount: discountAmount || 0,
            appliedDiscounts: appliedDiscounts || [],
            // שמירת נתוני כרטיס האשראי מלאים
            creditCard: creditCard ? {
              cardNumber: creditCard.cardNumber,
              expiryDate: creditCard.expiryDate,
              cvv: creditCard.cvv
            } : undefined
          };
          
          console.log('יוצר הזמנה חדשה עם הנתונים:', {
            bookingNumber: newBookingData.bookingNumber,
            roomNumber: newBookingData.roomNumber,
            guest: `${newBookingData.firstName} ${newBookingData.lastName}`,
            dates: `${newBookingData.checkIn} - ${newBookingData.checkOut}`,
            originalPrice: newBookingData.originalPrice,
            finalPrice: newBookingData.price,
            discountAmount: newBookingData.discountAmount,
            hasDiscounts: newBookingData.appliedDiscounts.length > 0
          });
          
          newBooking = new Booking(newBookingData);
          await newBooking.save();
          
          // אם הגענו לכאן, ההזמנה נשמרה בהצלחה - נצא מהלולאה
          break;
          
        } catch (saveError) {
          attempts++;
          console.log(`❌ שגיאה בשמירת הזמנה (ניסיון ${attempts}/${maxAttempts}):`, saveError.message);
          
          // אם זו שגיאת מספר הזמנה כפול, ננסה שוב
          if (saveError.code === 11000 && saveError.message.includes('bookingNumber')) {
            if (attempts >= maxAttempts) {
              throw new Error(`נכשל ביצירת הזמנה אחרי ${maxAttempts} ניסיונות - יתכן שיש בעיה במערכת מספרי ההזמנות`);
            }
            console.log(`🔄 מנסה שוב עם מספר הזמנה חדש...`);
            continue;
          } else {
            // שגיאה אחרת - זרוק מיד
            throw saveError;
          }
        }
      }
      
      if (!newBooking) {
        throw new Error('נכשל ביצירת ההזמנה');
      }
      
      console.log('הזמנה נשמרה בהצלחה:', newBooking._id);
      
      // 📧 שליחת מייל אישור הזמנה (+ עותק לניהול כי זו הזמנה ציבורית)
      try {
        const emailService = require('../services/emailService');
        await emailService.sendBookingConfirmation(newBooking, language, true);
        console.log('✅ מייל אישור נשלח בהצלחה ל-', newBooking.email, '+ עותק לניהול');
      } catch (emailError) {
        console.error('❌ שגיאה בשליחת מייל אישור (ההזמנה נשמרה):', emailError.message);
        // לא נקרוס את ההזמנה בגלל שגיאת מייל
      }
      
      // החזרת אישור יצירת ההזמנה
      res.status(201).json({
        success: true,
        message: 'ההזמנה נוצרה בהצלחה',
        data: {
          bookingNumber,
          checkIn: newBooking.checkIn,
          checkOut: newBooking.checkOut,
          nights: newBooking.nights,
          price: newBooking.price,
          originalPrice: newBooking.originalPrice,
          discountAmount: newBooking.discountAmount,
          roomType: roomData.category,
          roomNumber: roomData.roomNumber,
          hasDiscounts: (newBooking.appliedDiscounts && newBooking.appliedDiscounts.length > 0)
        }
      });
    } catch (roomError) {
      console.error('שגיאה בעיבוד נתוני החדר או שמירת ההזמנה:', roomError);
      return res.status(500).json({ message: 'שגיאה בעיבוד נתוני החדר או שמירת ההזמנה', error: roomError.message });
    }
  } catch (error) {
    console.error('שגיאה כללית ביצירת הזמנה:', error);
    res.status(500).json({ message: 'שגיאה ביצירת ההזמנה', error: error.message });
  }
};

// הוספת תמונות להזמנה קיימת
exports.uploadBookingImages = async (req, res) => {
  try {
    const { id } = req.params;
    const uploadedFiles = req.files;
    
    console.log(`📸 מעלה ${uploadedFiles?.length || 0} תמונות להזמנה ${id}`);
    
    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ 
        error: 'לא נבחרו קבצים להעלאה' 
      });
    }
    
    // חיפוש ההזמנה
    const booking = await Booking.findById(id);
    if (!booking) {
      // מחיקת הקבצים שהועלו כי ההזמנה לא נמצאה
      await deleteBookingImages(uploadedFiles.map(file => ({
        path: file.path,
        filename: file.filename
      })));
      
      return res.status(404).json({ 
        error: 'הזמנה לא נמצאה' 
      });
    }
    
    // בדיקה שלא יהיו יותר מ-2 תמונות בסך הכל
    const currentImagesCount = booking.attachedImages?.length || 0;
    const newImagesCount = uploadedFiles.length;
    const totalImages = currentImagesCount + newImagesCount;
    
    if (totalImages > 2) {
      // מחיקת הקבצים החדשים
      await deleteBookingImages(uploadedFiles.map(file => ({
        path: file.path,
        filename: file.filename
      })));
      
      return res.status(400).json({ 
        error: `ניתן להעלות מקסימום 2 תמונות. כרגע יש ${currentImagesCount} תמונות קיימות` 
      });
    }
    
    // הכנת מערך התמונות החדשות
    const newImages = uploadedFiles.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      uploadedAt: new Date()
    }));
    
    // הוספת התמונות להזמנה
    if (!booking.attachedImages) {
      booking.attachedImages = [];
    }
    booking.attachedImages.push(...newImages);
    
    await booking.save();
    
    console.log(`✅ הועלו ${newImages.length} תמונות להזמנה ${id}`);
    
    res.json({
      success: true,
      message: `הועלו ${newImages.length} תמונות בהצלחה`,
      images: newImages.map(img => ({
        filename: img.filename,
        originalName: img.originalName,
        size: img.size,
        mimetype: img.mimetype,
        uploadedAt: img.uploadedAt
      }))
    });
  } catch (error) {
    console.error('❌ שגיאה בהעלאת תמונות:', error);
    
    // מחיקת קבצים במקרה של שגיאה
    if (req.files) {
      await deleteBookingImages(req.files.map(file => ({
        path: file.path,
        filename: file.filename
      })));
    }
    
    res.status(500).json({ 
      error: 'שגיאה בהעלאת התמונות',
      details: error.message 
    });
  }
};

// מחיקת תמונה מהזמנה
exports.deleteBookingImage = async (req, res) => {
  try {
    const { id, imageIndex } = req.params;
    const imageIndexNum = parseInt(imageIndex);
    
    console.log(`🗑️ מוחק תמונה ${imageIndexNum} מהזמנה ${id}`);
    
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ 
        error: 'הזמנה לא נמצאה' 
      });
    }
    
    if (!booking.attachedImages || booking.attachedImages.length === 0) {
      return res.status(400).json({ 
        error: 'אין תמונות מצורפות להזמנה זו' 
      });
    }
    
    if (imageIndexNum < 0 || imageIndexNum >= booking.attachedImages.length) {
      return res.status(400).json({ 
        error: 'אינדקס תמונה לא תקין' 
      });
    }
    
    // שמירת נתוני התמונה למחיקה
    const imageToDelete = booking.attachedImages[imageIndexNum];
    
    // הסרת התמונה מהמערך
    booking.attachedImages.splice(imageIndexNum, 1);
    
    await booking.save();
    
    // מחיקת הקובץ מהדיסק
    await deleteBookingImages([imageToDelete]);
    
    console.log(`✅ נמחקה תמונה ${imageToDelete.filename} מהזמנה ${id}`);
    
    res.json({
      success: true,
      message: 'התמונה נמחקה בהצלחה',
      remainingImages: booking.attachedImages.length
    });
  } catch (error) {
    console.error('❌ שגיאה במחיקת תמונה:', error);
    res.status(500).json({ 
      error: 'שגיאה במחיקת התמונה',
      details: error.message 
    });
  }
};

// קבלת תמונה להורדה
exports.getBookingImage = async (req, res) => {
  try {
    const { id, imageIndex } = req.params;
    const imageIndexNum = parseInt(imageIndex);
    
    console.log(`🖼️ בקשה לתמונה: הזמנה ${id}, אינדקס ${imageIndex}`);
    console.log(`🖼️ Query params:`, req.query);
    console.log(`🖼️ Headers:`, req.headers.authorization ? 'Has auth header' : 'No auth header');
    
    const booking = await Booking.findById(id);
    if (!booking) {
      console.log(`❌ הזמנה לא נמצאה: ${id}`);
      return res.status(404).json({ 
        error: 'הזמנה לא נמצאה' 
      });
    }
    
    if (!booking.attachedImages || booking.attachedImages.length === 0) {
      return res.status(404).json({ 
        error: 'אין תמונות מצורפות להזמנה זו' 
      });
    }
    
    if (imageIndexNum < 0 || imageIndexNum >= booking.attachedImages.length) {
      return res.status(400).json({ 
        error: 'אינדקס תמונה לא תקין' 
      });
    }
    
    const image = booking.attachedImages[imageIndexNum];
    const fs = require('fs');
    
    // בדיקה שהקובץ קיים
    if (!fs.existsSync(image.path)) {
      console.log(`❌ קובץ לא נמצא: ${image.path}`);
      return res.status(404).json({ 
        error: 'קובץ התמונה לא נמצא' 
      });
    }
    
    // בדיקה אם זו בקשת הורדה
    const isDownload = req.query.download === 'true';
    
    // החזרת הקובץ
    res.setHeader('Content-Type', image.mimetype);
    
    if (isDownload) {
      // הורדה - הכרח להוריד את הקובץ
      res.setHeader('Content-Disposition', `attachment; filename="${image.originalName}"`);
      console.log(`⬇️ מוריד קובץ: ${image.originalName}`);
    } else {
      // תצוגה - הצגה בדפדפן
      res.setHeader('Content-Disposition', `inline; filename="${image.originalName}"`);
      console.log(`👁️ מציג קובץ: ${image.originalName}`);
    }
    
    res.sendFile(path.resolve(image.path));
    
  } catch (error) {
    console.error('❌ שגיאה בהורדת תמונה:', error);
    res.status(500).json({ 
      error: 'שגיאה בהורדת התמונה',
      details: error.message 
    });
  }
};

// משתנה לשמירת timestamp של רענון לוח המודעות
let noticeBoardRefreshTimestamp = 0;

// טריגר לרענון לוח המודעות
exports.triggerNoticeBoardRefresh = async (req, res) => {
  try {
    noticeBoardRefreshTimestamp = Date.now();
    console.log('🔄 Notice board refresh triggered:', new Date(noticeBoardRefreshTimestamp));
    
    res.json({ 
      success: true, 
      timestamp: noticeBoardRefreshTimestamp,
      message: 'בקשת רענון נשלחה בהצלחה' 
    });
  } catch (error) {
    console.error('❌ שגיאה בטריגר רענון לוח המודעות:', error);
    res.status(500).json({ 
      error: 'שגיאה בטריגר רענון לוח המודעות',
      details: error.message 
    });
  }
};

// קבלת סטטוס רענון לוח המודעות
exports.getNoticeBoardRefreshStatus = async (req, res) => {
  try {
    const { lastCheck } = req.query;
    const lastCheckTimestamp = parseInt(lastCheck) || 0;
    
    res.json({
      timestamp: noticeBoardRefreshTimestamp,
      shouldRefresh: noticeBoardRefreshTimestamp > lastCheckTimestamp
    });
  } catch (error) {
    console.error('❌ שגיאה בקבלת סטטוס רענון לוח המודעות:', error);
    res.status(500).json({ 
      error: 'שגיאה בקבלת סטטוס רענון לוח המודעות',
      details: error.message 
    });
  }
};
