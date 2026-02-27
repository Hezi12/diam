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

async function migrateGallery() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI is not defined in .env');
      process.exit(1);
    }
    const sourceUri = process.env.MONGODB_SOURCE_URI || process.env.MONGODB_URI;
    const targetUri = process.env.MONGODB_TARGET_URI || process.env.MONGODB_URI;

    // התחברות למסד הנתונים המקורי
    console.log('מתחבר למסד הנתונים המקורי...');
    const testConn = await mongoose.createConnection(sourceUri);
    console.log('מחובר למסד נתונים מקור');

    // התחברות למסד הנתונים החדש
    console.log('מתחבר למסד הנתונים החדש...');
    const diamConn = await mongoose.createConnection(targetUri);
    console.log('מחובר למסד נתונים יעד');

    // הגדרת המודלים
    const TestGallery = testConn.model('Gallery', gallerySchema);
    const DiamGallery = diamConn.model('Gallery', gallerySchema);

    // קבלת כל הנתונים מהאוסף המקורי
    console.log('מייבא נתונים מאוסף galleries ב-test...');
    const galleries = await TestGallery.find({});
    console.log(`נמצאו ${galleries.length} רשומות באוסף המקורי`);

    if (galleries.length === 0) {
      console.log('אין נתונים להעברה');
      process.exit(0);
    }

    // העברת הנתונים לאוסף החדש
    console.log('מעביר נתונים לאוסף החדש...');
    for (const gallery of galleries) {
      const newGallery = new DiamGallery({
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

migrateGallery(); 