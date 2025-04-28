const Booking = require('../models/Booking');
const Room = require('../models/Room');

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
    const startDateObj = new Date(startDate);
    const startDateString = startDateObj.toISOString().split('T')[0];
    const formattedStartDate = new Date(startDateString);
    
    const endDateObj = new Date(endDate);
    const endDateString = endDateObj.toISOString().split('T')[0];
    const formattedEndDate = new Date(endDateString);
    
    // בניית פילטר חיפוש
    const dateFilter = {
      $or: [
        // הזמנות שמתחילות בטווח המבוקש
        { checkIn: { $gte: formattedStartDate, $lte: formattedEndDate } },
        // הזמנות שמסתיימות בטווח המבוקש
        { checkOut: { $gte: formattedStartDate, $lte: formattedEndDate } },
        // הזמנות שמתחילות לפני הטווח ומסתיימות אחריו (כלומר, הטווח המבוקש נמצא בתוך תקופת ההזמנה)
        { 
          checkIn: { $lt: formattedStartDate },
          checkOut: { $gt: formattedEndDate }
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
    
    // עבודה עם תאריכים בלבד, ללא שעות
    // יצירת תאריכים חדשים בפורמט יום-חודש-שנה בלבד
    const checkInDate = new Date(checkIn);
    const checkInDateString = checkInDate.toISOString().split('T')[0]; // שימוש רק בחלק התאריך: YYYY-MM-DD
    const formattedCheckIn = new Date(checkInDateString);
    
    const checkOutDate = new Date(checkOut);
    const checkOutDateString = checkOutDate.toISOString().split('T')[0]; // שימוש רק בחלק התאריך: YYYY-MM-DD
    const formattedCheckOut = new Date(checkOutDateString);
    
    // בדיקת זמינות חדר
    const conflictingBooking = await Booking.checkRoomAvailability(
      roomId,
      formattedCheckIn,
      formattedCheckOut
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
    
    // יצירת אובייקט ההזמנה
    const newBooking = new Booking({
      room: roomId,
      location,
      firstName,
      lastName,
      phone,
      email,
      checkIn: formattedCheckIn,
      checkOut: formattedCheckOut,
      nights: nights || Math.ceil((formattedCheckOut - formattedCheckIn) / (1000 * 60 * 60 * 24)),
      isTourist: isTourist || false,
      price,
      pricePerNight,
      pricePerNightNoVat,
      paymentStatus: paymentStatus || 'unpaid',
      creditCard,
      status: status || 'pending',
      notes
    });
    
    await newBooking.save();
    
    // החזרת ההזמנה המלאה עם נתוני חדר
    const savedBooking = await Booking.findById(newBooking._id)
      .populate('room', 'roomNumber category basePrice vatPrice');
    
    await savedBooking.populate('room');
    
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
    
    // טיפול בתאריכים במידה והם מעודכנים
    if (updateData.checkIn && updateData.checkOut) {
      // עבודה עם תאריכים בלבד, ללא שעות
      const checkInDate = new Date(updateData.checkIn);
      const checkInDateString = checkInDate.toISOString().split('T')[0]; // שימוש רק בחלק התאריך: YYYY-MM-DD
      updateData.checkIn = new Date(checkInDateString);
      
      const checkOutDate = new Date(updateData.checkOut);
      const checkOutDateString = checkOutDate.toISOString().split('T')[0]; // שימוש רק בחלק התאריך: YYYY-MM-DD
      updateData.checkOut = new Date(checkOutDateString);
      
      // עדכון מספר לילות
      if (!updateData.nights) {
        updateData.nights = Math.ceil((updateData.checkOut - updateData.checkIn) / (1000 * 60 * 60 * 24));
      }
      
      // בדיקת זמינות חדר אם יש שינוי בתאריכים או בחדר
      if (
        updateData.checkIn.getTime() !== booking.checkIn.getTime() ||
        updateData.checkOut.getTime() !== booking.checkOut.getTime() ||
        (updateData.room && updateData.room !== booking.room.toString())
      ) {
        const roomId = updateData.room || booking.room;
        
        // בדיקת זמינות חדר
        const conflictingBooking = await Booking.checkRoomAvailability(
          roomId,
          updateData.checkIn,
          updateData.checkOut,
          id // מזהה ההזמנה הנוכחית להתעלם ממנה בבדיקה
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
    
    // עדכון מספר החדר אם החדר שונה
    if (updateData.room && updateData.room !== booking.room.toString()) {
      const room = await Room.findById(updateData.room);
      if (!room) {
        return res.status(404).json({ message: 'החדר המבוקש לא נמצא' });
      }
      updateData.roomNumber = room.roomNumber;
    }
    
    // עדכון ההזמנה
    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('room', 'roomNumber category basePrice vatPrice');
    
    res.json(updatedBooking);
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
    
    const deletedBooking = await Booking.findByIdAndDelete(id);
    
    if (!deletedBooking) {
      return res.status(404).json({ message: 'הזמנה לא נמצאה' });
    }
    
    res.json({ message: 'ההזמנה נמחקה בהצלחה' });
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
    
    // טיפול בשעות התאריכים
    const checkInDate = new Date(checkIn);
    checkInDate.setHours(0, 0, 0, 0);
    
    const checkOutDate = new Date(checkOut);
    checkOutDate.setHours(0, 0, 0, 0);
    
    // בניית שאילתת חיפוש
    const query = {
      room: roomId,
      status: { $nin: ['cancelled'] },
      $or: [
        { checkIn: { $lt: checkOutDate, $gte: checkInDate } },
        { checkOut: { $gt: checkInDate, $lt: checkOutDate } },
        { 
          checkIn: { $lte: checkInDate },
          checkOut: { $gte: checkOutDate }
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
    const { query, location } = req.query;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({ message: 'נדרש טקסט לחיפוש' });
    }
    
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
      { roomNumber: { $in: searchPattern } }
    ];
    
    // הוספת חיפוש למספר הזמנה רק אם יש מספרים בחיפוש
    if (numberKeywords.length > 0) {
      searchConditions.push({ bookingNumber: { $in: numberKeywords } });
    }
    
    // הוספת תנאי מיקום אם קיים
    const filter = location ? 
      { $and: [{ location }, { $or: searchConditions }] } :
      { $or: searchConditions };
    
    // ביצוע החיפוש
    const bookings = await Booking.find(filter)
      .populate('room', 'roomNumber category basePrice')
      .sort({ checkIn: -1 }) // הזמנות עדכניות קודם
      .limit(20); // הגבלה ל-20 תוצאות
    
    res.json(bookings);
  } catch (error) {
    console.error('Error searching bookings:', error);
    res.status(500).json({ message: 'שגיאה בחיפוש הזמנות' });
  }
}; 