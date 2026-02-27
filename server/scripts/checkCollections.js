const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function checkCollections() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI is not defined in .env');
      process.exit(1);
    }

    // התחברות למסד הנתונים
    console.log('מתחבר למסד הנתונים...');
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log('מחובר למסד נתונים');

    // קבלת רשימת האוספים
    console.log('מקבל רשימת אוספים...');
    const collections = await conn.connection.db.listCollections().toArray();

    console.log('\nאוספים במסד הנתונים:');
    console.log('-----------------------------');
    for (const collection of collections) {
      console.log(`- ${collection.name}`);

      // ספירת מסמכים בכל אוסף
      const count = await conn.connection.db.collection(collection.name).countDocuments();
      console.log(`  מספר מסמכים: ${count}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('שגיאה בבדיקת אוספים:', error);
    process.exit(1);
  }
}

checkCollections();
