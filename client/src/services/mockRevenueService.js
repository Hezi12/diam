/**
 * שירות מוק לנתוני הכנסות
 * משמש לפיתוח ובדיקה עד שהשרת מספק API אמיתי
 */

// יצירת נתוני הכנסות יומיות
const generateDailyRevenue = (year, month, site) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const dailyRevenue = [];
  
  const baseAmount = site === 'rothschild' ? 5000 : 3500;
  const randomFactor = 0.5; // 50% שונות
  
  for (let day = 1; day <= daysInMonth; day++) {
    // יותר הכנסות בסופי שבוע
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // יום שישי או שבת
    
    const multiplier = isWeekend ? 1.5 : 1;
    const randomVariance = 1 + (Math.random() * randomFactor * 2 - randomFactor);
    
    const revenue = Math.round(baseAmount * multiplier * randomVariance);
    const bookings = Math.round(revenue / 1000); // בערך הזמנה לכל 1000 ש"ח
    
    dailyRevenue.push({
      day,
      fullDate: `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`,
      revenue,
      bookings
    });
  }
  
  return dailyRevenue;
};

// יצירת נתוני תפוסה
const generateOccupancy = (year, month, site) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const occupancy = [];
  
  const baseOccupancy = site === 'rothschild' ? 75 : 65;
  const totalRooms = site === 'rothschild' ? 12 : 15;
  const randomFactor = 0.3; // 30% שונות
  
  for (let day = 1; day <= daysInMonth; day++) {
    // יותר תפוסה בסופי שבוע
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // יום שישי או שבת
    
    const multiplier = isWeekend ? 1.3 : 1;
    const randomVariance = 1 + (Math.random() * randomFactor * 2 - randomFactor);
    
    let occupancyRate = Math.round(baseOccupancy * multiplier * randomVariance);
    occupancyRate = Math.min(100, Math.max(30, occupancyRate)); // בין 30% ל-100%
    
    const occupiedRooms = Math.round((occupancyRate / 100) * totalRooms);
    
    occupancy.push({
      day,
      fullDate: `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`,
      occupancyRate,
      occupiedRooms,
      totalRooms
    });
  }
  
  return occupancy;
};

// יצירת נתוני אמצעי תשלום
const generatePaymentMethods = (site) => {
  const total = site === 'rothschild' ? 150000 : 100000;
  
  // התפלגות לפי אמצעי תשלום
  return [
    {
      name: 'credit',
      value: Math.round(total * 0.65),
      percent: 65
    },
    {
      name: 'cash',
      value: Math.round(total * 0.15),
      percent: 15
    },
    {
      name: 'bankTransfer',
      value: Math.round(total * 0.10),
      percent: 10
    },
    {
      name: 'bit',
      value: Math.round(total * 0.05),
      percent: 5
    },
    {
      name: 'other',
      value: Math.round(total * 0.05),
      percent: 5
    }
  ];
};

// יצירת נתוני הכנסות לפי חדרים
const generateRoomRevenue = (site) => {
  const result = {
    byRoom: [],
    byType: []
  };
  
  // נתוני חדרים לפי אתר
  const rooms = site === 'rothschild' 
    ? [101, 102, 103, 201, 202, 203, 301, 302, 303, 401, 402, 501]
    : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  
  // סוגי חדרים
  const roomTypes = ['standard', 'deluxe', 'suite', 'family'];
  
  // יצירת הכנסות לפי חדר
  rooms.forEach(roomNumber => {
    const revenue = 5000 + Math.round(Math.random() * 15000);
    const bookings = 2 + Math.round(Math.random() * 8);
    
    result.byRoom.push({
      roomNumber,
      revenue,
      bookings
    });
  });
  
  // יצירת הכנסות לפי סוג חדר
  roomTypes.forEach(roomType => {
    const revenue = 20000 + Math.round(Math.random() * 40000);
    const bookings = 5 + Math.round(Math.random() * 20);
    
    result.byType.push({
      roomType,
      revenue,
      bookings
    });
  });
  
  return result;
};

// יצירת נתוני מגמות והשוואה
const generateTrends = (year, month, site) => {
  const now = new Date();
  const currentDay = now.getMonth() + 1 === parseInt(month) && now.getFullYear() === parseInt(year)
    ? now.getDate()
    : null;
  
  // יצירת שמות חודשים לגרף
  const monthNames = [];
  const byDay = [];
  
  // מאתחל מערך ימים
  for (let day = 1; day <= 31; day++) {
    byDay.push({ day });
  }
  
  // יוצר 6 חודשים אחורה
  for (let i = 0; i < 6; i++) {
    const d = new Date(year, month - 1 - i, 1);
    const monthName = new Intl.DateTimeFormat('he', { month: 'long', year: 'numeric' }).format(d);
    monthNames.push(monthName);
    
    // מוסיף נתונים לכל יום במערך ימים
    const daysInThisMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    
    const baseAmount = (site === 'rothschild' ? 5000 : 3500) * (1 - i * 0.05); // הכנסות פוחתות ככל שהחודש רחוק יותר
    
    for (let day = 1; day <= daysInThisMonth && day <= 31; day++) {
      // יותר הכנסות בסופי שבוע
      const date = new Date(d.getFullYear(), d.getMonth(), day);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
      
      const multiplier = isWeekend ? 1.5 : 1;
      const randomVariance = 1 + (Math.random() * 0.5 * 2 - 0.5);
      
      const revenue = Math.round(baseAmount * multiplier * randomVariance);
      
      if (byDay[day - 1]) {
        byDay[day - 1][monthName] = revenue;
      }
    }
  }
  
  return {
    months: monthNames,
    byDay,
    currentMonthDay: currentDay
  };
};

/**
 * קבלת כל נתוני ההכנסות לחודש מסוים
 * @param {string} site - מזהה האתר (rothschild/airport)
 * @param {number} year - שנה
 * @param {number} month - חודש (1-12)
 * @returns {Object} נתוני הכנסות מלאים
 */
export const getMonthlyRevenueData = async (site, year, month) => {
  // סימולציה של קריאת API
  return new Promise(resolve => {
    setTimeout(() => {
      const dailyRevenue = generateDailyRevenue(year, month, site);
      const occupancy = generateOccupancy(year, month, site);
      const paymentMethods = generatePaymentMethods(site);
      const roomRevenue = generateRoomRevenue(site);
      const trends = generateTrends(year, month, site);
      
      // חישוב סיכום
      const totalRevenue = dailyRevenue.reduce((sum, day) => sum + day.revenue, 0);
      const daysInMonth = new Date(year, month, 0).getDate();
      const today = new Date();
      const isCurrentMonth = today.getMonth() + 1 === parseInt(month) && today.getFullYear() === parseInt(year);
      const daysPassed = isCurrentMonth ? Math.min(today.getDate(), daysInMonth) : daysInMonth;
      
      const forecast = isCurrentMonth 
        ? Math.round((totalRevenue / daysPassed) * daysInMonth)
        : totalRevenue;
        
      const summary = {
        currentRevenue: totalRevenue,
        forecast,
        dailyAverage: Math.round(totalRevenue / daysInMonth),
        currentRevenueChange: 12, // סתם מספר לדוגמה
        forecastChange: 8, // סתם מספר לדוגמה
        dailyAverageChange: 5, // סתם מספר לדוגמה
        daysPassed
      };
      
      resolve({
        summary,
        dailyRevenue,
        occupancy,
        paymentMethods,
        roomRevenue,
        trends
      });
    }, 500); // סימולציה של עיכוב ברשת
  });
}; 