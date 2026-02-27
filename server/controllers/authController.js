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

    // אם אין חיבור ל-MongoDB ומדובר במצב פיתוח, אפשר לאפשר כניסה עם משתמש ממשתני סביבה
    if (!isMongoConnected && process.env.NODE_ENV === 'development') {
      const devUsername = process.env.ADMIN_USERNAME || 'admin';
      const devPassword = process.env.ADMIN_PASSWORD;

      if (!devPassword) {
        return res.status(500).json({ message: 'ADMIN_PASSWORD not configured in environment' });
      }

      if (username === devUsername && password === devPassword) {
        const token = jwt.sign(
          {
            id: 'dev-user-id',
            username: devUsername,
            name: 'מנהל המערכת',
            role: 'admin',
            sessionVersion: CURRENT_SESSION_VERSION
          },
          process.env.JWT_SECRET,
          { expiresIn: '1d' }
        );

        return res.json({
          token,
          user: {
            id: 'dev-user-id',
            username: devUsername,
            name: 'מנהל המערכת',
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
      process.env.JWT_SECRET,
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
      const adminUsername = process.env.ADMIN_USERNAME || 'admin';
      const adminPassword = process.env.ADMIN_PASSWORD;

      if (!adminPassword) {
        console.warn('WARNING: ADMIN_PASSWORD not set. Skipping initial admin creation.');
        console.warn('Set ADMIN_USERNAME and ADMIN_PASSWORD in .env to create initial admin.');
        return;
      }

      await User.create({
        username: adminUsername,
        password: adminPassword,
        name: 'מנהל המערכת',
        role: 'admin'
      });

      console.log(`Created initial admin user: ${adminUsername}`);
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

// עדכון סיסמא של משתמש
exports.changePassword = async (req, res) => {
  try {
    const { username, newPassword, oldPassword } = req.body;

    // בדיקת פרמטרים
    if (!username || !newPassword) {
      return res.status(400).json({ message: 'יש למלא שם משתמש וסיסמא חדשה' });
    }

    // חיפוש המשתמש
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(404).json({ message: 'משתמש לא נמצא' });
    }

    // חובה לספק סיסמא ישנה לצורך אימות
    if (!oldPassword) {
      return res.status(400).json({ message: 'יש לספק את הסיסמא הישנה לצורך אימות' });
    }

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'סיסמא ישנה שגויה' });
    }

    // עדכון הסיסמא
    // ה-pre-save hook יוצפן את הסיסמא אוטומטית
    user.password = newPassword;
    await user.save();

    console.log(`✅ הסיסמא עודכנה בהצלחה עבור המשתמש "${username}"`);

    return res.json({ 
      success: true, 
      message: 'הסיסמא עודכנה בהצלחה' 
    });
  } catch (error) {
    console.error('Change Password Error:', error);
    return res.status(500).json({ message: 'שגיאה בעדכון הסיסמא' });
  }
}; 