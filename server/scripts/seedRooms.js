/**
 * סקריפט ליצירת חדרים לדוגמא במסד הנתונים
 * מייצר חדרים במיקומים airport ו-rothschild
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// טעינת הגדרות סביבה
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// מודלים
const Room = require('../models/Room');

// פונקציה ליצירת חדרים לדוגמא
const createSampleRooms = async () => {
  try {
    // התחברות למסד הנתונים
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // מחיקת חדרים קודמים (אם יש)
    await Room.deleteMany({
      $or: [
        { roomNumber: { $in: ['101', '102', '103', '201', '202'] } }
      ]
    });
    console.log('נמחקו חדרים קודמים');

    // יצירת חדרים במיקום airport
    const airportRooms = [
      {
        roomNumber: '101',
        location: 'airport',
        category: 'Standard',
        basePrice: 350,
        vatPrice: 410,
        fridayPrice: 400,
        fridayVatPrice: 470,
        baseOccupancy: 2,
        maxOccupancy: 3,
        extraGuestCharge: 100,
        description: 'חדר סטנדרטי באיירפורט סיטי',
        amenities: [
          'מיזוג אוויר',
          'טלוויזיה',
          'מקרר',
          'כספת',
          'מקלחת'
        ],
        isActive: true
      },
      {
        roomNumber: '102',
        location: 'airport',
        category: 'Standard with Balcony',
        basePrice: 400,
        vatPrice: 470,
        fridayPrice: 450,
        fridayVatPrice: 530,
        baseOccupancy: 2,
        maxOccupancy: 3,
        extraGuestCharge: 100,
        description: 'חדר סטנדרטי עם מרפסת באיירפורט סיטי',
        amenities: [
          'מיזוג אוויר',
          'טלוויזיה',
          'מקרר',
          'כספת',
          'מקלחת',
          'מרפסת'
        ],
        isActive: true
      },
      {
        roomNumber: '103',
        location: 'airport',
        category: 'Family room',
        basePrice: 500,
        vatPrice: 590,
        fridayPrice: 550,
        fridayVatPrice: 650,
        baseOccupancy: 2,
        maxOccupancy: 4,
        extraGuestCharge: 100,
        description: 'חדר משפחתי באיירפורט סיטי',
        amenities: [
          'מיזוג אוויר',
          'טלוויזיה',
          'מקרר',
          'כספת',
          'מקלחת',
          'מיטה זוגית + ספה נפתחת'
        ],
        isActive: true
      }
    ];

    // יצירת חדרים במיקום rothschild
    const rothschildRooms = [
      {
        roomNumber: '201',
        location: 'rothschild',
        category: 'Standard',
        basePrice: 450,
        vatPrice: 530,
        fridayPrice: 500,
        fridayVatPrice: 590,
        baseOccupancy: 2,
        maxOccupancy: 2,
        extraGuestCharge: 150,
        description: 'חדר סטנדרטי ברוטשילד',
        amenities: [
          'מיזוג אוויר',
          'טלוויזיה',
          'מקרר',
          'כספת',
          'מקלחת'
        ],
        isActive: true
      },
      {
        roomNumber: '202',
        location: 'rothschild',
        category: 'Standard with Balcony',
        basePrice: 500,
        vatPrice: 590,
        fridayPrice: 550,
        fridayVatPrice: 650,
        baseOccupancy: 2,
        maxOccupancy: 3,
        extraGuestCharge: 150,
        description: 'חדר סטנדרטי עם מרפסת ברוטשילד',
        amenities: [
          'מיזוג אוויר',
          'טלוויזיה',
          'מקרר',
          'כספת',
          'מקלחת',
          'מרפסת'
        ],
        isActive: true
      }
    ];

    // שמירת החדרים במסד הנתונים
    const createdAirportRooms = await Room.create(airportRooms);
    const createdRothschildRooms = await Room.create(rothschildRooms);

    console.log(`נוצרו ${createdAirportRooms.length} חדרים במיקום airport`);
    console.log(`נוצרו ${createdRothschildRooms.length} חדרים במיקום rothschild`);
    console.log('הסקריפט הסתיים בהצלחה');

    mongoose.connection.close();
  } catch (error) {
    console.error('שגיאה:', error);
    process.exit(1);
  }
};

// הפעלת הסקריפט
createSampleRooms(); 