const Booking = require('../models/Booking');
const Room = require('../models/Room');
const capitalController = require('./capitalController');

// קבלת כל ההזמנות
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('room', 'roomNumber category basePrice')
      .sort({ checkIn: 1 });
    
    res.json(bookings);
  } catch (error) {
    console.error('Error getting bookings:', error);
    res.status(500).json({ message: 'שגיאה בקבלת רשימת ההזמנות' });
  }
};

// קבלת הזמנות לפי מיקום
exports.getBookingsByLocation = async (req, res) => {
  try {
    const { location } = req.params;
    
    // וידוא שהמיקום תקין
    if (!['airport', 'rothschild'].includes(location)) {
      return res.status(400).json({ message: 'מיקום לא תקין' });
    }
    
    const bookings = await Booking.find({ location })
      .populate('room', 'roomNumber category basePrice')
      .sort({ checkIn: 1 });
    
    res.json(bookings);
  } catch (error) {
    console.error('Error getting bookings by location:', error);
    res.status(500).json({ message: 'שגיאה בקבלת רשימת ההזמנות' });
  }
};

// קבלת הזמנות בטווח תאריכים 
exports.getBookingsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, location } = req.query;
    
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
    
    console.log('חיפוש הזמנות בטווח תאריכים:', {
      startDate: formattedStartDate.toISOString(),
      endDate: formattedEndDate.toISOString(),
      location
    });
    
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
    const filter = location ? 
      { ...dateFilter, location } :
      dateFilter;
    
    const bookings = await Booking.find(filter)
      .populate('room', 'roomNumber category basePrice')
      .sort({ checkIn: 1 });
    
    console.log(`נמצאו ${bookings.length} הזמנות בטווח התאריכים`);
    
    res.json(bookings);
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
    
    res.json(booking);
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
      notes
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
    
    // יצירת אובייקט ההזמנה
    const newBooking = new Booking({
      room: roomId,
      location,
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
      source: req.body.source || 'direct',
      externalBookingNumber: req.body.externalBookingNumber || ''
    });
    
    await newBooking.save();
    
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
      data: updatedBooking,
      message: 'ההזמנה עודכנה בהצלחה'
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
      isTourist
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
    
    // קבלת נתוני החדר לחישוב המחיר
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
      
      // חישוב מספר הלילות ומחיר סופי עם אורחים נוספים
      const nights = Math.floor((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
      const guestsCount = parseInt(guests, 10) || 2;
      
      // חישוב מחיר עם אורחים נוספים
      const baseOccupancy = roomData.baseOccupancy || 2;
      const extraGuestCharge = roomData.extraGuestCharge || 0;
      const extraGuests = Math.max(0, guestsCount - baseOccupancy);
      const extraCharge = extraGuests * extraGuestCharge;
      
      // מחיר ללילה כולל תוספת אורחים
      const pricePerNight = roomData.vatPrice + extraCharge;
      const pricePerNightNoVat = roomData.basePrice + extraCharge;
      const price = nights * pricePerNight;
      
              console.log('חישוב תמחור:', { 
          nights, 
          guests: guestsCount, 
          baseOccupancy, 
          extraGuests, 
          extraCharge, 
          pricePerNight, 
          price 
        });
      
      // יצירת מספר הזמנה רץ
      const lastBooking = await Booking.findOne({ location: roomData.location })
        .sort({ bookingNumber: -1 })
        .limit(1);
      
      const bookingNumber = lastBooking ? lastBooking.bookingNumber + 1 : 1000;
      console.log('מספר הזמנה חדש:', bookingNumber);
      
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
        price,
        pricePerNight: pricePerNight,
        pricePerNightNoVat: pricePerNightNoVat,
        notes,
        bookingNumber,
        source: 'website',
        paymentMethod: creditCard ? 'credit-card' : 'cash',
        paymentStatus: 'unpaid',
        status: 'pending',
        isTourist: isTourist || false,
        // שמירת נתוני כרטיס האשראי בצורה מאובטחת
        creditCard: creditCard ? {
          lastDigits: creditCard.cardNumber.slice(-4),
          expiryDate: creditCard.expiryDate
        } : undefined
      };
      
      console.log('יוצר הזמנה חדשה עם הנתונים:', {
        bookingNumber: newBookingData.bookingNumber,
        roomNumber: newBookingData.roomNumber,
        guest: `${newBookingData.firstName} ${newBookingData.lastName}`,
        dates: `${newBookingData.checkIn} - ${newBookingData.checkOut}`,
        price: newBookingData.price
      });
      
      const newBooking = new Booking(newBookingData);
      
      await newBooking.save();
      
      console.log('הזמנה נשמרה בהצלחה:', newBooking._id);
      
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
          roomType: roomData.category,
          roomNumber: roomData.roomNumber
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
