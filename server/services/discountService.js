const Discount = require('../models/Discount');

/**
 * שירות מתקדם לחישוב הנחות
 * משתלב עם מערכת המחירים הקיימת
 */
class DiscountService {
  
  /**
   * חישוב מחיר סופי עם הנחות
   * @param {Object} params - פרמטרי החישוב
   * @returns {Object} - מחיר מקורי, הנחות, ומחיר סופי
   */
  static async calculatePriceWithDiscounts(params) {
    const {
      room,
      location,
      checkIn,
      checkOut,
      nights,
      guests,
      isTourist
    } = params;
    
    try {
      // חישוב מחיר מקורי לפי הלוגיקה הקיימת
      const originalPrice = this.calculateOriginalPrice({
        room,
        checkIn,
        checkOut,
        nights,
        guests,
        isTourist
      });
      
      // מציאת הנחות ישימות
      const applicableDiscounts = await Discount.findApplicableDiscounts({
        location,
        roomId: room._id,
        roomCategory: room.category,
        checkIn,
        checkOut,
        nights,
        guests,
        isTourist
      });
      
      if (applicableDiscounts.length === 0) {
        return {
          originalPrice,
          pricePerNight: originalPrice / nights,
          finalPrice: originalPrice,
          totalDiscount: 0,
          appliedDiscounts: [],
          hasDiscount: false
        };
      }
      
      // חישוב הנחות (עם תמיכה בהנחות משולבות)
      const discountResults = this.calculateCombinedDiscounts(
        originalPrice, 
        applicableDiscounts
      );
      
      const finalPrice = originalPrice - discountResults.totalDiscountAmount;
      
      return {
        originalPrice,
        pricePerNight: originalPrice / nights,
        finalPrice,
        finalPricePerNight: finalPrice / nights,
        totalDiscount: discountResults.totalDiscountAmount,
        appliedDiscounts: discountResults.appliedDiscounts,
        hasDiscount: discountResults.totalDiscountAmount > 0,
        savingsPercentage: Math.round((discountResults.totalDiscountAmount / originalPrice) * 100)
      };
      
    } catch (error) {
      console.error('שגיאה בחישוב מחיר עם הנחות:', error);
      // במקרה של שגיאה, נחזיר מחיר רגיל ללא הנחות
      const originalPrice = this.calculateOriginalPrice(params);
      return {
        originalPrice,
        pricePerNight: originalPrice / nights,
        finalPrice: originalPrice,
        totalDiscount: 0,
        appliedDiscounts: [],
        hasDiscount: false,
        error: 'שגיאה בחישוב הנחות'
      };
    }
  }
  
  /**
   * חישוב מחיר מקורי (לפי הלוגיקה הקיימת במערכת)
   * @param {Object} params 
   * @returns {Number} - מחיר מקורי
   */
  static calculateOriginalPrice({ room, checkIn, checkOut, nights, guests, isTourist }) {
    if (!room || !checkIn || !checkOut) return 0;
    
    let totalPrice = 0;
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    // מעבר על כל יום בתקופת השהייה (לפי הלוגיקה הקיימת)
    for (let date = new Date(checkInDate); date < checkOutDate; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      let dailyBasePrice;
      
      if (dayOfWeek === 5) { // יום שישי
        dailyBasePrice = isTourist ? 
          (room.fridayPrice || room.basePrice || 0) : 
          (room.fridayVatPrice || room.vatPrice || 0);
      } else if (dayOfWeek === 6) { // יום שבת
        dailyBasePrice = isTourist ? 
          (room.saturdayPrice || room.basePrice || 0) : 
          (room.saturdayVatPrice || room.vatPrice || 0);
      } else { // שאר הימים
        dailyBasePrice = isTourist ? 
          (room.basePrice || 0) : 
          (room.vatPrice || 0);
      }
      
      // הוספת תוספת לאורחים נוספים
      const baseOccupancy = room.baseOccupancy || 2;
      const extraGuestCharge = room.extraGuestCharge || 0;
      const extraGuests = Math.max(0, guests - baseOccupancy);
      const extraCharge = extraGuests * extraGuestCharge;
      
      totalPrice += dailyBasePrice + extraCharge;
    }
    
    return parseFloat(totalPrice.toFixed(2));
  }
  
  /**
   * חישוב הנחות משולבות
   * @param {Number} originalPrice - מחיר מקורי
   * @param {Array} discounts - רשימת הנחות ישימות
   * @returns {Object} - תוצאות חישוב ההנחות
   */
  static calculateCombinedDiscounts(originalPrice, discounts) {
    // מיון הנחות לפי תאריך יצירה (הישנות קודם)
    const sortedDiscounts = discounts.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    let currentPrice = originalPrice;
    let totalDiscountAmount = 0;
    const appliedDiscounts = [];
    
    for (const discount of sortedDiscounts) {
      // בדיקה אם ההנחה ניתנת לשילוב
      if (appliedDiscounts.length > 0 && !discount.combinable) {
        // אם יש כבר הנחה מיושמת והנחה זו לא ניתנת לשילוב - דילוג
        continue;
      }
      
      // חישוב סכום ההנחה על המחיר הנוכחי
      const discountAmount = discount.calculateDiscountAmount(currentPrice);
      
      if (discountAmount > 0) {
        currentPrice -= discountAmount;
        totalDiscountAmount += discountAmount;
        
        appliedDiscounts.push({
          id: discount._id,
          name: discount.name,
          type: discount.discountType,
          value: discount.discountValue,
          amount: discountAmount,
          description: discount.description
        });
        
        // אם ההנחה לא ניתנת לשילוב, נעצור כאן
        if (!discount.combinable) {
          break;
        }
      }
    }
    
    return {
      totalDiscountAmount: parseFloat(totalDiscountAmount.toFixed(2)),
      appliedDiscounts
    };
  }
  
  /**
   * יצירת תוויות הנחה לתצוגה באתר
   * @param {Array} appliedDiscounts - הנחות שיושמו
   * @returns {Array} - תוויות לתצוגה
   */
  static createDiscountLabels(appliedDiscounts) {
    return appliedDiscounts.map(discount => {
      let label = '';
      let color = 'primary';
      
      if (discount.type === 'percentage') {
        label = `חסכו ${discount.value}%`;
        color = 'success';
      } else if (discount.type === 'fixed_amount') {
        label = `חסכו ₪${discount.amount}`;
        color = 'warning';
      }
      
      return {
        text: label,
        color,
        amount: discount.amount,
        description: discount.description || discount.name
      };
    });
  }
  
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