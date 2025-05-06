const express = require('express');
const router = express.Router();
const financialController = require('../controllers/financialController');
const authMiddleware = require('../middleware/authMiddleware');

// נתיבי קטגוריות הוצאות
router.get('/expense-categories', authMiddleware.verifyToken, financialController.getAllExpenseCategories);
router.post('/expense-categories', authMiddleware.verifyToken, financialController.createExpenseCategory);
router.put('/expense-categories/:id', authMiddleware.verifyToken, financialController.updateExpenseCategory);
router.delete('/expense-categories/:id', authMiddleware.verifyToken, financialController.deleteExpenseCategory);
router.get('/expense-categories/:id', authMiddleware.verifyToken, financialController.getExpenseCategoryById);

// נתיבי קטגוריות הכנסות
router.get('/income-categories', authMiddleware.verifyToken, financialController.getAllIncomeCategories);
router.post('/income-categories', authMiddleware.verifyToken, financialController.createIncomeCategory);
router.put('/income-categories/:id', authMiddleware.verifyToken, financialController.updateIncomeCategory);

// נתיבי הוצאות
router.get('/expenses', authMiddleware.verifyToken, financialController.getExpensesByMonth);
router.post('/expenses', authMiddleware.verifyToken, financialController.createExpense);
router.put('/expenses/:id', authMiddleware.verifyToken, financialController.updateExpense);
router.delete('/expenses/:id', authMiddleware.verifyToken, financialController.deleteExpense);
router.get('/expenses/:id', authMiddleware.verifyToken, financialController.getExpenseById);

// נתיבי הכנסות ידניות
router.get('/manual-income', authMiddleware.verifyToken, financialController.getManualIncomes);
router.post('/manual-income', authMiddleware.verifyToken, financialController.createManualIncome);
router.put('/manual-income/:id', authMiddleware.verifyToken, financialController.updateManualIncome);
router.delete('/manual-income/:id', authMiddleware.verifyToken, financialController.deleteManualIncome);

// נתיבי הכנסות מהזמנות
router.get('/booking-income', authMiddleware.verifyToken, financialController.getBookingIncomeByMonth);

// סיכום פיננסי
router.get('/summary', authMiddleware.verifyToken, financialController.getFinancialSummary);
router.post('/summary/initial-balance', authMiddleware.verifyToken, financialController.updateInitialBalance);

// סיכום חודשי
router.get('/monthly-summary', authMiddleware.verifyToken, financialController.getMonthlySummary);

// נתיבי סיכום פיננסי
router.get('/summary/monthly/:year/:month', authMiddleware.verifyToken, financialController.getMonthlyFinancialSummary);
router.get('/summary/yearly/:year', authMiddleware.verifyToken, financialController.getYearlyFinancialSummary);

module.exports = router; 