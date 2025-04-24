const mongoose = require('mongoose');

async function checkCollections() {
  try {
    // התחברות למסד הנתונים
    console.log('מתחבר למסד הנתונים...');
    const conn = await mongoose.connect('mongodb+srv://Hezi:Hezi!3225@cluster0.o8qdhf0.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0');
    console.log('מחובר למסד נתונים test');

    // קבלת רשימת האוספים
    console.log('מקבל רשימת אוספים...');
    const collections = await conn.connection.db.listCollections().toArray();
    
    console.log('\nאוספים במסד הנתונים test:');
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