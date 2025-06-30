const Room = require('../models/Room');
const Gallery = require('../models/Gallery');
const Booking = require('../models/Booking');
const fs = require('fs-extra');
const path = require('path');

// קבלת כל החדרים
exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find().sort({ location: 1, roomNumber: 1 });
    res.json(rooms);
  } catch (error) {
    console.error('Error getting rooms:', error);
    res.status(500).json({ message: 'שגיאה בקבלת רשימת החדרים' });
  }
};

// קבלת חדרים לפי מיקום
exports.getRoomsByLocation = async (req, res) => {
  try {
    const { location } = req.params;
    
    // וידוא שהמיקום תקין
    if (!['airport', 'rothschild'].includes(location)) {
      return res.status(400).json({ message: 'מיקום לא תקין' });
    }
    
    const rooms = await Room.find({ location }).sort({ roomNumber: 1 });
    res.json(rooms);
  } catch (error) {
    console.error('Error getting rooms by location:', error);
    res.status(500).json({ message: 'שגיאה בקבלת רשימת החדרים' });
  }
};

// קבלת חדר לפי מזהה
exports.getRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Room.findById(id);
    
    if (!room) {
      return res.status(404).json({ message: 'חדר לא נמצא' });
    }
    
    res.json(room);
  } catch (error) {
    console.error('Error getting room by id:', error);
    res.status(500).json({ message: 'שגיאה בקבלת פרטי החדר' });
  }
};

// קבלת חדרים זמינים לפי תאריכים ומיקום
exports.getAvailableRooms = async (req, res) => {
  try {
    const { location, checkIn, checkOut, excludeRoomId } = req.query;
    
    // וידוא שכל הפרמטרים הנדרשים נשלחו
    if (!location || !checkIn || !checkOut) {
      return res.status(400).json({ 
        message: 'נדרש לספק מיקום, תאריך צ׳ק-אין ותאריך צ׳ק-אאוט' 
      });
    }
    
    // וידוא שהמיקום תקין
    if (!['airport', 'rothschild'].includes(location)) {
      return res.status(400).json({ message: 'מיקום לא תקין' });
    }
    
    // המרת תאריכים לפורמט אחיד
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    // ודא שהמיקום תקין
    if (!['airport', 'rothschild'].includes(location)) {
      return res.status(400).json({ message: 'מיקום לא תקין' });
    }
    
    // קריאה לכל החדרים במיקום הנבחר
    const rooms = await Room.find({ 
      location,
      status: true // רק חדרים פעילים
    }).sort({ roomNumber: 1 });
    
    // מציאת כל ההזמנות בטווח התאריכים
    const bookings = await Booking.find({
      location,
      $or: [
        // הזמנות שמתחילות בטווח
        { checkIn: { $gte: checkInDate, $lt: checkOutDate } },
        // הזמנות שמסתיימות בטווח
        { checkOut: { $gt: checkInDate, $lte: checkOutDate } },
        // הזמנות שמקיפות את הטווח
        { 
          checkIn: { $lte: checkInDate },
          checkOut: { $gte: checkOutDate }
        }
      ]
    }).populate('room');
    
    // יצירת מערך של חדרים תפוסים
    const bookedRoomIds = bookings.map(booking => 
      booking.room._id ? booking.room._id.toString() : booking.room.toString()
    );
    
    // סינון חדרים זמינים
    const availableRooms = rooms.filter(room => {
      // אם צריך לדלג על חדר מסוים (החדר שכבר נבחר)
      if (excludeRoomId && room._id.toString() === excludeRoomId) {
        return false;
      }
      
      // בדיקה אם החדר לא תפוס
      return !bookedRoomIds.includes(room._id.toString());
    });
    
    res.json(availableRooms);
  } catch (error) {
    console.error('Error getting available rooms:', error);
    res.status(500).json({ message: 'שגיאה בקבלת רשימת החדרים הזמינים' });
  }
};

// יצירת חדר חדש
exports.createRoom = async (req, res) => {
  try {
    const { 
      roomNumber, 
      location, 
      category, 
      basePrice, 
      vatPrice, 
      fridayPrice, 
      fridayVatPrice,
      saturdayPrice,
      saturdayVatPrice,
      baseOccupancy,
      maxOccupancy,
      extraGuestCharge,
      description,
      amenities,
      images,
      status
    } = req.body;
    
    // בדיקה אם חדר עם אותו מספר ומיקום כבר קיים
    const existingRoom = await Room.findOne({ 
      roomNumber, 
      location 
    });
    
    if (existingRoom) {
      return res.status(400).json({ 
        message: `חדר עם מספר ${roomNumber} כבר קיים במיקום ${location}` 
      });
    }
    
    // יצירת חדר חדש
    const newRoom = new Room({
      roomNumber,
      location,
      category,
      basePrice,
      vatPrice,
      fridayPrice,
      fridayVatPrice,
      saturdayPrice,
      saturdayVatPrice,
      baseOccupancy,
      maxOccupancy,
      extraGuestCharge,
      description,
      amenities,
      images,
      status
    });
    
    await newRoom.save();
    
    res.status(201).json(newRoom);
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ message: 'שגיאה ביצירת חדר חדש' });
  }
};

