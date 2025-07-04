const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Discount = require('../models/Discount');
const Room = require('../models/Room');

/**
 * קבלת כל ההנחות
 * GET /api/discounts
 */
router.get('/', auth, async (req, res) => {
  try {
    const { location, isActive, validityType } = req.query;
    
    // בניית פילטר
    const filter = {};
    if (location) filter.location = location;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (validityType) filter.validityType = validityType;
    
    const discounts = await Discount.find(filter)
      .populate('applicableRooms', 'roomNumber category')
      .populate('createdBy', 'name email')
      .sort({ priority: -1, createdAt: -1 });
    
    res.json(discounts);
  } catch (error) {
    console.error('שגיאה בקבלת הנחות:', error);
    res.status(500).json({ message: 'שגיאה בקבלת רשימת ההנחות' });
  }
});

/**
 * קבלת הנחה לפי ID
 * GET /api/discounts/:id
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id)
      .populate('applicableRooms', 'roomNumber category')
      .populate('createdBy', 'name email')
      .populate('usageHistory.bookingId', 'bookingNumber guestName');
    
    if (!discount) {
      return res.status(404).json({ message: 'הנחה לא נמצאה' });
    }
    
    res.json(discount);
  } catch (error) {
    console.error('שגיאה בקבלת הנחה:', error);
    res.status(500).json({ message: 'שגיאה בקבלת פרטי ההנחה' });
  }
});

/**
 * יצירת הנחה חדשה
 * POST /api/discounts
 */
router.post('/', auth, async (req, res) => {
  try {
    const discountData = {
      ...req.body,
      createdBy: req.user.id
    };
    
    const discount = new Discount(discountData);
    await discount.save();
    
    // populate הנתונים החזרה
    await discount.populate('applicableRooms', 'roomNumber category');
    await discount.populate('createdBy', 'name email');
    
    res.status(201).json(discount);
  } catch (error) {
    console.error('שגיאה ביצירת הנחה:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'שגיאות ולידציה', errors });
    }
    
    res.status(500).json({ message: 'שגיאה ביצירת ההנחה' });
  }
});

/**
 * עדכון הנחה
 * PUT /api/discounts/:id
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id);
    
    if (!discount) {
      return res.status(404).json({ message: 'הנחה לא נמצאה' });
    }
    
    // עדכון השדות
    Object.keys(req.body).forEach(key => {
      if (key !== '_id' && key !== 'createdBy' && key !== 'usageHistory') {
        discount[key] = req.body[key];
      }
    });
    
    await discount.save();
    
    // populate הנתונים החזרה
    await discount.populate('applicableRooms', 'roomNumber category');
    await discount.populate('createdBy', 'name email');
    
    res.json(discount);
  } catch (error) {
    console.error('שגיאה בעדכון הנחה:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'שגיאות ולידציה', errors });
    }
    
    res.status(500).json({ message: 'שגיאה בעדכון ההנחה' });
  }
});

/**
 * עדכון הנחה (גם בשיטת PATCH)
 * PATCH /api/discounts/:id
 */
router.patch('/:id', auth, async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id);
    
    if (!discount) {
      return res.status(404).json({ message: 'הנחה לא נמצאה' });
    }
    
    // עדכון השדות
    Object.keys(req.body).forEach(key => {
      if (key !== '_id' && key !== 'createdBy' && key !== 'usageHistory') {
        discount[key] = req.body[key];
      }
    });
    
    await discount.save();
    
    // populate הנתונים החזרה
    await discount.populate('applicableRooms', 'roomNumber category');
    await discount.populate('createdBy', 'name email');
    
    res.json(discount);
  } catch (error) {
    console.error('שגיאה בעדכון הנחה:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'שגיאות ולידציה', errors });
    }
    
    res.status(500).json({ message: 'שגיאה בעדכון ההנחה' });
  }
});

/**
 * מחיקת הנחה
 * DELETE /api/discounts/:id
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id);
    
    if (!discount) {
      return res.status(404).json({ message: 'הנחה לא נמצאה' });
    }
    
    // בדיקה אם ההנחה בשימוש
    if (discount.usageLimit.currentUses && discount.usageLimit.currentUses > 0) {
      return res.status(400).json({ 
        message: 'לא ניתן למחוק הנחה שכבר נוצלה. ניתן להפסיק את פעילותה במקום זאת.' 
      });
    }
    
    await Discount.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'ההנחה נמחקה בהצלחה' });
  } catch (error) {
    console.error('שגיאה במחיקת הנחה:', error);
    res.status(500).json({ message: 'שגיאה במחיקת ההנחה' });
  }
});

/**
 * שינוי סטטוס הנחה (פעיל/לא פעיל)
 * PATCH /api/discounts/:id/toggle-status
 */
router.patch('/:id/toggle-status', auth, async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id);
    
    if (!discount) {
      return res.status(404).json({ message: 'הנחה לא נמצאה' });
    }
    
    discount.isActive = !discount.isActive;
    await discount.save();
    
    res.json({ 
      message: `ההנחה ${discount.isActive ? 'הופעלה' : 'הושבתה'} בהצלחה`,
      isActive: discount.isActive 
    });
  } catch (error) {
    console.error('שגיאה בשינוי סטטוס הנחה:', error);
    res.status(500).json({ message: 'שגיאה בשינוי סטטוס ההנחה' });
  }
});

