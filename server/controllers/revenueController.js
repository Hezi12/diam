const Booking = require('../models/Booking');
const Room = require('../models/Room');
const { getDaysInMonth, getDate, startOfMonth, endOfMonth, subMonths, format } = require('date-fns');

/**
 * חישוב הכנסות חודשיות לפי אתר, חודש ושנה
 * @param {Object} req - הבקשה מהלקוח
 * @param {Object} res - תשובה ללקוח
 */
exports.getMonthlyRevenue = async (req, res) => {
  try {
    const { site, year, month } = req.params;
    
    console.log(`חישוב הכנסות חודשיות עבור אתר ${site}, חודש ${month}, שנה ${year}`);
    
    // המרת פרמטרים למספרים
    const numericYear = parseInt(year);
    const numericMonth = parseInt(month);
    
    // יצירת מועדי תחילת וסוף החודש
    const startDate = new Date(numericYear, numericMonth - 1, 1);
    const endDate = new Date(numericYear, numericMonth, 1);
    endDate.setMilliseconds(-1);
    
    console.log(`תאריכי חיפוש: מ-${startDate.toISOString()} עד ${endDate.toISOString()}`);
    
    // היום הנוכחי - כדי לחשב את ההכנסות עד עכשיו
    const currentDate = new Date();
    const isCurrentMonth = currentDate.getMonth() === numericMonth - 1 && 
                          currentDate.getFullYear() === numericYear;
    
    // מספר הימים שחלפו בחודש הנוכחי
    const daysPassed = isCurrentMonth 
      ? Math.min(currentDate.getDate(), endDate.getDate()) 
      : endDate.getDate();
      
    // מספר הימים בחודש
    const daysInMonth = endDate.getDate();
    
    // מערך להחזקת תוצאות החישוב
    const response = {
      summary: {},
      dailyRevenue: [],
      trends: { months: [], byDay: [], currentMonthDay: null },
      occupancy: [],
      paymentMethods: [],
      roomRevenue: { byRoom: [], byType: [] }
    };

    // שליפת כל ההזמנות הרלוונטיות לחודש ואתר מסוים
    const bookings = await Booking.find({
      location: site,
      $or: [
        // הזמנות שמתחילות בחודש הנוכחי
        {
          checkIn: { $gte: startDate, $lte: endDate }
        },
        // הזמנות שמסתיימות בחודש הנוכחי
        {
          checkOut: { $gte: startDate, $lte: endDate }
        },
        // הזמנות שמתפרסות על פני החודש
        {
          checkIn: { $lt: startDate },
          checkOut: { $gt: endDate }
        }
      ]
    }).populate('room');

    console.log(`נמצאו ${bookings.length} הזמנות סה"כ`);
    
    // מיון ההזמנות לפי סטטוס תשלום
    const paidBookings = bookings.filter(booking => booking.paymentStatus !== 'unpaid');
    console.log(`מתוכן ${paidBookings.length} הזמנות ששולמו`);
    
    // הדפסת פרטי ההזמנות ששולמו לצורך דיבוג
    paidBookings.forEach(booking => {
      console.log(`הזמנה #${booking.bookingNumber}: checkIn=${booking.checkIn.toISOString()}, checkOut=${booking.checkOut.toISOString()}, paymentStatus=${booking.paymentStatus}, price=${booking.price}`);
    });

    // שליפת כל החדרים באתר
    const allRooms = await Room.find({ location: site });
    console.log(`נמצאו ${allRooms.length} חדרים באתר ${site}`);
    
    // 1. חישוב הכנסות יומיות
    const dailyRevenueMap = {};
    const dailyBookingsMap = {};
    const occupancyMap = {};
    
    // אתחול מערכי הכנסות ותפוסה לכל יום בחודש
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDay = new Date(numericYear, numericMonth - 1, day);
      const dayStr = format(currentDay, 'yyyy-MM-dd');
      
      dailyRevenueMap[day] = 0;
      dailyBookingsMap[day] = 0;
      occupancyMap[day] = {
        occupiedRooms: 0,
        totalRooms: allRooms.length
      };
    }
    
    // חישוב הכנסה יומית והזמנות יומיות
    bookings.forEach(booking => {
      // לא כוללים הזמנות שלא שולמו (שדה paymentStatus הוא 'unpaid')
      if (booking.paymentStatus === 'unpaid') return;
      
      // חישוב ימים שההזמנה פעילה בחודש הזה
      const bookingStart = new Date(Math.max(booking.checkIn, startDate));
      const bookingEnd = new Date(Math.min(booking.checkOut, endDate));
      
      // מספר ימים שהחדר תפוס בחודש זה
      const daysInThisMonth = Math.ceil((bookingEnd - bookingStart) / (1000 * 60 * 60 * 24));
      
      // תעריף יומי
      const dailyRate = booking.price / 
        Math.ceil((booking.checkOut - booking.checkIn) / (1000 * 60 * 60 * 24));
      
      // סך ההכנסה מההזמנה בחודש זה
      const totalBookingRevenue = dailyRate * daysInThisMonth;
      
      console.log(`מחשב הכנסה להזמנה #${booking.bookingNumber}: ימים בחודש=${daysInThisMonth}, תעריף יומי=${dailyRate}, סך הכנסה=${totalBookingRevenue}`);
      
      // במקום להוסיף את התעריף היומי לכל יום נפרד, נוסיף רק את ההכנסה היומית האמיתית
      // חלוקה שווה של ההכנסה על פני ימי ההזמנה בחודש זה
      const revenuePerDay = totalBookingRevenue / daysInThisMonth;
      
      // נשתמש בלולאה שיוצרת מערך של תאריכים בין תאריך ההתחלה וסיום
      // זה מבטיח שהימים יתאימו בדיוק לימים שההזמנה בתוקף
      const dates = [];
      let currentDate = new Date(bookingStart);
      
      while (currentDate < bookingEnd) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // יצירת מבנה נתונים לניהול חדרים על פי מספר חדר כדי למנוע ספירה כפולה
      const roomTracker = {};
      
      // עכשיו נעבור על מערך התאריכים ונוסיף את ההכנסה היומית לכל יום
      dates.forEach(date => {
        const day = date.getDate();
        dailyRevenueMap[day] += revenuePerDay;
        dailyBookingsMap[day]++;
        
        // רק אם יש מספר חדר ואם החדר עוד לא נספר ביום זה
        if (booking.room && booking.room.roomNumber) {
          const roomNumber = booking.room.roomNumber;
          
          // יוצרים מפתח ייחודי עבור שילוב של יום וחדר
          const roomDayKey = `${day}_${roomNumber}`;
          
          // נוודא שלא ספרנו את החדר הזה כבר ביום הזה
          if (!roomTracker[roomDayKey]) {
            roomTracker[roomDayKey] = true;
            occupancyMap[day].occupiedRooms++;
            
            // בדיקת תקינות - לא יותר חדרים תפוסים ממספר החדרים הכולל
            if (occupancyMap[day].occupiedRooms > occupancyMap[day].totalRooms) {
              console.warn(`אזהרה: ביום ${day} יש יותר חדרים תפוסים (${occupancyMap[day].occupiedRooms}) ממספר החדרים הכולל (${occupancyMap[day].totalRooms})`);
              occupancyMap[day].occupiedRooms = occupancyMap[day].totalRooms;
            }
          }
        } else {
          // אם אין מידע על מספר חדר - מעלים רק אם עדיין יש מקום
          if (occupancyMap[day].occupiedRooms < occupancyMap[day].totalRooms) {
            occupancyMap[day].occupiedRooms++;
          }
        }
      });
    });
    
    // הדפסת סיכום הכנסות יומיות
    for (let day = 1; day <= daysInMonth; day++) {
      if (dailyRevenueMap[day] > 0) {
        console.log(`יום ${day}: הכנסה=${dailyRevenueMap[day]}, הזמנות=${dailyBookingsMap[day]}`);
      }
    }
    
    // בניית מערך ההכנסות היומיות
    for (let day = 1; day <= daysInMonth; day++) {
      const fullDate = format(new Date(numericYear, numericMonth - 1, day), 'dd/MM/yyyy');
      
      // הכנסות יומיות
      response.dailyRevenue.push({
        day,
        fullDate,
        revenue: Math.round(dailyRevenueMap[day]),
        bookings: dailyBookingsMap[day]
      });
      
      // נתוני תפוסה
      const occ = occupancyMap[day];
      const occupancyRate = Math.round((occ.occupiedRooms / occ.totalRooms) * 100);
      
      response.occupancy.push({
        day,
        fullDate,
        occupancyRate,
        occupiedRooms: occ.occupiedRooms,
        totalRooms: occ.totalRooms
      });
    }
    
    // 2. חישוב סיכום ההכנסות
    
    // סך ההכנסות בחודש הזה
    const totalRevenue = Object.values(dailyRevenueMap).reduce((sum, rev) => sum + rev, 0);
    console.log(`סך כל ההכנסות לחודש ${month}/${year}: ${totalRevenue}`);
    
    // ממוצע יומי
    const dailyAverage = totalRevenue / daysInMonth;
    
    // תחזית עד סוף החודש (אם בחודש הנוכחי)
    const forecastRevenue = isCurrentMonth
      ? (totalRevenue / daysPassed) * daysInMonth
      : totalRevenue;
    
    // השוואה לחודש קודם
    const prevMonthStartDate = subMonths(startDate, 1);
    const prevMonthEndDate = subMonths(endDate, 1);
    
    const prevMonthBookings = await Booking.find({
      location: site,
      paymentStatus: { $ne: 'unpaid' }, // רק הזמנות ששולמו
      $or: [
        { checkIn: { $gte: prevMonthStartDate, $lte: prevMonthEndDate } },
        { checkOut: { $gte: prevMonthStartDate, $lte: prevMonthEndDate } },
        { 
          checkIn: { $lt: prevMonthStartDate },
          checkOut: { $gt: prevMonthEndDate }
        }
      ]
    });
    
    // חישוב הכנסות חודש קודם
    let prevMonthRevenue = 0;
    let prevMonthDailyAvg = 0;
    
    if (prevMonthBookings.length > 0) {
      const prevDaysInMonth = getDaysInMonth(prevMonthStartDate);
      
      prevMonthBookings.forEach(booking => {
        const bookingStart = new Date(Math.max(booking.checkIn, prevMonthStartDate));
        const bookingEnd = new Date(Math.min(booking.checkOut, prevMonthEndDate));
        
        // הסרת ה-"+1" מתיקון הטעות
        const daysInPrevMonth = Math.ceil((bookingEnd - bookingStart) / (1000 * 60 * 60 * 24));
        const dailyRate = booking.price / 
          Math.ceil((booking.checkOut - booking.checkIn) / (1000 * 60 * 60 * 24));
        
        // סך הכנסה מההזמנה בחודש הקודם
        const totalRevenuePrevMonth = dailyRate * daysInPrevMonth;
        prevMonthRevenue += totalRevenuePrevMonth;
      });
      
      prevMonthDailyAvg = prevMonthRevenue / prevDaysInMonth;
    }
    
    // חישוב אחוזי שינוי
    const revenueChange = prevMonthRevenue > 0 
      ? Math.round(((totalRevenue - prevMonthRevenue) / prevMonthRevenue) * 100)
      : 0;
      
    const forecastChange = prevMonthRevenue > 0
      ? Math.round(((forecastRevenue - prevMonthRevenue) / prevMonthRevenue) * 100)
      : 0;
      
    const dailyAvgChange = prevMonthDailyAvg > 0
      ? Math.round(((dailyAverage - prevMonthDailyAvg) / prevMonthDailyAvg) * 100)
      : 0;
      
    // 3. חישוב נתוני השוואה לחודשים קודמים
    // מביאים נתונים על 6 חודשים אחרונים
    const compareMonths = [];
    for (let i = 0; i < 6; i++) {
      const compareDate = subMonths(startDate, i);
      compareMonths.push({
        year: compareDate.getFullYear(),
        month: compareDate.getMonth() + 1,
        name: format(compareDate, 'MMMM yyyy')
      });
    }
    
    // מערך לשמירת הנתונים השוואתיים
    const monthlyComparisonData = {};
    const daysData = [];
    
    // מאתחלים מערך ימים עם כל הימים בחודש
    for (let day = 1; day <= 31; day++) {
      const dayData = { day };
      compareMonths.forEach(monthInfo => {
        dayData[monthInfo.name] = 0;
      });
      daysData.push(dayData);
    }
    
    // עבור כל חודש, מביאים את נתוני ההכנסות
    for (const monthInfo of compareMonths) {
      const monthStartDate = new Date(monthInfo.year, monthInfo.month - 1, 1);
      const monthEndDate = new Date(monthInfo.year, monthInfo.month, 0);
      const daysInThisMonth = monthEndDate.getDate();
      
      // שליפת הזמנות בחודש זה
      const monthlyBookings = await Booking.find({
        location: site,
        paymentStatus: { $ne: 'unpaid' }, // רק הזמנות ששולמו
        $or: [
          { checkIn: { $gte: monthStartDate, $lte: monthEndDate } },
          { checkOut: { $gte: monthStartDate, $lte: monthEndDate } },
          { 
            checkIn: { $lt: monthStartDate },
            checkOut: { $gt: monthEndDate }
          }
        ]
      });
      
      // חישוב הכנסה יומית
      const monthDailyRevenue = {};
      for (let day = 1; day <= daysInThisMonth; day++) {
        monthDailyRevenue[day] = 0;
      }
      
      monthlyBookings.forEach(booking => {
        const bookingStart = new Date(Math.max(booking.checkIn, monthStartDate));
        const bookingEnd = new Date(Math.min(booking.checkOut, monthEndDate));
        
        const dailyRate = booking.price / 
          Math.ceil((booking.checkOut - booking.checkIn) / (1000 * 60 * 60 * 24));
        
        // סך הכנסה מההזמנה בחודש זה
        const totalRevenueThisMonth = dailyRate * Math.ceil((bookingEnd - bookingStart) / (1000 * 60 * 60 * 24));
        // חלוקה שווה של ההכנסה על פני ימי ההזמנה בחודש זה
        const revenuePerDay = totalRevenueThisMonth / Math.ceil((bookingEnd - bookingStart) / (1000 * 60 * 60 * 24));
        
        // נשתמש בלולאה שיוצרת מערך של תאריכים בין תאריך ההתחלה וסיום
        // זה מבטיח שהימים יתאימו בדיוק לימים שההזמנה בתוקף
        const dates = [];
        let currentDate = new Date(bookingStart);
        
        while (currentDate <= bookingEnd) {
          dates.push(new Date(currentDate));
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // עכשיו נעבור על מערך התאריכים ונוסיף את ההכנסה היומית לכל יום
        dates.forEach(date => {
          const day = date.getDate();
          monthDailyRevenue[day] += revenuePerDay;
        });
      });
      
      // עדכון נתוני היום במערך ההשוואה
      for (let day = 1; day <= daysInThisMonth; day++) {
        if (daysData[day - 1]) {
          daysData[day - 1][monthInfo.name] = Math.round(monthDailyRevenue[day]);
        }
      }
      
      // שמירת סך ההכנסות החודשיות
      monthlyComparisonData[monthInfo.name] = Object.values(monthDailyRevenue).reduce((sum, rev) => sum + rev, 0);
    }
    
    // עדכון נתוני ההשוואה בתשובה
    response.trends.months = compareMonths.map(m => m.name);
    response.trends.byDay = daysData;
    
    // אם זה החודש הנוכחי, שומרים את היום הנוכחי
    if (isCurrentMonth) {
      response.trends.currentMonthDay = currentDate.getDate();
    }
    
    // 4. חישוב פילוח לפי אמצעי תשלום
    const paymentMethods = {};
    
    // שימוש בשדה paymentStatus מההזמנות עצמן במקום חשבוניות
    bookings.forEach(booking => {
      // דילוג על הזמנות שלא שולמו
      if (booking.paymentStatus === 'unpaid') return;
      
      const method = booking.paymentStatus || 'other';
      if (!paymentMethods[method]) {
        paymentMethods[method] = 0;
      }
      
      // חישוב הסכום לפי מספר הימים בחודש הזה
      const bookingStart = new Date(Math.max(booking.checkIn, startDate));
      const bookingEnd = new Date(Math.min(booking.checkOut, endDate));
      
      // הסרת ה-"+1" מתיקון הטעות
      const daysInThisMonth = Math.ceil((bookingEnd - bookingStart) / (1000 * 60 * 60 * 24));
      const dailyRate = booking.price / Math.ceil((booking.checkOut - booking.checkIn) / (1000 * 60 * 60 * 24));
      
      // הוספת הסכום לאמצעי התשלום - כל ההכנסה בבת אחת
      const totalAmount = dailyRate * daysInThisMonth;
      paymentMethods[method] += totalAmount;
      
      console.log(`אמצעי תשלום: ${method}, סכום: ${totalAmount}, הזמנה #${booking.bookingNumber}`);
    });
    
    // סכום כל אמצעי התשלום - זהו הסכום האמיתי של הכנסות החודש
    const totalPaymentMethodsRevenue = Object.values(paymentMethods).reduce((sum, amount) => sum + amount, 0);
    
    // המרה למערך לתצוגה בגרף
    response.paymentMethods = Object.keys(paymentMethods).map(method => {
      return {
        name: method,
        value: Math.round(paymentMethods[method]),
        percent: Math.round((paymentMethods[method] / totalPaymentMethodsRevenue) * 100)
      };
    });
    
    console.log('פילוח לפי אמצעי תשלום:', response.paymentMethods);
    
    // עדכון נתוני סיכום - השתמש בסכום אמצעי התשלום כסכום הכנסות החודש
    response.summary = {
      currentRevenue: Math.round(totalPaymentMethodsRevenue),
      forecast: Math.round(isCurrentMonth ? calculateForecast(response.dailyRevenue, daysPassed, daysInMonth, currentDate) : totalPaymentMethodsRevenue),
      dailyAverage: Math.round(totalPaymentMethodsRevenue / daysInMonth),
      currentRevenueChange: revenueChange,
      forecastChange: forecastChange,
      dailyAverageChange: dailyAvgChange,
      daysPassed: daysPassed
    };
    
    // פונקציה לחישוב תחזית יותר מדויקת
    function calculateForecast(dailyRevenue, daysPassed, daysInMonth, currentDate) {
      // אם רק יום אחד חלף, נחזיר את הסכום היומי * מספר ימי החודש
      if (daysPassed <= 1) {
        const firstDayRevenue = dailyRevenue.find(day => day.day === 1)?.revenue || 0;
        return firstDayRevenue * daysInMonth;
      }
      
      // לוקחים רק את ההכנסות עד אתמול (לא כולל היום הנוכחי)
      const yesterday = currentDate.getDate() - 1;
      const revenueUntilYesterday = dailyRevenue
        .filter(day => day.day <= yesterday)
        .reduce((sum, day) => sum + day.revenue, 0);
      
      // נחלק את ההכנסות עד אתמול במספר הימים שחלפו עד אתמול
      const daysUntilYesterday = yesterday;
      
      // חישוב ממוצע יומי לפי ההכנסות עד אתמול
      const dailyAverageUntilYesterday = revenueUntilYesterday / daysUntilYesterday;
      
      // חישוב התחזית: הכנסות בפועל + (ממוצע יומי * ימים שנותרו)
      // כלומר, מניחים שהממוצע היומי ימשיך גם בימים הבאים
      const daysRemaining = daysInMonth - yesterday;
      
      // החישוב הסופי: הכנסות בפועל עד אתמול + תחזית לימים הנותרים
      return revenueUntilYesterday + (dailyAverageUntilYesterday * daysRemaining);
    }
    
    // 5. חישוב הכנסות לפי חדרים
    const roomRevenue = {};
    const typeRevenue = {};
    
    bookings.forEach(booking => {
      // דילוג על הזמנות שלא שולמו
      if (booking.paymentStatus === 'unpaid') return;
      
      if (!booking.room) return;
      
      const roomNumber = booking.room.roomNumber;
      const roomType = booking.room.type;
      
      // המרת תאריכים
      const bookingStart = new Date(Math.max(booking.checkIn, startDate));
      const bookingEnd = new Date(Math.min(booking.checkOut, endDate));
      
      // הסרת ה-"+1" מתיקון הטעות
      const daysInThisMonth = Math.ceil((bookingEnd - bookingStart) / (1000 * 60 * 60 * 24));
      
      // תעריף יומי
      const dailyRate = booking.price / 
        Math.ceil((booking.checkOut - booking.checkIn) / (1000 * 60 * 60 * 24));
      
      // הכנסה בחודש זה - חישוב כולל
      const totalRevenueInThisMonth = dailyRate * daysInThisMonth;
      
      // הוספה לחדר
      if (!roomRevenue[roomNumber]) {
        roomRevenue[roomNumber] = {
          roomNumber,
          revenue: 0,
          bookings: 0
        };
      }
      roomRevenue[roomNumber].revenue += totalRevenueInThisMonth;
      roomRevenue[roomNumber].bookings++;
      
      // הוספה לסוג חדר
      if (!typeRevenue[roomType]) {
        typeRevenue[roomType] = {
          roomType,
          revenue: 0,
          bookings: 0
        };
      }
      typeRevenue[roomType].revenue += totalRevenueInThisMonth;
      typeRevenue[roomType].bookings++;
    });
    
    response.roomRevenue.byRoom = Object.values(roomRevenue).map(room => ({
      roomNumber: room.roomNumber,
      revenue: Math.round(room.revenue),
      bookings: room.bookings
    }));
    
    response.roomRevenue.byType = Object.values(typeRevenue).map(type => ({
      roomType: type.roomType,
      revenue: Math.round(type.revenue),
      bookings: type.bookings
    }));
    
    console.log('סיום חישוב הכנסות חודשיות');
    res.status(200).json(response);
    
  } catch (error) {
    console.error('שגיאה בהבאת נתוני הכנסות:', error);
    res.status(500).json({ message: 'שגיאת שרת בהבאת נתוני הכנסות', error: error.message });
  }
}; 