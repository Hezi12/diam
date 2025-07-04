const Discount = require('../models/Discount');

/**
 * שירות מתקדם לחישוב הנחות
 * משתלב עם מערכת המחירים הקיימת
 */
class DiscountService {
  

  

  

  

  
  /**
   * רישום שימוש בהנחה
   * @param {String} discountId - מזהה ההנחה
   * @param {String} bookingId - מזהה ההזמנה
   * @param {Number} originalPrice - מחיר מקורי
   * @param {Number} discountAmount - סכום ההנחה
   * @param {Number} finalPrice - מחיר סופי
   */
  static async recordDiscountUsage(discountId, bookingId, originalPrice, discountAmount, finalPrice) {
    try {
      const discount = await Discount.findById(discountId);
      if (discount) {
        await discount.recordUsage(bookingId, originalPrice, discountAmount, finalPrice);
      }
    } catch (error) {
      console.error('שגיאה ברישום שימוש בהנחה:', error);
      // לא נזרוק שגיאה כדי שלא נפגע בתהליך ההזמנה
    }
  }
  
  /**
   * קבלת הנחות "רגע אחרון" פעילות
   * @param {String} location - מיקום
   * @returns {Array} - רשימת הנחות רגע אחרון
   */
  static async getLastMinuteDiscounts(location) {
    try {
      return await Discount.find({
        isActive: true,
        validityType: 'last_minute',
        $or: [
          { location: location },
          { location: 'both' }
        ]
      }).select('name description discountType discountValue lastMinuteSettings');
    } catch (error) {
      console.error('שגיאה בקבלת הנחות רגע אחרון:', error);
      return [];
    }
  }
  
  /**
   * בדיקה האם יש הנחות פעילות למיקום
   * @param {String} location - מיקום
   * @returns {Boolean} - האם יש הנחות פעילות
   */
  static async hasActiveDiscounts(location) {
    try {
      const count = await Discount.countDocuments({
        isActive: true,
        $or: [
          { location: location },
          { location: 'both' }
        ]
      });
      
      return count > 0;
    } catch (error) {
      console.error('שגיאה בבדיקת הנחות פעילות:', error);
      return false;
    }
  }
}

module.exports = DiscountService; 