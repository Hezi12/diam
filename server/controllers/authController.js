const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require('mongoose');
const { CURRENT_SESSION_VERSION } = require('../config/sessionConfig');

// הדרך היעילה ביותר תהיה להשתמש במשתמש קבוע מראש, אבל לצורך הדוגמה אנחנו נשתמש במסד נתונים

// התחברות למערכת
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // בדיקה אם חסרים שדות
    if (!username || !password) {
      return res.status(400).json({ message: 'יש למלא את כל השדות' });
    }

    // בדיקה אם השרת מחובר ל-MongoDB
    const isMongoConnected = mongoose.connection.readyState === 1;

    // אם אין חיבור ל-MongoDB ומדובר במצב פיתוח, אפשר לאפשר כניסה עם המשתמש הדיפולטיבי
    if (!isMongoConnected && process.env.NODE_ENV === 'development') {
      // נתוני משתמש קבועים לסביבת פיתוח
      if (username === 'hezi' && password === 'hezi3225') {
        const token = jwt.sign(
          {
            id: 'dev-user-id',
            username: 'hezi',
            name: 'חזי - מנהל המערכת',
            role: 'admin',
            sessionVersion: CURRENT_SESSION_VERSION
          },
          process.env.JWT_SECRET || 'your_jwt_secret_key',
          { expiresIn: '1d' }
        );

        return res.json({
          token,
          user: {
            id: 'dev-user-id',
            username: 'hezi',
            name: 'חזי - מנהל המערכת',
            role: 'admin'
          }
        });
      } else {
        return res.status(401).json({ message: 'שם משתמש או סיסמה שגויים' });
      }
    }

    // אם MongoDB מחובר, המשך לתהליך הרגיל
    // חיפוש המשתמש במסד הנתונים
    const user = await User.findOne({ username });

    // בדיקה אם המשתמש קיים
    if (!user) {
      return res.status(401).json({ message: 'שם משתמש או סיסמה שגויים' });
    }

    // בדיקת הסיסמה
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'שם משתמש או סיסמה שגויים' });
    }

    // עדכון זמן התחברות אחרון
    user.lastLogin = new Date();
    await user.save();

    // יצירת טוקן JWT
    const token = jwt.sign(
      { 
        id: user._id, 
        username: user.username,
        name: user.name,
        role: user.role,
        sessionVersion: CURRENT_SESSION_VERSION
      },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ message: 'שגיאה בהתחברות' });
  }
};

// יצירת משתמש ראשוני (רק אם אין משתמשים במערכת)
exports.initializeAdmin = async () => {
  try {
    // בדיקה אם קיימים משתמשים במערכת
    const usersCount = await User.countDocuments();
    
    if (usersCount === 0) {
      // יצירת משתמש מנהל ראשוני
      await User.create({
        username: 'hezi',
        password: 'hezi3225',
        name: 'חזי - מנהל המערכת',
        role: 'admin'
      });
      
      console.log('Created initial admin user: hezi');
    }
  } catch (error) {
    console.error('Error initializing admin user:', error);
  }
};

// קבלת פרטי המשתמש הנוכחי
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'משתמש לא נמצא' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get Current User Error:', error);
    res.status(500).json({ message: 'שגיאת שרת בקבלת פרטי משתמש' });
  }
}; 