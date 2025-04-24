const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// טעינת הגדרות סביבה
dotenv.config({ path: path.join(__dirname, '../.env') });

// יצירת מודל גלריה
const gallerySchema = new mongoose.Schema({
  location: {
    type: String,
    required: true,
    enum: ['airport', 'rothschild']
  },
  imageUrl: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

async function migrateToTest() {
  try {
    // התחברות למסד הנתונים diam_hotel
    console.log('מתחבר למסד הנתונים diam_hotel...');
    const diamConn = await mongoose.createConnection('mongodb+srv://Hezi:Hezi!3225@cluster0.o8qdhf0.mongodb.net/diam_hotel?retryWrites=true&w=majority&appName=Cluster0');
    console.log('מחובר למסד נתונים diam_hotel');

    // התחברות למסד הנתונים test
    console.log('מתחבר למסד הנתונים test...');
    const testConn = await mongoose.createConnection('mongodb+srv://Hezi:Hezi!3225@cluster0.o8qdhf0.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0');
    console.log('מחובר למסד נתונים test');

    // הגדרת המודלים
    const DiamGallery = diamConn.model('Gallery', gallerySchema);
    const TestGallery = testConn.model('Gallery', gallerySchema);

    // קבלת כל הנתונים מהאוסף ב-diam_hotel
    console.log('מייבא נתונים מאוסף galleries ב-diam_hotel...');
    const galleries = await DiamGallery.find({});
    console.log(`נמצאו ${galleries.length} רשומות באוסף המקורי`);

    if (galleries.length === 0) {
      console.log('אין נתונים להעברה');
      process.exit(0);
    }

    // מחיקת כל הנתונים מהאוסף ב-test אם קיימים
    await TestGallery.deleteMany({});
    console.log('נמחקו כל הרשומות הקיימות באוסף galleries ב-test');

    // העברת הנתונים לאוסף החדש
    console.log('מעביר נתונים לאוסף החדש...');
    for (const gallery of galleries) {
      const newGallery = new TestGallery({
        location: gallery.location,
        imageUrl: gallery.imageUrl,
        title: gallery.title,
        description: gallery.description,
        displayOrder: gallery.displayOrder,
        active: gallery.active,
        createdAt: gallery.createdAt,
        updatedAt: gallery.updatedAt
      });

      await newGallery.save();
      console.log(`הועברה תמונה: ${gallery.imageUrl}`);
    }

    console.log('העברת נתונים הושלמה בהצלחה');
    process.exit(0);
  } catch (error) {
    console.error('שגיאה בהעברת נתונים:', error);
    process.exit(1);
  }
}

migrateToTest(); 