// עדכון חדר קיים
exports.updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // הסרת שדות שאסור לעדכן ישירות
    delete updateData._id;
    delete updateData.__v;
    
    // בדיקה אם החדר קיים
    const room = await Room.findById(id);
    
    if (!room) {
      return res.status(404).json({ message: 'חדר לא נמצא' });
    }
    
    // בדיקה אם מנסים לשנות מספר חדר ומיקום, לוודא שאין התנגשות
    if (
      (updateData.roomNumber && updateData.roomNumber !== room.roomNumber) ||
      (updateData.location && updateData.location !== room.location)
    ) {
      const existingRoom = await Room.findOne({
        roomNumber: updateData.roomNumber || room.roomNumber,
        location: updateData.location || room.location,
        _id: { $ne: id } // לא לבדוק את החדר הנוכחי
      });
      
      if (existingRoom) {
        return res.status(400).json({ 
          message: `חדר עם מספר ${updateData.roomNumber || room.roomNumber} כבר קיים במיקום ${updateData.location || room.location}` 
        });
      }
    }
    
    // עדכון החדר
    const updatedRoom = await Room.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    res.json(updatedRoom);
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({ message: 'שגיאה בעדכון החדר' });
  }
};

// מחיקת חדר
exports.deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedRoom = await Room.findByIdAndDelete(id);
    
    if (!deletedRoom) {
      return res.status(404).json({ message: 'חדר לא נמצא' });
    }
    
    // מחיקת תמונות החדר מהשרת
    if (deletedRoom.images && deletedRoom.images.length > 0) {
      for (const imagePath of deletedRoom.images) {
        try {
          // הסרת ה-URL הבסיסי כדי לקבל את הנתיב היחסי
          const relativePath = imagePath.replace(/^https?:\/\/[^\/]+\//, '');
          await fs.remove(path.join(__dirname, '../', relativePath));
          console.log(`תמונה נמחקה: ${relativePath}`);
        } catch (err) {
          console.error(`שגיאה במחיקת תמונה ${imagePath}:`, err);
        }
      }
    }
    
    res.json({ message: 'החדר נמחק בהצלחה' });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ message: 'שגיאה במחיקת החדר' });
  }
};

// העלאת תמונה לחדר
exports.uploadImage = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // וידוא שנשלח קובץ
    if (!req.file) {
      return res.status(400).json({ message: 'לא נשלח קובץ תמונה' });
    }
    
    // וידוא שהחדר קיים
    const room = await Room.findById(roomId);
    if (!room) {
      // מחיקת הקובץ שהועלה אם החדר לא נמצא
      await fs.remove(req.file.path);
      return res.status(404).json({ message: 'חדר לא נמצא' });
    }
    
    // ✅ בניית נתיב הגישה לתמונה - תיקון לפרודקשן
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://diam-loy6.onrender.com'
      : `${req.protocol}://${req.get('host')}`;
    const imageUrl = `${baseUrl}/uploads/rooms/${room.location}/${req.file.filename}`;
    
    console.log(`📸 Image uploaded: ${imageUrl}`);
    
    // עדכון החדר עם התמונה החדשה
    await Room.findByIdAndUpdate(
      roomId,
      { $push: { images: imageUrl } }
    );
    
    res.json({ 
      message: 'התמונה הועלתה בהצלחה',
      imageUrl
    });
  } catch (error) {
    console.error('Error uploading room image:', error);
    
    // מחיקת הקובץ שהועלה במקרה של שגיאה
    if (req.file) {
      await fs.remove(req.file.path);
    }
    
    res.status(500).json({ message: 'שגיאה בהעלאת התמונה' });
  }
};