/**
 * קבלת הנחות ישימות להזמנה
 * POST /api/discounts/applicable
 */
router.post('/applicable', async (req, res) => {
  try {
    const {
      location,
      roomId,
      roomCategory,
      checkIn,
      checkOut,
      nights,
      guests,
      isTourist
    } = req.body;
    
    // ולידציה של פרמטרים נדרשים
    if (!location || !roomId || !checkIn || !checkOut || !nights || !guests) {
      return res.status(400).json({ message: 'חסרים פרמטרים נדרשים' });
    }
    
    const applicableDiscounts = await Discount.findApplicableDiscounts({
      location,
      roomId,
      roomCategory,
      checkIn,
      checkOut,
      nights,
      guests,
      isTourist: isTourist || false
    });
    
    res.json(applicableDiscounts);
  } catch (error) {
    console.error('שגיאה בחיפוש הנחות ישימות:', error);
    res.status(500).json({ message: 'שגיאה בחיפוש הנחות ישימות' });
  }
});







/**
 * סטטיסטיקות הנחות
 * GET /api/discounts/stats/overview
 */
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const { location } = req.query;
    
    // בניית פילטר
    const filter = {};
    if (location && location !== 'both') {
      filter.$or = [
        { location: location },
        { location: 'both' }
      ];
    }
    
    // סטטיסטיקות בסיסיות
    const totalDiscounts = await Discount.countDocuments(filter);
    const activeDiscounts = await Discount.countDocuments({ ...filter, isActive: true });
    
    // סטטיסטיקות שימוש
    const discountsWithUsage = await Discount.find(filter).select('usageHistory');
    
    let totalUsages = 0;
    let totalSavings = 0;
    
    discountsWithUsage.forEach(discount => {
      totalUsages += discount.usageHistory.length;
      discount.usageHistory.forEach(usage => {
        totalSavings += usage.discountAmount || 0;
      });
    });
    
    // הנחות לפי סוג
    const discountsByType = await Discount.aggregate([
      { $match: filter },
      { $group: { _id: '$discountType', count: { $sum: 1 } } }
    ]);
    
    // הנחות לפי תוקף
    const discountsByValidity = await Discount.aggregate([
      { $match: filter },
      { $group: { _id: '$validityType', count: { $sum: 1 } } }
    ]);
    
    res.json({
      totalDiscounts,
      activeDiscounts,
      inactiveDiscounts: totalDiscounts - activeDiscounts,
      totalUsages,
      totalSavings,
      averageSavingsPerUsage: totalUsages > 0 ? Math.round(totalSavings / totalUsages) : 0,
      discountsByType: discountsByType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      discountsByValidity: discountsByValidity.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('שגיאה בקבלת סטטיסטיקות הנחות:', error);
    res.status(500).json({ message: 'שגיאה בקבלת הסטטיסטיקות' });
  }
});

/**
 * דוח שימוש בהנחות
 * GET /api/discounts/stats/usage-report
 */
router.get('/stats/usage-report', auth, async (req, res) => {
  try {
    const { location, startDate, endDate } = req.query;
    
    // בניית פילטר
    const filter = {};
    if (location && location !== 'both') {
      filter.$or = [
        { location: location },
        { location: 'both' }
      ];
    }
    
    const discounts = await Discount.find(filter)
      .populate('usageHistory.bookingId', 'bookingNumber guestName checkIn checkOut')
      .select('name discountType discountValue usageHistory');
    
    // סינון לפי תאריכים אם נדרשו
    let filteredUsages = [];
    
    discounts.forEach(discount => {
      discount.usageHistory.forEach(usage => {
        const usageDate = new Date(usage.usedAt);
        
        let includeUsage = true;
        
        if (startDate) {
          const start = new Date(startDate);
          if (usageDate < start) includeUsage = false;
        }
        
        if (endDate) {
          const end = new Date(endDate);
          if (usageDate > end) includeUsage = false;
        }
        
        if (includeUsage) {
          filteredUsages.push({
            discountName: discount.name,
            discountType: discount.discountType,
            discountValue: discount.discountValue,
            bookingNumber: usage.bookingId?.bookingNumber,
            guestName: usage.bookingId?.guestName,
            checkIn: usage.bookingId?.checkIn,
            checkOut: usage.bookingId?.checkOut,
            discountAmount: usage.discountAmount,
            originalPrice: usage.originalPrice,
            finalPrice: usage.finalPrice,
            usedAt: usage.usedAt
          });
        }
      });
    });
    
    // מיון לפי תאריך שימוש
    filteredUsages.sort((a, b) => new Date(b.usedAt) - new Date(a.usedAt));
    
    res.json({
      usages: filteredUsages,
      totalUsages: filteredUsages.length,
      totalSavings: filteredUsages.reduce((sum, usage) => sum + (usage.discountAmount || 0), 0)
    });
  } catch (error) {
    console.error('שגיאה בקבלת דוח שימוש:', error);
    res.status(500).json({ message: 'שגיאה בקבלת דוח השימוש' });
  }
});

module.exports = router; 