import axios from 'axios';

/**
 * שירות מתקדם לניהול הנחות
 */
class DiscountService {
  
  /**
   * קבלת כל ההנחות
   */
  static async getAllDiscounts(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
      
      const response = await axios.get(`/api/discounts?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('שגיאה בקבלת הנחות:', error);
      throw new Error(error.response?.data?.message || 'שגיאה בקבלת הנחות');
    }
  }

  /**
   * קבלת הנחה לפי ID
   */
  static async getDiscountById(discountId) {
    try {
      const response = await axios.get(`/api/discounts/${discountId}`);
      return response.data;
    } catch (error) {
      console.error('שגיאה בקבלת הנחה:', error);
      throw new Error(error.response?.data?.message || 'שגיאה בקבלת ההנחה');
    }
  }

  /**
   * יצירת הנחה חדשה
   */
  static async createDiscount(discountData) {
    try {
      const response = await axios.post('/api/discounts', discountData);
      return response.data;
    } catch (error) {
      console.error('שגיאה ביצירת הנחה:', error);
      throw new Error(error.response?.data?.message || 'שגיאה ביצירת ההנחה');
    }
  }

  /**
   * עדכון הנחה
   */
  static async updateDiscount(discountId, discountData) {
    try {
      const response = await axios.patch(`/api/discounts/${discountId}`, discountData);
      return response.data;
    } catch (error) {
      console.error('שגיאה בעדכון הנחה:', error);
      throw new Error(error.response?.data?.message || 'שגיאה בעדכון ההנחה');
    }
  }

  /**
   * מחיקת הנחה
   */
  static async deleteDiscount(discountId) {
    try {
      const response = await axios.delete(`/api/discounts/${discountId}`);
      return response.data;
    } catch (error) {
      console.error('שגיאה במחיקת הנחה:', error);
      throw new Error(error.response?.data?.message || 'שגיאה במחיקת ההנחה');
    }
  }

  /**
   * שינוי סטטוס הנחה
   */
  static async toggleDiscountStatus(discountId) {
    try {
      const response = await axios.patch(`/api/discounts/${discountId}/toggle-status`);
      return response.data;
    } catch (error) {
      console.error('שגיאה בשינוי סטטוס הנחה:', error);
      throw new Error(error.response?.data?.message || 'שגיאה בשינוי סטטוס ההנחה');
    }
  }

  /**
   * קבלת הנחות ישימות להזמנה
   */
  static async getApplicableDiscounts(bookingParams) {
    try {
      console.log('🔍 DiscountService.getApplicableDiscounts: מתחיל חיפוש הנחות עם פרמטרים:', bookingParams);
      
      const response = await axios.post('/api/discounts/applicable', bookingParams);
      
      console.log('✅ DiscountService.getApplicableDiscounts: תגובה מהשרת:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ DiscountService.getApplicableDiscounts: שגיאה בקבלת הנחות:', error);
      console.error('❌ פרטי השגיאה:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'שגיאה בחיפוש הנחות ישימות');
    }
  }

  /**
   * חישוב מחיר עם הנחות
   */
  static async calculatePriceWithDiscounts(priceParams) {
    try {
      console.log('🎯 DiscountService.calculatePriceWithDiscounts: מתחיל חישוב מחיר עם פרמטרים:', priceParams);
      
      const response = await axios.post('/api/discounts/calculate-price', priceParams);
      
      console.log('✅ DiscountService.calculatePriceWithDiscounts: תוצאת חישוב מהשרת:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ DiscountService.calculatePriceWithDiscounts: שגיאה בחישוב מחיר עם הנחות:', error);
      console.error('❌ פרטי השגיאה:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'שגיאה בחישוב המחיר');
    }
  }

  /**
   * רישום שימוש בהנחה
   */
  static async recordDiscountUsage(discountId, usageData) {
    try {
      const response = await axios.post(`/api/discounts/${discountId}/record-usage`, usageData);
      return response.data;
    } catch (error) {
      console.error('שגיאה ברישום שימוש בהנחה:', error);
      throw new Error(error.response?.data?.message || 'שגיאה ברישום השימוש');
    }
  }

  /**
   * ביטול שימוש בהנחה
   */
  static async cancelDiscountUsage(discountId, bookingId) {
    try {
      const response = await axios.post(`/api/discounts/${discountId}/cancel-usage`, { bookingId });
      return response.data;
    } catch (error) {
      console.error('שגיאה בביטול שימוש בהנחה:', error);
      throw new Error(error.response?.data?.message || 'שגיאה בביטול השימוש');
    }
  }

  /**
   * קבלת סטטיסטיקות הנחות
   */
  static async getDiscountStats(location = 'both') {
    try {
      const params = new URLSearchParams();
      if (location !== 'both') params.append('location', location);
      
      const response = await axios.get(`/api/discounts/stats/overview?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('שגיאה בקבלת סטטיסטיקות הנחות:', error);
      throw new Error(error.response?.data?.message || 'שגיאה בקבלת הסטטיסטיקות');
    }
  }

