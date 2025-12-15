const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const mongoose = require('mongoose');

/**
 * אימות פשוט לדף הניקיון על בסיס סיסמה בלבד (ללא משתמש)
 * ברירת מחדל: 8788, ניתן לעדכן דרך משתנה סביבה CLEANING_PASSWORD
 */
const SIMPLE_CLEANING_PASSWORD = process.env.CLEANING_PASSWORD || '8788';

const cleaningAuth = (req, res, next) => {
  try {
    const passwordFromHeader = req.headers['x-cleaning-password'];
    const passwordFromBody = req.body?.password;
    const passwordFromQuery = req.query?.password;

    const providedPassword = passwordFromHeader || passwordFromBody || passwordFromQuery;

    if (!providedPassword) {
      return res.status(401).json({ message: 'נדרשת סיסמה לצפייה בדף הניקיון' });
    }

    if (providedPassword !== SIMPLE_CLEANING_PASSWORD) {
      return res.status(401).json({ message: 'סיסמת ניקיון שגויה' });
    }

    next();
  } catch (error) {
    console.error('שגיאה בבדיקת סיסמת ניקיון:', error);
    return res.status(500).json({ message: 'שגיאה באימות סיסמת ניקיון' });
  }
};

// החלת סיסמת הניקיון על כל נתיבי /api/cleaning/*
router.use(cleaningAuth);

/**
 * @route   GET /api/cleaning/tasks
 * @desc    קבלת רשימת משימות ניקיון עבור תאריכים מסוימים
 * @access  protected with simple password (8788)
 */
router.get('/tasks', async (req, res) => {
  try {
    const { dates } = req.query;
    
    if (!dates) {
      return res.status(400).json({ message: 'יש לספק רשימת תאריכים' });
    }
    
    const datesList = dates.split(',');
    const tasks = {};
    
    // אתחול מבנה התשובה
    for (let i = 0; i < datesList.length; i++) {
      tasks[i] = [];
    }
    
    // עבור כל תאריך, מצא הזמנות שמסתיימות באותו יום (צ'ק-אאוט)
    for (let i = 0; i < datesList.length; i++) {
      const date = datesList[i];
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      // מציאת הזמנות שמסתיימות ביום מסוים (צ'ק-אאוט)
      const bookings = await Booking.find({
        checkOut: {
          $gte: startDate,
          $lte: endDate
        },
        status: { $ne: 'cancelled' } // לא כולל הזמנות שבוטלו
      }).populate('room', 'roomNumber location');
      
      // המרה להזמנות ניקיון
      const dayTasks = bookings.map(booking => ({
        _id: booking._id,
        roomNumber: booking.room?.roomNumber || booking.roomNumber,
        location: booking.room?.location || booking.location,
        status: booking.cleaningStatus || 'dirty', // ברירת מחדל: מלוכלך
        checkOutDate: booking.checkOut
      }));
      
      tasks[i] = dayTasks;
    }
    
    res.json({ tasks });
  } catch (error) {
    console.error('שגיאה בקבלת משימות ניקיון:', error);
    res.status(500).json({ message: 'שגיאת שרת בקבלת משימות ניקיון' });
  }
});

/**
 * @route   POST /api/cleaning/mark-clean
 * @desc    סימון חדר כנקי
 * @access  protected with simple password (8788)
 */
router.post('/mark-clean', async (req, res) => {
  try {
    const { taskId } = req.body;
    
    if (!taskId) {
      return res.status(400).json({ message: 'יש לספק מזהה משימה' });
    }
    
    // בדיקה שה-ID תקין
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: 'מזהה משימה לא תקין' });
    }
    
    // עדכון סטטוס הניקיון בהזמנה
    const booking = await Booking.findByIdAndUpdate(
      taskId,
      { cleaningStatus: 'clean' },
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({ message: 'הזמנה לא נמצאה' });
    }
    
    res.json({ success: true, booking });
  } catch (error) {
    console.error('שגיאה בסימון חדר כנקי:', error);
    res.status(500).json({ message: 'שגיאת שרת בסימון חדר כנקי' });
  }
});

/**
 * @route   POST /api/cleaning/mark-dirty
 * @desc    סימון חדר כמלוכלך
 * @access  protected with simple password (8788)
 */
router.post('/mark-dirty', async (req, res) => {
  try {
    const { taskId } = req.body;
    
    if (!taskId) {
      return res.status(400).json({ message: 'יש לספק מזהה משימה' });
    }
    
    // בדיקה שה-ID תקין
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: 'מזהה משימה לא תקין' });
    }
    
    // עדכון סטטוס הניקיון בהזמנה לחזרה למצב מלוכלך
    const booking = await Booking.findByIdAndUpdate(
      taskId,
      { cleaningStatus: 'dirty' },
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({ message: 'הזמנה לא נמצאה' });
    }
    
    res.json({ success: true, booking });
  } catch (error) {
    console.error('שגיאה בסימון חדר כמלוכלך:', error);
    res.status(500).json({ message: 'שגיאת שרת בסימון חדר כמלוכלך' });
  }
});

module.exports = router; 