const Booking = require('../models/Booking');
const Room = require('../models/Room');
const { getDaysInMonth, getDate, startOfMonth, endOfMonth, subMonths, format, differenceInDays, isWithinInterval, parseISO } = require('date-fns');

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
    const startDate = new Date(Date.UTC(numericYear, numericMonth - 1, 1));
    const endDate = new Date(Date.UTC(numericYear, numericMonth, 0)); // היום האחרון בחודש (שים לב לשינוי)
    
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
      roomRevenue: { byRoom: [], byType: [] },
      bookings: []
    };

    // שליפת כל ההזמנות שיש להן לילות בחודש הזה
    // אנחנו מבצעים שינוי משמעותי כאן בתנאי החיפוש
    const bookings = await Booking.find({
      location: site,
      // שינוי התנאי כדי להבטיח שרק הזמנות עם לילות בחודש זה ייכללו
      $and: [
        { checkIn: { $lt: new Date(Date.UTC(numericYear, numericMonth, 1)) } }, // צ'ק-אין לפני תחילת החודש הבא
        { checkOut: { $gt: startDate } } // צ'ק-אאוט אחרי תחילת החודש הנוכחי
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
    const activeRooms = allRooms.filter(room => room.status !== false);
    console.log(`נמצאו ${allRooms.length} חדרים באתר ${site}, מתוכם ${activeRooms.length} פעילים`);
    
    // 1. חישוב הכנסות יומיות
    const dailyRevenueMap = {};
    const dailyBookingsMap = {};
    const occupancyMap = {};
    const occupiedRoomDetailsByDay = {}; // מבנה נתונים חדש לשמירת פרטי החדרים התפוסים לכל יום
    
    // אתחול מערכי הכנסות ותפוסה לכל יום בחודש
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDay = new Date(Date.UTC(numericYear, numericMonth - 1, day));
      const dayStr = format(currentDay, 'yyyy-MM-dd');
      
      dailyRevenueMap[day] = 0;
      dailyBookingsMap[day] = 0;
      occupancyMap[day] = {
        occupiedRooms: 0,
        totalRooms: activeRooms.length || 1 // מוודא שלא נחלק באפס אם אין חדרים פעילים
      };
      occupiedRoomDetailsByDay[day] = new Set(); // שימוש ב-Set למניעת כפילויות באופן אוטומטי
    }
    
    // חישוב הכנסה יומית והזמנות יומיות - שיפור מנגנון החישוב
    paidBookings.forEach(booking => {
      try {
        // המרת תאריכים לאובייקטי Date אחידים
        const checkInDate = new Date(booking.checkIn);
        const checkOutDate = new Date(booking.checkOut);
        
        // חישוב סך הלילות הכולל של ההזמנה
        const totalNights = differenceInDays(checkOutDate, checkInDate);
        console.log(`הזמנה #${booking.bookingNumber}: סך לילות כולל=${totalNights}`);
        
        if (totalNights <= 0) {
          console.warn(`אזהרה: הזמנה #${booking.bookingNumber} עם מספר לילות לא תקין (${totalNights}), דילוג...`);
          return; // דילוג על הזמנה לא תקינה
        }
        
        // חישוב תעריף לכל לילה
        const ratePerNight = booking.price / totalNights;
        
        // חישוב ימי הלינה בחודש הנוכחי בלבד
        let nightsInMonth = 0;
        let nightsInThisMonth = [];
        
        // בדיקה עבור כל יום בחודש הנוכחי האם יש בו לינה מהזמנה זו
        for (let day = 1; day <= daysInMonth; day++) {
          const currentNightDate = new Date(Date.UTC(numericYear, numericMonth - 1, day));
          const nextDay = new Date(Date.UTC(numericYear, numericMonth - 1, day + 1));
          
          // בדיקה אם היום הזה הוא יום לינה בהזמנה
          // לילה נחשב אם הצ'ק-אין היה לפני או באותו יום וצ'ק-אאוט לאחר היום
          if (checkInDate <= currentNightDate && checkOutDate > currentNightDate) {
            nightsInMonth++;
            nightsInThisMonth.push(day);
            
            // הוספת הזמנה לחדר ביום זה
            if (booking.room && booking.room._id) {
              occupiedRoomDetailsByDay[day].add(booking.room._id.toString());
            }
            
            // הוספת ספירת הזמנות ליום זה
            dailyBookingsMap[day]++;
          }
        }
        
        console.log(`הזמנה #${booking.bookingNumber}: לילות בחודש ${month}/${year}=${nightsInMonth}, ימים=${nightsInThisMonth.join(',')}`);
        
        // חישוב ההכנסה היחסית לחודש זה
        const revenueInThisMonth = ratePerNight * nightsInMonth;
        console.log(`הזמנה #${booking.bookingNumber}: הכנסה בחודש=${revenueInThisMonth}, תעריף לילה=${ratePerNight}`);
        
        // חלוקת ההכנסה שווה בשווה על פני ימי הלינה בחודש
        if (nightsInMonth > 0) {
          const revenuePerNightInMonth = revenueInThisMonth / nightsInMonth;
          
          // הוספת ההכנסה לכל יום לינה בחודש זה
          nightsInThisMonth.forEach(day => {
            dailyRevenueMap[day] += revenuePerNightInMonth;
          });
        }
      } catch (error) {
        console.error(`שגיאה בחישוב הכנסה להזמנה #${booking.bookingNumber || booking._id}:`, error);
      }
    });
    
    // עכשיו נעדכן את מספר החדרים התפוסים לכל יום על פי הנתונים שאספנו
    for (let day = 1; day <= daysInMonth; day++) {
      if (occupiedRoomDetailsByDay[day]) {
        const uniqueOccupiedRooms = occupiedRoomDetailsByDay[day].size;
        occupancyMap[day].occupiedRooms = uniqueOccupiedRooms;
        
        // וידוא שאין יותר חדרים תפוסים ממספר החדרים הפעילים הכולל
        if (occupancyMap[day].occupiedRooms > occupancyMap[day].totalRooms) {
          console.warn(`אזהרה: ביום ${day} יש יותר חדרים תפוסים (${occupancyMap[day].occupiedRooms}) ממספר החדרים הפעילים (${occupancyMap[day].totalRooms})`);
          console.log(`חדרים תפוסים ביום ${day}:`, Array.from(occupiedRoomDetailsByDay[day]));
          occupancyMap[day].occupiedRooms = occupancyMap[day].totalRooms;
        }
      }
    }
    
    // הדפסת סיכום תפוסה יומית
    for (let day = 1; day <= daysInMonth; day++) {
      if (occupancyMap[day].occupiedRooms > 0) {
        const occupancyRate = Math.round((occupancyMap[day].occupiedRooms / occupancyMap[day].totalRooms) * 100);
        console.log(`יום ${day}: תפוסה=${occupancyRate}%, חדרים תפוסים=${occupancyMap[day].occupiedRooms}/${occupancyMap[day].totalRooms}`);
      }
    }
    
    // הדפסת סיכום הכנסות יומיות
    for (let day = 1; day <= daysInMonth; day++) {
      if (dailyRevenueMap[day] > 0) {
        console.log(`יום ${day}: הכנסה=${dailyRevenueMap[day]}, הזמנות=${dailyBookingsMap[day]}`);
      }
    }
    
    // בניית מערך ההכנסות היומיות
    for (let day = 1; day <= daysInMonth; day++) {
      const fullDate = format(new Date(Date.UTC(numericYear, numericMonth - 1, day)), 'dd/MM/yyyy');
      
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
    
    // השוואה לחודש קודם - עדכון החיפוש לשיטה החדשה
    const prevMonthStartDate = new Date(Date.UTC(numericYear, numericMonth - 2, 1)); // חודש קודם
    const prevMonthEndDate = new Date(Date.UTC(numericYear, numericMonth - 1, 0)); // היום האחרון של החודש הקודם
    
    const prevMonthBookings = await Booking.find({
      location: site,
      paymentStatus: { $ne: 'unpaid' }, // רק הזמנות ששולמו
      $and: [
        { checkIn: { $lt: new Date(Date.UTC(numericYear, numericMonth - 1, 1)) } }, // צ'ק-אין לפני תחילת החודש הנוכחי
        { checkOut: { $gt: prevMonthStartDate } } // צ'ק-אאוט אחרי תחילת החודש הקודם
      ]
    });
    
    // חישוב הכנסות חודש קודם
    let prevMonthRevenue = 0;
    let prevMonthDailyAvg = 0;
    
    if (prevMonthBookings.length > 0) {
      const prevDaysInMonth = getDaysInMonth(prevMonthStartDate);
      
      // מערך ימים בחודש הקודם
      const prevMonthDaysRevenueMap = {};
      for (let day = 1; day <= prevDaysInMonth; day++) {
        prevMonthDaysRevenueMap[day] = 0;
      }
      
      // חישוב הכנסות בשיטה החדשה, לפי לילות בפועל בחודש הקודם
      prevMonthBookings.forEach(booking => {
        try {
          const checkInDate = new Date(booking.checkIn);
          const checkOutDate = new Date(booking.checkOut);
          
          // חישוב סך הלילות הכולל של ההזמנה
          const totalNights = differenceInDays(checkOutDate, checkInDate);
          
          if (totalNights <= 0) {
            console.warn(`אזהרה: הזמנה #${booking.bookingNumber} עם מספר לילות לא תקין (${totalNights}), דילוג...`);
            return;
          }
          
          // חישוב תעריף לכל לילה
          const ratePerNight = booking.price / totalNights;
          
          // ספירת הלילות בחודש הקודם
          let nightsInPrevMonth = 0;
          let nightsInPrevMonthDays = [];
          
          // בדיקה עבור כל יום בחודש הקודם
          for (let day = 1; day <= prevDaysInMonth; day++) {
            const currentNightDate = new Date(Date.UTC(prevMonthStartDate.getUTCFullYear(), prevMonthStartDate.getUTCMonth(), day));
            
            // בדיקה אם היום הזה הוא יום לינה בהזמנה
            if (checkInDate <= currentNightDate && checkOutDate > currentNightDate) {
              nightsInPrevMonth++;
              nightsInPrevMonthDays.push(day);
              
              // הוספת הכנסה יומית
              prevMonthDaysRevenueMap[day] += ratePerNight;
            }
          }
          
          // הכנסה כוללת מהזמנה זו בחודש הקודם
          const revenuePrevMonth = ratePerNight * nightsInPrevMonth;
          console.log(`הזמנה #${booking.bookingNumber || booking._id}: הכנסה בחודש קודם=${revenuePrevMonth}, לילות=${nightsInPrevMonth}`);
          
        } catch (error) {
          console.error(`שגיאה בחישוב הכנסה להזמנה בחודש קודם #${booking.bookingNumber || booking._id}:`, error);
        }
      });
      
      // סיכום ההכנסות
      prevMonthRevenue = Object.values(prevMonthDaysRevenueMap).reduce((sum, rev) => sum + rev, 0);
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
    
    // עבור כל חודש, מביאים את נתוני ההכנסות בשיטה החדשה
    for (const monthInfo of compareMonths) {
      const monthStartDate = new Date(Date.UTC(monthInfo.year, monthInfo.month - 1, 1));
      const monthEndDate = new Date(Date.UTC(monthInfo.year, monthInfo.month, 0)); // היום האחרון בחודש
      const daysInThisMonth = monthEndDate.getDate();
      
      // שליפת הזמנות בחודש זה - בשיטה החדשה
      const monthlyBookings = await Booking.find({
        location: site,
        paymentStatus: { $ne: 'unpaid' }, // רק הזמנות ששולמו
        $and: [
          { checkIn: { $lt: new Date(Date.UTC(monthInfo.year, monthInfo.month, 1)) } }, // צ'ק-אין לפני תחילת החודש הבא
          { checkOut: { $gt: monthStartDate } } // צ'ק-אאוט אחרי תחילת החודש
        ]
      });
      
      // חישוב הכנסה יומית בשיטה החדשה
      const monthDailyRevenue = {};
      for (let day = 1; day <= daysInThisMonth; day++) {
        monthDailyRevenue[day] = 0;
      }
      
      monthlyBookings.forEach(booking => {
        try {
          const checkInDate = new Date(booking.checkIn);
          const checkOutDate = new Date(booking.checkOut);
          
          // חישוב סך הלילות הכולל של ההזמנה
          const totalNights = differenceInDays(checkOutDate, checkInDate);
          
          if (totalNights <= 0) return; // דילוג על הזמנות לא תקינות
          
          // חישוב תעריף לכל לילה
          const ratePerNight = booking.price / totalNights;
          
          // בדיקה עבור כל יום בחודש
          for (let day = 1; day <= daysInThisMonth; day++) {
            const currentNightDate = new Date(Date.UTC(monthInfo.year, monthInfo.month - 1, day));
            
            // בדיקה אם היום הזה הוא יום לינה בהזמנה
            if (checkInDate <= currentNightDate && checkOutDate > currentNightDate) {
              // הוספת הכנסה יומית
              monthDailyRevenue[day] += ratePerNight;
            }
          }
        } catch (error) {
          console.error(`שגיאה בחישוב הכנסה להזמנה להשוואה #${booking.bookingNumber || booking._id}:`, error);
        }
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
    
    // 4. חישוב פילוח לפי אמצעי תשלום - בשיטה החדשה
    const paymentMethods = {};
    
    // עבור כל אמצעי תשלום, נחשב את ההכנסות לפי לילות בפועל
    paidBookings.forEach(booking => {
      try {
        const checkInDate = new Date(booking.checkIn);
        const checkOutDate = new Date(booking.checkOut);
        const method = booking.paymentStatus || 'other';
        
        // אתחול המונה אם לא קיים
        if (!paymentMethods[method]) {
          paymentMethods[method] = 0;
        }
        
        // חישוב סך הלילות הכולל של ההזמנה
        const totalNights = differenceInDays(checkOutDate, checkInDate);
        
        if (totalNights <= 0) return; // דילוג על הזמנות לא תקינות
        
        // חישוב תעריף לכל לילה
        const ratePerNight = booking.price / totalNights;
        
        // ספירת הלילות בחודש הנוכחי
        let nightsInMonth = 0;
        
        // בדיקה עבור כל יום בחודש
        for (let day = 1; day <= daysInMonth; day++) {
          const currentNightDate = new Date(Date.UTC(numericYear, numericMonth - 1, day));
          
          // בדיקה אם היום הזה הוא יום לינה בהזמנה
          if (checkInDate <= currentNightDate && checkOutDate > currentNightDate) {
            nightsInMonth++;
          }
        }
        
        // הכנסה כוללת מהזמנה זו בחודש זה
        const revenueInThisMonth = ratePerNight * nightsInMonth;
        
        // הוספת הסכום לאמצעי התשלום
        paymentMethods[method] += revenueInThisMonth;
        
      } catch (error) {
        console.error(`שגיאה בחישוב הכנסה לאמצעי תשלום #${booking.bookingNumber || booking._id}:`, error);
      }
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
    
    // 5. חישוב הכנסות לפי חדרים - בשיטה החדשה
    const roomRevenue = {};
    const typeRevenue = {};
    
    paidBookings.forEach(booking => {
      try {
        if (!booking.room) return;
        
        const roomNumber = booking.room.roomNumber;
        const roomType = booking.room.category || 'אחר';
        
        // המרת תאריכים לאובייקטי Date אחידים
        const checkInDate = new Date(booking.checkIn);
        const checkOutDate = new Date(booking.checkOut);
        
        // חישוב סך הלילות הכולל של ההזמנה
        const totalNights = differenceInDays(checkOutDate, checkInDate);
        
        if (totalNights <= 0) {
          console.warn(`אזהרה: הזמנה #${booking.bookingNumber} עם מספר לילות לא תקין (${totalNights}), דילוג...`);
          return;
        }
        
        // חישוב תעריף לכל לילה
        const ratePerNight = booking.price / totalNights;
        
        // חישוב ימי הלינה בחודש הנוכחי בלבד
        let nightsInMonth = 0;
        
        // בדיקה עבור כל יום בחודש הנוכחי האם יש בו לינה מהזמנה זו
        for (let day = 1; day <= daysInMonth; day++) {
          const currentNightDate = new Date(Date.UTC(numericYear, numericMonth - 1, day));
          
          // בדיקה אם היום הזה הוא יום לינה בהזמנה
          if (checkInDate <= currentNightDate && checkOutDate > currentNightDate) {
            nightsInMonth++;
          }
        }
        
        // חישוב ההכנסה היחסית לחודש זה
        const revenueInThisMonth = ratePerNight * nightsInMonth;
        
        // אתחול מבנה נתונים אם לא קיים
        if (!roomRevenue[roomNumber]) {
          roomRevenue[roomNumber] = {
            roomNumber,
            revenue: 0,
            bookings: 0,
            nights: 0
          };
        }
        
        // אתחול נתוני סוג חדר אם לא קיים
        if (!typeRevenue[roomType]) {
          typeRevenue[roomType] = {
            roomType,
            revenue: 0,
            bookings: 0,
            nights: 0
          };
        }
        
        // הוספת ההכנסה והלילות למונים
        roomRevenue[roomNumber].revenue += revenueInThisMonth;
        roomRevenue[roomNumber].nights += nightsInMonth;
        roomRevenue[roomNumber].bookings += (nightsInMonth > 0 ? 1 : 0); // נוסיף הזמנה רק אם יש לילות
        
        typeRevenue[roomType].revenue += revenueInThisMonth;
        typeRevenue[roomType].nights += nightsInMonth;
        typeRevenue[roomType].bookings += (nightsInMonth > 0 ? 1 : 0); // נוסיף הזמנה רק אם יש לילות
        
      } catch (error) {
        console.error(`שגיאה בחישוב הכנסה לפי חדרים #${booking.bookingNumber || booking._id}:`, error);
      }
    });
    
    // המרת נתוני חדרים למערך לתצוגה
    response.roomRevenue.byRoom = Object.values(roomRevenue)
      .map(room => ({
        roomNumber: room.roomNumber,
        revenue: Math.round(room.revenue),
        bookings: room.bookings,
        nights: room.nights
      }))
      .sort((a, b) => b.revenue - a.revenue); // מיון לפי הכנסה בסדר יורד
    
    // המרת נתוני סוגי חדרים למערך לתצוגה
    response.roomRevenue.byType = Object.values(typeRevenue)
      .map(type => ({
        roomType: type.roomType,
        revenue: Math.round(type.revenue),
        bookings: type.bookings,
        nights: type.nights
      }))
      .sort((a, b) => b.revenue - a.revenue); // מיון לפי הכנסה בסדר יורד
    
    console.log('סיום חישוב הכנסות חודשיות');
    
    // הוספת כל ההזמנות הרלוונטיות לתשובה
    response.bookings = paidBookings
      .map(booking => {
        // חישוב הלילות בחודש הנוכחי להזמנה זו
        const checkInDate = new Date(booking.checkIn);
        const checkOutDate = new Date(booking.checkOut);
        
        let nightsInMonth = 0;
        for (let day = 1; day <= daysInMonth; day++) {
          const currentNightDate = new Date(Date.UTC(numericYear, numericMonth - 1, day));
          if (checkInDate <= currentNightDate && checkOutDate > currentNightDate) {
            nightsInMonth++;
          }
        }
        
        // נחזיר רק הזמנות עם לילות בחודש זה
        if (nightsInMonth === 0) return null;
        
        // חישוב תעריף לכל לילה וההכנסה בחודש זה
        const totalNights = differenceInDays(checkOutDate, checkInDate);
        const ratePerNight = booking.price / Math.max(1, totalNights);
        const revenueInMonth = ratePerNight * nightsInMonth;
        
        return {
          _id: booking._id,
          bookingNumber: booking.bookingNumber,
          firstName: booking.firstName,
          lastName: booking.lastName,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          paymentAmount: booking.paymentAmount || booking.price || 0,
          paymentStatus: booking.paymentStatus,
          price: booking.price,
          revenueInMonth: Math.round(revenueInMonth),
          nightsInMonth: nightsInMonth,
          roomNumber: booking.room?.roomNumber,
          roomType: booking.room?.category
        };
      })
      .filter(booking => booking !== null); // סינון ערכים ריקים
    
    // שליחת התשובה
    res.status(200).json(response);
    
  } catch (error) {
    console.error('שגיאה בהבאת נתוני הכנסות:', error);
    res.status(500).json({ message: 'שגיאת שרת בהבאת נתוני הכנסות', error: error.message });
  }
}; 