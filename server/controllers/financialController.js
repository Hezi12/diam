const Expense = require('../models/Expense');
const ManualIncome = require('../models/ManualIncome');
const ExpenseCategory = require('../models/ExpenseCategory');
const IncomeCategory = require('../models/IncomeCategory');
const FinancialSummary = require('../models/FinancialSummary');
const Booking = require('../models/Booking');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

/**
 * Controller לניהול מידע פיננסי במערכת
 */
const financialController = {
  /**
   * קבלת כל קטגוריות ההוצאות
   */
  getAllExpenseCategories: async (req, res) => {
    try {
      const categories = await ExpenseCategory.find({ isActive: true }).sort({ name: 1 });
      res.status(200).json(categories);
    } catch (error) {
      console.error('Error fetching expense categories:', error);
      res.status(500).json({ message: 'שגיאה בטעינת קטגוריות הוצאות', error: error.message });
    }
  },

  /**
   * יצירת קטגוריית הוצאה חדשה
   */
  createExpenseCategory: async (req, res) => {
    try {
      const { name, description } = req.body;
      const existingCategory = await ExpenseCategory.findOne({ name });
      
      if (existingCategory) {
        return res.status(400).json({ message: 'קטגוריה בשם זה כבר קיימת' });
      }
      
      const newCategory = await ExpenseCategory.create({ name, description });
      res.status(201).json(newCategory);
    } catch (error) {
      console.error('Error creating expense category:', error);
      res.status(500).json({ message: 'שגיאה ביצירת קטגוריית הוצאה', error: error.message });
    }
  },

  /**
   * עדכון קטגוריית הוצאה
   */
  updateExpenseCategory: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, isActive } = req.body;
      
      // וידוא שהשם הוא ייחודי (אם השתנה)
      if (name) {
        const existingCategory = await ExpenseCategory.findOne({ 
          name, 
          _id: { $ne: id }
        });
        
        if (existingCategory) {
          return res.status(400).json({ message: 'קטגוריה בשם זה כבר קיימת' });
        }
      }
      
      const updatedCategory = await ExpenseCategory.findByIdAndUpdate(
        id, 
        { name, description, isActive },
        { new: true, runValidators: true }
      );
      
      if (!updatedCategory) {
        return res.status(404).json({ message: 'קטגוריה לא נמצאה' });
      }
      
      res.status(200).json(updatedCategory);
    } catch (error) {
      console.error('Error updating expense category:', error);
      res.status(500).json({ message: 'שגיאה בעדכון קטגוריית הוצאה', error: error.message });
    }
  },

  /**
   * קבלת כל קטגוריות ההכנסות
   */
  getAllIncomeCategories: async (req, res) => {
    try {
      const categories = await IncomeCategory.find({ isActive: true }).sort({ name: 1 });
      res.status(200).json(categories);
    } catch (error) {
      console.error('Error fetching income categories:', error);
      res.status(500).json({ message: 'שגיאה בטעינת קטגוריות הכנסות', error: error.message });
    }
  },

  /**
   * יצירת קטגוריית הכנסה חדשה
   */
  createIncomeCategory: async (req, res) => {
    try {
      const { name, description } = req.body;
      const existingCategory = await IncomeCategory.findOne({ name });
      
      if (existingCategory) {
        return res.status(400).json({ message: 'קטגוריה בשם זה כבר קיימת' });
      }
      
      const newCategory = await IncomeCategory.create({ name, description });
      res.status(201).json(newCategory);
    } catch (error) {
      console.error('Error creating income category:', error);
      res.status(500).json({ message: 'שגיאה ביצירת קטגוריית הכנסה', error: error.message });
    }
  },

  /**
   * עדכון קטגוריית הכנסה
   */
  updateIncomeCategory: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, isActive } = req.body;
      
      // וידוא שהשם הוא ייחודי (אם השתנה)
      if (name) {
        const existingCategory = await IncomeCategory.findOne({ 
          name, 
          _id: { $ne: id }
        });
        
        if (existingCategory) {
          return res.status(400).json({ message: 'קטגוריה בשם זה כבר קיימת' });
        }
      }
      
      const updatedCategory = await IncomeCategory.findByIdAndUpdate(
        id, 
        { name, description, isActive },
        { new: true, runValidators: true }
      );
      
      if (!updatedCategory) {
        return res.status(404).json({ message: 'קטגוריה לא נמצאה' });
      }
      
      res.status(200).json(updatedCategory);
    } catch (error) {
      console.error('Error updating income category:', error);
      res.status(500).json({ message: 'שגיאה בעדכון קטגוריית הכנסה', error: error.message });
    }
  },

  /**
   * קבלת הוצאות לפי חודש
   */
  getExpensesByMonth: async (req, res) => {
    try {
      const { year, month, location } = req.query;
      
      if (!year || !month) {
        return res.status(400).json({ message: 'חובה לציין שנה וחודש' });
      }
      
      // יצירת טווח תאריכים לחודש המבוקש
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0); // היום האחרון של החודש
      
      // בניית query לפי פרמטרים
      const query = {
        date: { $gte: startDate, $lte: endDate }
      };
      
      // הוספת סינון לפי מיקום אם צוין
      if (location) {
        query.location = location;
      }
      
      const expenses = await Expense.find(query)
        .populate('category', 'name')
        .sort({ date: -1 });
      
      res.status(200).json(expenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      res.status(500).json({ message: 'שגיאה בטעינת הוצאות', error: error.message });
    }
  },

  /**
   * יצירת הוצאה חדשה
   */
  createExpense: async (req, res) => {
    try {
      const { amount, description, date, category, location, paymentMethod, isRecurring, notes } = req.body;
      
      // הוספת שם של המשתמש שיצר את ההוצאה
      const createdBy = req.user ? req.user.id : null;
      
      // טיפול בקובץ קבלה אם יש
      let receipt = null;
      if (req.file) {
        receipt = `/uploads/expenses/${req.file.filename}`;
      }
      
      const newExpense = await Expense.create({
        amount,
        description,
        date: new Date(date),
        category,
        location,
        paymentMethod,
        isRecurring,
        receipt,
        notes,
        createdBy
      });
      
      // עדכון יתרה בסיכום הפיננסי
      await updateFinancialSummary(paymentMethod, -amount);
      
      res.status(201).json(newExpense);
    } catch (error) {
      console.error('Error creating expense:', error);
      res.status(500).json({ message: 'שגיאה ביצירת הוצאה', error: error.message });
    }
  },

  /**
   * עדכון הוצאה קיימת
   */
  updateExpense: async (req, res) => {
    try {
      const { id } = req.params;
      const { amount, description, date, category, location, paymentMethod, isRecurring, notes } = req.body;
      
      // טיפול בקובץ קבלה אם יש
      let updateData = {
        amount,
        description,
        date: new Date(date),
        category,
        location,
        paymentMethod,
        isRecurring,
        notes
      };
      
      if (req.file) {
        updateData.receipt = `/uploads/expenses/${req.file.filename}`;
        
        // מחיקת הקובץ הקודם אם קיים
        const oldExpense = await Expense.findById(id);
        if (oldExpense && oldExpense.receipt) {
          const oldFilePath = path.join(__dirname, '..', oldExpense.receipt);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
      }
      
      // עדכון השפעה כספית במקרה של שינוי בסכום או אמצעי תשלום
      const oldExpense = await Expense.findById(id);
      if (oldExpense) {
        // ביטול ההוצאה הקודמת (הוספת הסכום חזרה)
        await updateFinancialSummary(oldExpense.paymentMethod, oldExpense.amount);
        
        // ניכוי ההוצאה החדשה
        await updateFinancialSummary(paymentMethod, -amount);
      }
      
      const updatedExpense = await Expense.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('category', 'name');
      
      if (!updatedExpense) {
        return res.status(404).json({ message: 'הוצאה לא נמצאה' });
      }
      
      res.status(200).json(updatedExpense);
    } catch (error) {
      console.error('Error updating expense:', error);
      res.status(500).json({ message: 'שגיאה בעדכון הוצאה', error: error.message });
    }
  },

  /**
   * מחיקת הוצאה
   */
  deleteExpense: async (req, res) => {
    try {
      const { id } = req.params;
      
      const expense = await Expense.findById(id);
      if (!expense) {
        return res.status(404).json({ message: 'הוצאה לא נמצאה' });
      }
      
      // מחיקת קובץ הקבלה אם קיים
      if (expense.receipt) {
        const filePath = path.join(__dirname, '..', expense.receipt);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      // החזרת הסכום לסיכום הפיננסי
      await updateFinancialSummary(expense.paymentMethod, expense.amount);
      
      await Expense.findByIdAndDelete(id);
      
      res.status(200).json({ message: 'הוצאה נמחקה בהצלחה' });
    } catch (error) {
      console.error('Error deleting expense:', error);
      res.status(500).json({ message: 'שגיאה במחיקת הוצאה', error: error.message });
    }
  },

  /**
   * קבלת הכנסות ידניות לפי חודש
   */
  getManualIncomeByMonth: async (req, res) => {
    try {
      const { year, month, location } = req.query;
      
      if (!year || !month) {
        return res.status(400).json({ message: 'חובה לציין שנה וחודש' });
      }
      
      // יצירת טווח תאריכים לחודש המבוקש
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0); // היום האחרון של החודש
      
      // בניית query לפי פרמטרים
      const query = {
        date: { $gte: startDate, $lte: endDate }
      };
      
      // הוספת סינון לפי מיקום אם צוין
      if (location) {
        query.location = location;
      }
      
      const manualIncomes = await ManualIncome.find(query)
        .populate('category', 'name')
        .sort({ date: -1 });
      
      res.status(200).json(manualIncomes);
    } catch (error) {
      console.error('Error fetching manual incomes:', error);
      res.status(500).json({ message: 'שגיאה בטעינת הכנסות ידניות', error: error.message });
    }
  },

  /**
   * קבלת הכנסות מהזמנות לפי חודש
   */
  getBookingIncomeByMonth: async (req, res) => {
    try {
      const { year, month, location } = req.query;
      
      if (!year || !month) {
        return res.status(400).json({ message: 'חובה לציין שנה וחודש' });
      }
      
      // יצירת טווח תאריכים לחודש המבוקש
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0); // היום האחרון של החודש
      
      // בניית query לפי פרמטרים - הזמנות ששולמו ולא באשראי
      const query = {
        // הזמנה רלוונטית אם תאריך ה-checkin בחודש המבוקש
        checkIn: { $gte: startDate, $lte: endDate },
        // לא כולל אשראי בסוגי התשלום
        paymentStatus: { 
          $nin: ['unpaid', 'credit_or_yehuda', 'credit_rothschild'] 
        }
      };
      
      // הוספת סינון לפי מיקום אם צוין
      if (location) {
        query.location = location;
      }
      
      const bookings = await Booking.find(query)
        .select('firstName lastName checkIn checkOut price paymentStatus paymentAmount')
        .sort({ checkIn: 1 });
      
      res.status(200).json(bookings);
    } catch (error) {
      console.error('Error fetching booking incomes:', error);
      res.status(500).json({ message: 'שגיאה בטעינת הכנסות מהזמנות', error: error.message });
    }
  },

  /**
   * יצירת הכנסה ידנית חדשה
   */
  createManualIncome: async (req, res) => {
    try {
      const { amount, description, date, category, location, paymentMethod, isRecurring, notes } = req.body;
      
      // הוספת שם של המשתמש שיצר את ההכנסה
      const createdBy = req.user ? req.user.id : null;
      
      // טיפול בקובץ קבלה אם יש
      let receipt = null;
      if (req.file) {
        receipt = `/uploads/incomes/${req.file.filename}`;
      }
      
      const newIncome = await ManualIncome.create({
        amount,
        description,
        date: new Date(date),
        category,
        location,
        paymentMethod,
        isRecurring,
        receipt,
        notes,
        createdBy
      });
      
      // עדכון יתרה בסיכום הפיננסי
      await updateFinancialSummary(paymentMethod, amount);
      
      res.status(201).json(newIncome);
    } catch (error) {
      console.error('Error creating manual income:', error);
      res.status(500).json({ message: 'שגיאה ביצירת הכנסה ידנית', error: error.message });
    }
  },

  /**
   * עדכון הכנסה ידנית קיימת
   */
  updateManualIncome: async (req, res) => {
    try {
      const { id } = req.params;
      const { amount, description, date, category, location, paymentMethod, isRecurring, notes } = req.body;
      
      // טיפול בקובץ קבלה אם יש
      let updateData = {
        amount,
        description,
        date: new Date(date),
        category,
        location,
        paymentMethod,
        isRecurring,
        notes
      };
      
      if (req.file) {
        updateData.receipt = `/uploads/incomes/${req.file.filename}`;
        
        // מחיקת הקובץ הקודם אם קיים
        const oldIncome = await ManualIncome.findById(id);
        if (oldIncome && oldIncome.receipt) {
          const oldFilePath = path.join(__dirname, '..', oldIncome.receipt);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
      }
      
      // עדכון השפעה כספית במקרה של שינוי בסכום או אמצעי תשלום
      const oldIncome = await ManualIncome.findById(id);
      if (oldIncome) {
        // ביטול ההכנסה הקודמת (הורדת הסכום)
        await updateFinancialSummary(oldIncome.paymentMethod, -oldIncome.amount);
        
        // הוספת ההכנסה החדשה
        await updateFinancialSummary(paymentMethod, amount);
      }
      
      const updatedIncome = await ManualIncome.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('category', 'name');
      
      if (!updatedIncome) {
        return res.status(404).json({ message: 'הכנסה לא נמצאה' });
      }
      
      res.status(200).json(updatedIncome);
    } catch (error) {
      console.error('Error updating manual income:', error);
      res.status(500).json({ message: 'שגיאה בעדכון הכנסה ידנית', error: error.message });
    }
  },

  /**
   * מחיקת הכנסה ידנית
   */
  deleteManualIncome: async (req, res) => {
    try {
      const { id } = req.params;
      
      const income = await ManualIncome.findById(id);
      if (!income) {
        return res.status(404).json({ message: 'הכנסה לא נמצאה' });
      }
      
      // מחיקת קובץ הקבלה אם קיים
      if (income.receipt) {
        const filePath = path.join(__dirname, '..', income.receipt);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      // הפחתת הסכום מהסיכום הפיננסי
      await updateFinancialSummary(income.paymentMethod, -income.amount);
      
      await ManualIncome.findByIdAndDelete(id);
      
      res.status(200).json({ message: 'הכנסה נמחקה בהצלחה' });
    } catch (error) {
      console.error('Error deleting manual income:', error);
      res.status(500).json({ message: 'שגיאה במחיקת הכנסה ידנית', error: error.message });
    }
  },

  /**
   * קבלת נתוני סיכום פיננסי
   */
  getFinancialSummary: async (req, res) => {
    try {
      const summaries = await FinancialSummary.find().sort({ paymentMethod: 1 });
      
      // חישוב סיכום כולל
      let totalBalance = 0;
      summaries.forEach(item => {
        totalBalance += item.currentBalance;
      });
      
      res.status(200).json({
        summaries,
        totalBalance
      });
    } catch (error) {
      console.error('Error fetching financial summary:', error);
      res.status(500).json({ message: 'שגיאה בטעינת סיכום פיננסי', error: error.message });
    }
  },

  /**
   * עדכון יתרה התחלתית של אמצעי תשלום
   */
  updateInitialBalance: async (req, res) => {
    try {
      const { paymentMethod, initialBalance } = req.body;
      
      if (!paymentMethod) {
        return res.status(400).json({ message: 'חובה לציין אמצעי תשלום' });
      }
      
      // בדיקה אם יש כבר רשומה לאמצעי תשלום זה
      let summary = await FinancialSummary.findOne({ paymentMethod });
      
      if (summary) {
        // עדכון היתרה הנוכחית בהתאם לשינוי ביתרה ההתחלתית
        const difference = initialBalance - summary.initialBalance;
        summary.initialBalance = initialBalance;
        summary.currentBalance += difference;
        summary.lastUpdated = new Date();
        
        await summary.save();
      } else {
        // יצירת רשומה חדשה
        summary = await FinancialSummary.create({
          paymentMethod,
          initialBalance,
          currentBalance: initialBalance,
          lastUpdated: new Date()
        });
      }
      
      res.status(200).json(summary);
    } catch (error) {
      console.error('Error updating initial balance:', error);
      res.status(500).json({ message: 'שגיאה בעדכון יתרה התחלתית', error: error.message });
    }
  },

  /**
   * סיכום חודשי - הכנסות והוצאות
   */
  getMonthlySummary: async (req, res) => {
    try {
      const { year, month, location } = req.query;
      
      if (!year || !month) {
        return res.status(400).json({ message: 'חובה לציין שנה וחודש' });
      }
      
      // יצירת טווח תאריכים לחודש המבוקש
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0); // היום האחרון של החודש
      
      // בניית query בסיסי
      const timeQuery = {
        date: { $gte: startDate, $lte: endDate }
      };
      
      const bookingTimeQuery = {
        checkIn: { $gte: startDate, $lte: endDate }
      };
      
      // הוספת סינון לפי מיקום אם צוין
      if (location) {
        timeQuery.location = location;
        bookingTimeQuery.location = location;
      }
      
      // קבלת נתוני הוצאות
      const expensesQuery = { ...timeQuery };
      const expenses = await Expense.find(expensesQuery);
      
      // קבלת נתוני הכנסות ידניות
      const manualIncomesQuery = { ...timeQuery };
      const manualIncomes = await ManualIncome.find(manualIncomesQuery);
      
      // קבלת נתוני הכנסות מהזמנות
      const bookingIncomesQuery = {
        ...bookingTimeQuery,
        paymentStatus: { 
          $nin: ['unpaid', 'credit_or_yehuda', 'credit_rothschild'] 
        }
      };
      const bookingIncomes = await Booking.find(bookingIncomesQuery);
      
      // חישוב סיכומים
      let totalExpenses = 0;
      let totalManualIncomes = 0;
      let totalBookingIncomes = 0;
      let expensesByCategory = {};
      let incomesByCategory = {};
      let expensesByPaymentMethod = {};
      let incomesByPaymentMethod = {};
      
      // חישוב הוצאות
      expenses.forEach(expense => {
        totalExpenses += expense.amount;
        
        // סיכום לפי קטגוריה
        const categoryName = expense.category ? expense.category.toString() : 'אחר';
        if (!expensesByCategory[categoryName]) {
          expensesByCategory[categoryName] = 0;
        }
        expensesByCategory[categoryName] += expense.amount;
        
        // סיכום לפי אמצעי תשלום
        if (!expensesByPaymentMethod[expense.paymentMethod]) {
          expensesByPaymentMethod[expense.paymentMethod] = 0;
        }
        expensesByPaymentMethod[expense.paymentMethod] += expense.amount;
      });
      
      // חישוב הכנסות ידניות
      manualIncomes.forEach(income => {
        totalManualIncomes += income.amount;
        
        // סיכום לפי קטגוריה
        const categoryName = income.category ? income.category.toString() : 'אחר';
        if (!incomesByCategory[categoryName]) {
          incomesByCategory[categoryName] = 0;
        }
        incomesByCategory[categoryName] += income.amount;
        
        // סיכום לפי אמצעי תשלום
        if (!incomesByPaymentMethod[income.paymentMethod]) {
          incomesByPaymentMethod[income.paymentMethod] = 0;
        }
        incomesByPaymentMethod[income.paymentMethod] += income.amount;
      });
      
      // חישוב הכנסות מהזמנות
      bookingIncomes.forEach(booking => {
        totalBookingIncomes += booking.paymentAmount;
        
        // סיכום לפי אמצעי תשלום
        if (!incomesByPaymentMethod[booking.paymentStatus]) {
          incomesByPaymentMethod[booking.paymentStatus] = 0;
        }
        incomesByPaymentMethod[booking.paymentStatus] += booking.paymentAmount;
      });
      
      // חישוב סיכומים
      const totalIncomes = totalManualIncomes + totalBookingIncomes;
      const netIncome = totalIncomes - totalExpenses;
      
      // הכנת תשובה
      const response = {
        summary: {
          totalExpenses,
          totalManualIncomes,
          totalBookingIncomes,
          totalIncomes,
          netIncome
        },
        expensesByCategory,
        incomesByCategory,
        expensesByPaymentMethod,
        incomesByPaymentMethod
      };
      
      res.status(200).json(response);
    } catch (error) {
      console.error('Error generating monthly summary:', error);
      res.status(500).json({ message: 'שגיאה בהכנת סיכום חודשי', error: error.message });
    }
  }
};

/**
 * פונקציה לעדכון הסיכום הפיננסי בעקבות שינויים בהכנסות/הוצאות
 * @param {string} paymentMethod - אמצעי התשלום
 * @param {number} amount - סכום השינוי (חיובי להכנסה, שלילי להוצאה)
 */
const updateFinancialSummary = async (paymentMethod, amount) => {
  try {
    // בדיקה אם יש כבר רשומה לאמצעי תשלום זה
    let summary = await FinancialSummary.findOne({ paymentMethod });
    
    if (summary) {
      // עדכון היתרה הנוכחית
      summary.currentBalance += amount;
      summary.lastUpdated = new Date();
      
      await summary.save();
    } else {
      // יצירת רשומה חדשה
      summary = await FinancialSummary.create({
        paymentMethod,
        initialBalance: 0,
        currentBalance: amount,
        lastUpdated: new Date()
      });
    }
    
    return summary;
  } catch (error) {
    console.error('Error updating financial summary:', error);
    throw error;
  }
};

module.exports = financialController; 