// העלאת תמונה לגלריה
exports.uploadGalleryImage = async (req, res) => {
  try {
    const { location } = req.params;
    
    // וידוא שהמיקום תקין
    if (!['airport', 'rothschild'].includes(location)) {
      // מחיקת הקובץ שהועלה
      if (req.file) {
        await fs.remove(req.file.path);
      }
      return res.status(400).json({ message: 'מיקום לא תקין' });
    }
    
    // וידוא שנשלח קובץ
    if (!req.file) {
      return res.status(400).json({ message: 'לא נשלח קובץ תמונה' });
    }
    
    // ✅ בניית נתיב הגישה לתמונה - תיקון לפרודקשן
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://diam-loy6.onrender.com'
      : `${req.protocol}://${req.get('host')}`;
    const imageUrl = `${baseUrl}/uploads/gallery/${location}/${req.file.filename}`;
    
    console.log(`🖼️ Gallery image uploaded: ${imageUrl}`);
    
    // שמירת מידע על התמונה במסד הנתונים
    const galleryImage = new Gallery({
      location,
      imageUrl,
      title: req.body.title || '',
      description: req.body.description || '',
      displayOrder: req.body.displayOrder || 0
    });
    
    await galleryImage.save();
    
    res.json({ 
      message: 'התמונה הועלתה בהצלחה',
      imageUrl,
      location,
      galleryImage
    });
  } catch (error) {
    console.error('Error uploading gallery image:', error);
    
    // מחיקת הקובץ שהועלה במקרה של שגיאה
    if (req.file) {
      await fs.remove(req.file.path);
    }
    
    res.status(500).json({ message: 'שגיאה בהעלאת התמונה לגלריה' });
  }
};

// קבלת תמונות הגלריה
exports.getGalleryImages = async (req, res) => {
  try {
    const { location } = req.params;
    
    // וידוא שהמיקום תקין
    if (!['airport', 'rothschild'].includes(location)) {
      return res.status(400).json({ message: 'מיקום לא תקין' });
    }
    
    // חיפוש תמונות הגלריה במסד הנתונים
    const galleryImages = await Gallery.find({ 
      location,
      active: true 
    }).sort({ displayOrder: 1, createdAt: -1 });
    
    // אם אין תמונות במסד הנתונים, ננסה לקרוא מהתיקייה (לתאימות לאחור)
    if (galleryImages.length === 0) {
      // נתיב תיקיית הגלריה - מותאם לסביבה
      const baseUploadsPath = process.env.NODE_ENV === 'production' 
        ? '/opt/render/project/src/uploads'
        : path.join(__dirname, '../uploads');
      const galleryPath = path.join(baseUploadsPath, `gallery/${location}`);
      
      // בדיקה אם התיקייה קיימת
      if (await fs.pathExists(galleryPath)) {
        // קריאת רשימת הקבצים
        const files = await fs.readdir(galleryPath);
        
        // ✅ יצירת רשימת URLs לתמונות - תיקון לפרודקשן
        const baseUrl = process.env.NODE_ENV === 'production' 
          ? 'https://diam-loy6.onrender.com'
          : `${req.protocol}://${req.get('host')}`;
        const imageUrls = files
          .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file)) // רק קבצי תמונה
          .map(file => `${baseUrl}/uploads/gallery/${location}/${file}`);
        
        // המרת התמונות למודל החדש ושמירה במסד הנתונים
        if (imageUrls.length > 0) {
          const galleryDocs = await Promise.all(imageUrls.map(async (imageUrl, index) => {
            const galleryImage = new Gallery({
              location,
              imageUrl,
              displayOrder: index
            });
            await galleryImage.save();
            return galleryImage;
          }));
          
          return res.json(galleryDocs.map(doc => doc.imageUrl));
        }
        
        return res.json([]);
      } else {
        return res.json([]);
      }
    }
    
    // החזרת רשימת URLs של התמונות (לתאימות עם הלקוח הקיים)
    res.json(galleryImages.map(image => image.imageUrl));
  } catch (error) {
    console.error('Error getting gallery images:', error);
    res.status(500).json({ message: 'שגיאה בקבלת תמונות הגלריה' });
  }
};