  /**
   * קבלת דוח שימוש בהנחות
   */
  static async getUsageReport(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
      
      const response = await axios.get(`/api/discounts/stats/usage-report?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('שגיאה בקבלת דוח שימוש:', error);
      throw new Error(error.response?.data?.message || 'שגיאה בקבלת דוח השימוש');
    }
  }

  /**
   * אימות נתוני הנחה
   */
  static validateDiscountData(discountData) {
    const errors = {};

    // בדיקת שם ההנחה
    if (!discountData.name || !discountData.name.trim()) {
      errors.name = 'שם ההנחה נדרש';
    }

    // בדיקת ערך ההנחה
    if (!discountData.discountValue || discountData.discountValue <= 0) {
      errors.discountValue = 'ערך ההנחה חייב להיות חיובי';
    }

    if (discountData.discountType === 'percentage' && discountData.discountValue > 100) {
      errors.discountValue = 'הנחה באחוזים לא יכולה לעלות על 100%';
    }

    // בדיקת תאריכים לטווח תאריכים
    if (discountData.validityType === 'date_range') {
      if (!discountData.validFrom) {
        errors.validFrom = 'תאריך התחלה נדרש';
      }
      if (!discountData.validUntil) {
        errors.validUntil = 'תאריך סיום נדרש';
      }
      if (discountData.validFrom && discountData.validUntil && 
          new Date(discountData.validFrom) >= new Date(discountData.validUntil)) {
        errors.validUntil = 'תאריך הסיום חייב להיות אחרי תאריך ההתחלה';
      }
    }

    // בדיקת הגבלות
    if (discountData.restrictions) {
      const restrictions = discountData.restrictions;
      
      if (restrictions.maxNights && restrictions.minNights > restrictions.maxNights) {
        errors.maxNights = 'מספר לילות מקסימלי חייב להיות גדול מהמינימום';
      }

      if (restrictions.maxGuests && restrictions.minGuests > restrictions.maxGuests) {
        errors.maxGuests = 'מספר אורחים מקסימלי חייב להיות גדול מהמינימום';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * פורמט נתוני הנחה לתצוגה
   */
  static formatDiscountForDisplay(discount) {
    const typeLabels = {
      percentage: 'אחוזים',
      fixed_amount: 'סכום קבוע'
    };

    const validityLabels = {
      unlimited: 'ללא הגבלת זמן',
      date_range: 'טווח תאריכים',
      last_minute: 'רגע אחרון'
    };

    const locationLabels = {
      airport: 'שדה התעופה',
      rothschild: 'רוטשילד',
      both: 'שני המיקומים'
    };

    return {
      ...discount,
      typeLabel: typeLabels[discount.discountType] || discount.discountType,
      validityLabel: validityLabels[discount.validityType] || discount.validityType,
      locationLabel: locationLabels[discount.location] || discount.location,
      valueText: discount.discountType === 'percentage' ? 
        `${discount.discountValue}%` : 
        `₪${discount.discountValue}`
    };
  }

  /**
   * בדיקה אם הנחה תקפה כעת
   */
  static isDiscountCurrentlyValid(discount) {
    if (!discount.isActive) return false;

    const now = new Date();

    switch (discount.validityType) {
      case 'unlimited':
        return true;

      case 'date_range':
        const validFrom = new Date(discount.validFrom);
        const validUntil = new Date(discount.validUntil);
        return now >= validFrom && now <= validUntil;

      case 'last_minute':
        // תמיד תקף עבור רגע אחרון - הבדיקה תתבצע ברמת ההזמנה
        return true;

      default:
        return false;
    }
  }

  /**
   * חישוב מחיר רגיל (ללא הנחות) - שיטת עזר
   */
  static calculateBasePrice(params) {
    const {
      room,
      checkIn,
      checkOut,
      nights,
      guests,
      isTourist
    } = params;

    console.log('💰 DiscountService.calculateBasePrice: מתחיל חישוב מחיר בסיסי:', {
      roomId: room?._id,
      roomCategory: room?.category,
      checkIn,
      checkOut,
      nights,
      guests,
      isTourist
    });

    if (!room || !nights) {
      console.log('🚫 DiscountService.calculateBasePrice: חסרים פרמטרים - מחזיר 0');
      return 0;
    }

    let totalPrice = 0;
    const checkInDate = new Date(checkIn);

    console.log('🏨 DiscountService.calculateBasePrice: מחירי החדר:', {
      basePrice: room.basePrice,
      vatPrice: room.vatPrice,
      fridayPrice: room.fridayPrice,
      fridayVatPrice: room.fridayVatPrice,
      saturdayPrice: room.saturdayPrice,
      saturdayVatPrice: room.saturdayVatPrice,
      extraGuestCharge: room.extraGuestCharge,
      baseOccupancy: room.baseOccupancy
    });

    // חישוב מחיר לכל לילה
    for (let i = 0; i < nights; i++) {
      const currentDate = new Date(checkInDate);
      currentDate.setDate(currentDate.getDate() + i);
      
      const dayOfWeek = currentDate.getDay();
      let dayPrice = 0;

      if (dayOfWeek === 5) { // שישי
        dayPrice = isTourist ? 
          (room.fridayPrice || room.basePrice || 0) : 
          (room.fridayVatPrice || room.vatPrice || 0);
      } else if (dayOfWeek === 6) { // שבת
        dayPrice = isTourist ? 
          (room.saturdayPrice || room.basePrice || 0) : 
          (room.saturdayVatPrice || room.vatPrice || 0);
      } else { // ימים רגילים
        dayPrice = isTourist ? 
          (room.basePrice || 0) : 
          (room.vatPrice || 0);
      }

      console.log(`📅 יום ${i + 1} (${currentDate.toDateString()}): יום ${dayOfWeek}, מחיר: ${dayPrice}₪`);
      totalPrice += dayPrice;
    }

    // הוספת תשלום לאורחים נוספים
    const baseOccupancy = room.baseOccupancy || 2;
    const extraGuestCharge = room.extraGuestCharge || 0;
    const extraGuests = Math.max(0, guests - baseOccupancy);
    
    if (extraGuests > 0) {
      const extraCharge = extraGuests * extraGuestCharge * nights;
      console.log(`👥 תוספת ${extraGuests} אורחים נוספים: ${extraCharge}₪ (${extraGuestCharge}₪ × ${extraGuests} × ${nights} לילות)`);
      totalPrice += extraCharge;
    }

    const finalPrice = Math.round(totalPrice);
    console.log(`✅ DiscountService.calculateBasePrice: מחיר סופי מחושב: ${finalPrice}₪`);

    return finalPrice;
  }

  /**
   * חישוב חיסכון באחוזים
   */
  static calculateSavingsPercentage(originalPrice, finalPrice) {
    if (originalPrice <= 0) return 0;
    return Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
  }

  /**
   * קבלת הנחות מומלצות לחדר
   */
  static async getRecommendedDiscounts(roomParams) {
    try {
      const applicableDiscounts = await this.getApplicableDiscounts(roomParams);
      
      // מיון לפי עדיפות וערך החיסכון
      return applicableDiscounts
        .filter(discount => discount.isActive)
        .sort((a, b) => {
          // קודם לפי עדיפות
          if (a.priority !== b.priority) {
            return b.priority - a.priority;
          }
          
          // אחר כך לפי ערך ההנחה
          const aValue = a.discountType === 'percentage' ? a.discountValue : 0;
          const bValue = b.discountType === 'percentage' ? b.discountValue : 0;
          return bValue - aValue;
        })
        .slice(0, 3); // רק 3 הנחות מומלצות
        
    } catch (error) {
      console.error('שגיאה בקבלת הנחות מומלצות:', error);
      return [];
    }
  }

  /**
   * יצוא נתוני הנחות לקובץ
   */
  static exportDiscountsData(discounts, format = 'json') {
    if (format === 'csv') {
      // יצוא CSV
      const headers = [
        'שם',
        'סוג',
        'ערך',
        'מיקום',
        'תוקף',
        'פעיל',
        'שימושים',
        'תאריך יצירה'
      ];

      const rows = discounts.map(discount => [
        discount.name,
        discount.discountType === 'percentage' ? 'אחוזים' : 'סכום קבוע',
        discount.discountValue,
        discount.location === 'both' ? 'שניהם' : 
          discount.location === 'airport' ? 'שדה התעופה' : 'רוטשילד',
        discount.validityType,
        discount.isActive ? 'כן' : 'לא',
        discount.usageLimit?.currentUses || 0,
        new Date(discount.createdAt).toLocaleDateString('he-IL')
      ]);

      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      // הורדת הקובץ
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `discounts_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } else {
      // יצוא JSON
      const dataStr = JSON.stringify(discounts, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `discounts_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
    }
  }
}

export default DiscountService; 