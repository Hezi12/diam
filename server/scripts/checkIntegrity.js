/**
 * סקריפט לבדיקת שלמות המערכת
 * בודק שכל קבצי המודל והבקרים הנדרשים קיימים
 */

const fs = require('fs');
const path = require('path');

const requiredModels = [
  'Booking.js', 'Room.js', 'User.js', 'Invoice.js', 
  'Capital.js', 'Expense.js', 'ExpenseCategory.js',
  'ManualIncome.js', 'IncomeCategory.js', 'FinancialSummary.js'
];

const requiredControllers = [
  'bookingsController.js', 'roomsController.js', 'authController.js',
  'invoicesController.js', 'capitalController.js', 'financialController.js'
];

const requiredMiddleware = [
  'authMiddleware.js'
];

const requiredRoutes = [
  'bookings.js', 'rooms.js', 'auth.js', 'invoices.js', 
  'capital.js', 'financial.js', 'cleaning.js', 'roomMappings.js', 'revenue.js'
];

console.log('בודק שלמות המערכת...');

// בדיקת קיום כל קבצי המודל הנדרשים
const modelsPath = path.join(__dirname, '..', 'models');
const missingModels = requiredModels.filter(model => 
  !fs.existsSync(path.join(modelsPath, model))
);

// בדיקת קיום כל קבצי הבקר הנדרשים
const controllersPath = path.join(__dirname, '..', 'controllers');
const missingControllers = requiredControllers.filter(controller => 
  !fs.existsSync(path.join(controllersPath, controller))
);

// בדיקת קיום middleware נדרשים
const middlewarePath = path.join(__dirname, '..', 'middleware');
const missingMiddleware = requiredMiddleware.filter(middleware => 
  !fs.existsSync(path.join(middlewarePath, middleware))
);

// בדיקת קיום נתיבים נדרשים
const routesPath = path.join(__dirname, '..', 'routes');
const missingRoutes = requiredRoutes.filter(route => 
  !fs.existsSync(path.join(routesPath, route))
);

// בדיקת עקביות בייצוא middleware
let middlewareExportsError = false;
if (fs.existsSync(path.join(middlewarePath, 'authMiddleware.js'))) {
  try {
    const authMiddleware = require('../middleware/authMiddleware');
    if (!authMiddleware.verifyToken) {
      console.error('❌ שגיאה: authMiddleware.js קיים אך אינו מייצא פונקציית verifyToken');
      middlewareExportsError = true;
    }
  } catch (error) {
    console.error('❌ שגיאה בטעינת authMiddleware:', error.message);
    middlewareExportsError = true;
  }
}

// הדפסת תוצאות הבדיקה
let hasError = false;

if (missingModels.length > 0) {
  console.error('❌ חסרים קבצי מודל:', missingModels.join(', '));
  hasError = true;
}

if (missingControllers.length > 0) {
  console.error('❌ חסרים קבצי בקר:', missingControllers.join(', '));
  hasError = true;
}

if (missingMiddleware.length > 0) {
  console.error('❌ חסרים קבצי middleware:', missingMiddleware.join(', '));
  hasError = true;
}

if (missingRoutes.length > 0) {
  console.error('❌ חסרים קבצי נתיבים:', missingRoutes.join(', '));
  hasError = true;
}

if (middlewareExportsError) {
  hasError = true;
}

// סיכום
if (hasError) {
  console.error('❌ נמצאו בעיות בשלמות המערכת. תקן את הבעיות לפני המשך.');
  process.exit(1);
} else {
  console.log('✅ כל קבצי המערכת הנדרשים קיימים');
  process.exit(0);
} 