// מחיקת תמונה מהגלריה
exports.deleteGalleryImage = async (req, res) => {
  try {
    const { id } = req.params;
    
    // מחפשים את התמונה במסד הנתונים
    const galleryImage = await Gallery.findById(id);
    
    if (!galleryImage) {
      return res.status(404).json({ message: 'תמונה לא נמצאה' });
    }
    
    // מחיקת הקובץ מהדיסק
    try {
      const relativePath = galleryImage.imageUrl.replace(/^https?:\/\/[^\/]+\//, '');
      await fs.remove(path.join(__dirname, '../', relativePath));
    } catch (err) {
      console.error(`שגיאה במחיקת קובץ התמונה ${galleryImage.imageUrl}:`, err);
      // ממשיכים למרות השגיאה במחיקת הקובץ
    }
    
    // מחיקת המסמך ממסד הנתונים
    await Gallery.findByIdAndDelete(id);
    
    res.json({ message: 'התמונה נמחקה בהצלחה' });
  } catch (error) {
    console.error('Error deleting gallery image:', error);
    res.status(500).json({ message: 'שגיאה במחיקת התמונה' });
  }
};

// קבלת פרטים מלאים של תמונות הגלריה כולל מזהים
exports.getGalleryImagesDetails = async (req, res) => {
  try {
    const { location } = req.params;
    
    // וידוא שהמיקום תקין
    if (!['airport', 'rothschild'].includes(location)) {
      return res.status(400).json({ message: 'מיקום לא תקין' });
    }
    
    // חיפוש תמונות הגלריה במסד הנתונים
    const galleryImages = await Gallery.find({ 
      location,
      active: true 
    }).sort({ displayOrder: 1, createdAt: -1 });
    
    // החזרת רשימת התמונות עם הפרטים המלאים כולל מזהים
    res.json(galleryImages);
  } catch (error) {
    console.error('Error getting gallery images details:', error);
    res.status(500).json({ message: 'שגיאה בקבלת פרטי תמונות הגלריה' });
  }
};

// קבלת כל החדרים הציבוריים לפי מיקום
exports.getPublicRoomsByLocation = async (req, res) => {
  try {
    const { location } = req.params;
    
    // וידוא שהמיקום תקין
    if (!['airport', 'rothschild'].includes(location)) {
      return res.status(400).json({ message: 'מיקום לא תקין' });
    }
    
    console.log(`מחפש חדרים ציבוריים במיקום: ${location}`);
    
    // מחזיר חדרים במיקום המבוקש, מסנן חדרים מסוג "Not for Sale"
    const rooms = await Room.find({ 
      location,
      category: { $ne: 'Not for Sale' } // מסנן חדרים שאינם למכירה
    }).select({
      roomNumber: 1,
      category: 1,
      basePrice: 1,
      vatPrice: 1,
      fridayPrice: 1,
      fridayVatPrice: 1,
      description: 1,
      amenities: 1,
      images: 1,
      baseOccupancy: 1,
      maxOccupancy: 1,
      extraGuestCharge: 1,
      location: 1,
      status: 1
    }).sort({ roomNumber: 1 });

    console.log(`מחזיר ${rooms.length} חדרים ציבוריים למיקום ${location}`);
    
    res.json(rooms);
  } catch (error) {
    console.error('Error getting public rooms by location:', error);
    res.status(500).json({ message: 'שגיאה בקבלת רשימת החדרים הציבוריים' });
  }
};

// קבלת חדר ציבורי בודד לפי מזהה
exports.getPublicRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`מתקבלת בקשה לחדר ציבורי עם מזהה: ${id}`);

    // מחפש את החדר ומחזיר רק שדות רלוונטיים לתצוגה הציבורית
    const room = await Room.findOne({
      _id: id
    }).select({
      roomNumber: 1,
      category: 1,
      basePrice: 1,
      vatPrice: 1,
      fridayPrice: 1,
      fridayVatPrice: 1,
      description: 1,
      amenities: 1,
      images: 1,
      baseOccupancy: 1,
      maxOccupancy: 1,
      extraGuestCharge: 1,
      location: 1,
      status: 1
    });
    
    if (!room) {
      console.log(`חדר עם מזהה ${id} לא נמצא`);
      return res.status(404).json({ message: 'חדר לא נמצא' });
    }
    
    console.log(`מחזיר חדר ציבורי: ${room.roomNumber} במיקום ${room.location}`);
    res.json(room);
  } catch (error) {
    console.error('Error getting public room by id:', error);
    res.status(500).json({ message: 'שגיאה בקבלת פרטי החדר הציבורי' });
  }
};

// העלאת תמונות לחדר ספציפי
exports.uploadRoomImages = async (req, res) => {
  try {
    const { id } = req.params;
    
    // בדיקה שהחדר קיים
    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ message: 'חדר לא נמצא' });
    }
    
    // בדיקה שיש קבצים שהועלו
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'לא הועלו קבצים' });
    }
    
    console.log(`מעלה ${req.files.length} תמונות לחדר ${room.roomNumber} במיקום ${room.location}`);
    
    // ✅ יצירת רשימת URLs לתמונות החדשות - תיקון לפרודקשן
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://diam-loy6.onrender.com'
      : `${req.protocol}://${req.get('host')}`;
    const imageUrls = req.files.map(file => {
      return `${baseUrl}/uploads/rooms/${room.location}/${file.filename}`;
    });
    
    console.log(`📸 Generated image URLs:`, imageUrls);
    
    // עדכון החדר במסד הנתונים - הוספת התמונות החדשות לרשימה הקיימת
    const updatedRoom = await Room.findByIdAndUpdate(
      id,
      { 
        $push: { 
          images: { $each: imageUrls } 
        } 
      },
      { new: true }
    );
    
    console.log(`עודכנו תמונות חדר ${room.roomNumber}: ${imageUrls.length} תמונות חדשות`);
    
    res.json({
      message: 'התמונות הועלו בהצלחה',
      room: updatedRoom,
      uploadedImages: imageUrls
    });
    
  } catch (error) {
    console.error('Error uploading room images:', error);
    res.status(500).json({ message: 'שגיאה בהעלאת תמונות החדר' });
  }
}; 