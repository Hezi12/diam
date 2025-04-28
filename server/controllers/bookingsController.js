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
    
    // בניית פילטר חיפוש
    const dateFilter = {
      $or: [
        // הזמנות שמתחילות בטווח המבוקש
        { checkIn: { $gte: new Date(startDate), $lte: new Date(endDate) } },
        // הזמנות שמסתיימות בטווח המבוקש
        { checkOut: { $gte: new Date(startDate), $lte: new Date(endDate) } },
        // הזמנות שמתחילות לפני הטווח ומסתיימות אחריו (כלומר, הטווח המבוקש נמצא בתוך תקופת ההזמנה)
        { 
          checkIn: { $lt: new Date(startDate) },
          checkOut: { $gt: new Date(endDate) }
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
    
    // טיפול בשעות התאריכים - צ'ק-אין בשעה 14:00 וצ'ק-אאוט בשעה 12:00
    const checkInDate = new Date(checkIn);
    checkInDate.setHours(0, 0, 0, 0);
    
    const checkOutDate = new Date(checkOut);
    checkOutDate.setHours(0, 0, 0, 0);
    
    // בדיקת זמינות החדר בתאריכים המבוקשים
    const existingBooking = await Booking.findOne({
      room: roomId,
      status: { $nin: ['cancelled'] },
      $or: [
        // הזמנה קיימת שמתחילה בטווח התאריכים המבוקש
        { checkIn: { $lt: checkOutDate, $gte: checkInDate } },
        // הזמנה קיימת שמסתיימת בטווח התאריכים המבוקש 
        // אבל מאפשרים צ'ק-אין בתאריך צ'ק-אאוט של הזמנה קיימת
        { checkOut: { $gt: checkInDate, $lt: checkOutDate } },
        // הזמנה קיימת שמכילה את כל טווח התאריכים המבוקש
        { 
          checkIn: { $lte: checkInDate },
          checkOut: { $gte: checkOutDate }
        }
      ]
    });
    
    if (existingBooking) {
      return res.status(400).json({ 
        message: 'החדר כבר מוזמן בתאריכים המבוקשים',
        conflict: {
          bookingId: existingBooking._id,
          guestName: existingBooking.firstName + ' ' + existingBooking.lastName,
          checkIn: existingBooking.checkIn,
          checkOut: existingBooking.checkOut
        }
      });
    }
    
    // יצירת ההזמנה החדשה
    const newBooking = new Booking({
      room: roomId,
      location,
      roomNumber: room.roomNumber,
      firstName,
      lastName,
      phone,
      email,
      checkIn: checkInDate,  // משתמשים בתאריך עם השעה 14:00
      checkOut: checkOutDate, // משתמשים בתאריך עם השעה 12:00
      nights,
      isTourist,
      price,
      pricePerNight,
      pricePerNightNoVat,
      paymentStatus,
      creditCard,
      status,
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
    
    // הסרת שדות שאסור לעדכן ישירות
    delete updateData._id;
    delete updateData.__v;
    
    // בדיקה אם ההזמנה קיימת
    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({ message: 'הזמנה לא נמצאה' });
    }
    
    // טיפול בשעות התאריכים אם הם עודכנו
    if (updateData.checkIn) {
      const checkInDate = new Date(updateData.checkIn);
      checkInDate.setHours(0, 0, 0, 0);
      updateData.checkIn = checkInDate;
    }
    
    if (updateData.checkOut) {
      const checkOutDate = new Date(updateData.checkOut);
      checkOutDate.setHours(0, 0, 0, 0);
      updateData.checkOut = checkOutDate;
    }
    
    // אם שונה החדר או התאריכים, יש לבדוק זמינות
    if (
      (updateData.room && updateData.room !== booking.room.toString()) ||
      (updateData.checkIn && new Date(updateData.checkIn).getTime() !== new Date(booking.checkIn).getTime()) ||
      (updateData.checkOut && new Date(updateData.checkOut).getTime() !== new Date(booking.checkOut).getTime())
    ) {
      const roomId = updateData.room || booking.room;
      const checkIn = updateData.checkIn || booking.checkIn;
      const checkOut = updateData.checkOut || booking.checkOut;
      
      // בדיקת זמינות החדר בתאריכים החדשים
      const existingBooking = await Booking.findOne({
        _id: { $ne: id }, // לא לבדוק את ההזמנה הנוכחית
        room: roomId,
        status: { $nin: ['cancelled'] },
        $or: [
          { checkIn: { $lt: checkOut, $gte: checkIn } },
          { checkOut: { $gt: checkIn, $lte: checkOut } },
          { 
            checkIn: { $lte: checkIn },
            checkOut: { $gte: checkOut }
          }
        ]
      });
      
      if (existingBooking) {
        return res.status(400).json({ 
          message: 'החדר כבר מוזמן בתאריכים המבוקשים',
          conflict: {
            bookingId: existingBooking._id,
            guestName: existingBooking.firstName + ' ' + existingBooking.lastName,
            checkIn: existingBooking.checkIn,
            checkOut: existingBooking.checkOut
          }
        });
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