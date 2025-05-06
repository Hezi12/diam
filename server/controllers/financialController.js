const Expense = require('../models/Expense');
const ManualIncome = require('../models/ManualIncome');
const ExpenseCategory = require('../models/ExpenseCategory');
const IncomeCategory = require('../models/IncomeCategory');
const FinancialSummary = require('../models/FinancialSummary');
const Booking = require('../models/Booking');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const capitalController = require('./capitalController');

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
   * מחיקת קטגוריית הוצאה
   */
  deleteExpenseCategory: async (req, res) => {
    try {
      const { id } = req.params;
      
      // בדיקה האם יש הוצאות המשויכות לקטגוריה זו
      const expensesWithCategory = await Expense.countDocuments({ category: id });
      
      if (expensesWithCategory > 0) {
        // במקום למחוק, מסמנים את הקטגוריה כלא פעילה
        const updatedCategory = await ExpenseCategory.findByIdAndUpdate(
          id, 
          { isActive: false },
          { new: true }
        );
        
        if (!updatedCategory) {
          return res.status(404).json({ message: 'קטגוריה לא נמצאה' });
        }
        
        return res.status(200).json({ 
          message: 'הקטגוריה סומנה כלא פעילה כי יש הוצאות משויכות אליה',
          category: updatedCategory 
        });
      }
      
      // אם אין הוצאות משויכות, ניתן למחוק את הקטגוריה
      const deletedCategory = await ExpenseCategory.findByIdAndDelete(id);
      
      if (!deletedCategory) {
        return res.status(404).json({ message: 'קטגוריה לא נמצאה' });
      }
      
      res.status(200).json({ message: 'קטגוריית ההוצאה נמחקה בהצלחה' });
    } catch (error) {
      console.error('Error deleting expense category:', error);
      res.status(500).json({ message: 'שגיאה במחיקת קטגוריית הוצאה', error: error.message });
    }
  },

  /**
   * קבלת קטגוריית הוצאה לפי מזהה
   */
  getExpenseCategoryById: async (req, res) => {
    try {
      const { id } = req.params;
      const category = await ExpenseCategory.findById(id);
      
      if (!category) {
        return res.status(404).json({ message: 'קטגוריה לא נמצאה' });
      }
      
      res.status(200).json(category);
    } catch (error) {
      console.error('Error fetching expense category:', error);
      res.status(500).json({ message: 'שגיאה בטעינת קטגוריית הוצאה', error: error.message });
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
      
      // עדכון נתוני הון אוטומטי
      await capitalController.updateCapitalOnNewExpense(paymentMethod, amount);
      
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
      
      // קבלת ההוצאה הקודמת לפני העדכון
      const oldExpense = await Expense.findById(id);
      if (!oldExpense) {
        return res.status(404).json({ message: 'הוצאה לא נמצאה' });
      }
      
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
        
        // מחיקת קובץ הקבלה הישן אם קיים
        if (oldExpense.receipt) {
          const oldReceiptPath = path.join(__dirname, '..', oldExpense.receipt);
          try {
            if (fs.existsSync(oldReceiptPath)) {
              fs.unlinkSync(oldReceiptPath);
            }
          } catch (err) {
            console.error('שגיאה במחיקת קובץ קבלה ישן:', err);
          }
        }
      }
      
      // עדכון יתרה בסיכום הפיננסי - ביטול ההוצאה הישנה
      if (oldExpense.paymentMethod && oldExpense.amount) {
        await updateFinancialSummary(oldExpense.paymentMethod, oldExpense.amount);
      }
      
      // עדכון ההוצאה במסד הנתונים
      const updatedExpense = await Expense.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('category', 'name');
      
      // עדכון יתרה בסיכום הפיננסי - הוספת ההוצאה החדשה
      await updateFinancialSummary(paymentMethod, -amount);
      
      // עדכון נתוני הון עם ההוצאה החדשה
      await capitalController.updateCapitalOnNewExpense(paymentMethod, amount);
      
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
      
      // קבלת ההוצאה לפני המחיקה
      const expense = await Expense.findById(id);
      
      if (!expense) {
        return res.status(404).json({ message: 'הוצאה לא נמצאה' });
      }
      
      // מחיקת קובץ הקבלה אם קיים
      if (expense.receipt) {
        const receiptPath = path.join(__dirname, '..', expense.receipt);
        try {
          if (fs.existsSync(receiptPath)) {
            fs.unlinkSync(receiptPath);
          }
        } catch (err) {
          console.error('שגיאה במחיקת קובץ קבלה:', err);
        }
      }
      
      // מחיקת ההוצאה
      await Expense.findByIdAndDelete(id);
      
      // עדכון יתרה בסיכום הפיננסי
      if (expense.paymentMethod && expense.amount) {
        await updateFinancialSummary(expense.paymentMethod, expense.amount);
      }
      
      // עדכון נתוני הון
      await capitalController.revertCapitalOnExpenseDelete(expense.paymentMethod, expense.amount);
      
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
  },

  /**
   * קבלת הוצאה לפי מזהה
   */
  getExpenseById: async (req, res) => {
    try {
      const { id } = req.params;
      const expense = await Expense.findById(id);
      
      if (!expense) {
        return res.status(404).json({ message: 'הוצאה לא נמצאה' });
      }
      
      res.status(200).json(expense);
    } catch (error) {
      console.error('Error fetching expense by ID:', error);
      res.status(500).json({ message: 'שגיאה בטעינת הוצאה', error: error.message });
    }
  },

  /**
   * קבלת הכנסות ידניות לפי חודש
   */
  getManualIncomes: async (req, res) => {
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
   * סיכום פיננסי חודשי מפורט
   */
  getMonthlyFinancialSummary: async (req, res) => {
    try {
      const { year, month } = req.params;
      const { location } = req.query;
      
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
      const expenses = await Expense.find(timeQuery);
      
      // קבלת נתוני הכנסות ידניות
      const manualIncomes = await ManualIncome.find(timeQuery);
      
      // קבלת נתוני הכנסות מהזמנות
      const bookingIncomes = await Booking.find({
        ...bookingTimeQuery,
        paymentStatus: { 
          $nin: ['unpaid', 'credit_or_yehuda', 'credit_rothschild'] 
        }
      });
      
      // חישוב סיכומים
      let totalExpenses = 0;
      let totalManualIncomes = 0;
      let totalBookingIncomes = 0;
      let expensesByCategory = {};
      let expensesByPaymentMethod = {};
      let incomesByPaymentMethod = {};
      
      // סיכום הוצאות
      expenses.forEach(expense => {
        totalExpenses += expense.amount;
        
        // הוצאות לפי קטגוריה
        const categoryName = expense.category ? expense.category.toString() : 'אחר';
        expensesByCategory[categoryName] = (expensesByCategory[categoryName] || 0) + expense.amount;
        
        // הוצאות לפי אמצעי תשלום
        expensesByPaymentMethod[expense.paymentMethod] = 
          (expensesByPaymentMethod[expense.paymentMethod] || 0) + expense.amount;
      });
      
      // סיכום הכנסות ידניות
      manualIncomes.forEach(income => {
        totalManualIncomes += income.amount;
        
        // הכנסות לפי אמצעי תשלום
        incomesByPaymentMethod[income.paymentMethod] = 
          (incomesByPaymentMethod[income.paymentMethod] || 0) + income.amount;
      });
      
      // סיכום הכנסות מהזמנות
      bookingIncomes.forEach(booking => {
        const amount = booking.paymentAmount || 0;
        totalBookingIncomes += amount;
        
        // הכנסות לפי אמצעי תשלום
        const paymentMethod = booking.paymentStatus;
        incomesByPaymentMethod[paymentMethod] = 
          (incomesByPaymentMethod[paymentMethod] || 0) + amount;
      });
      
      // חישוב סך הכנסות ורווח נקי
      const totalIncomes = totalManualIncomes + totalBookingIncomes;
      const netProfit = totalIncomes - totalExpenses;
      
      res.status(200).json({
        month,
        year,
        location: location || 'all',
        summary: {
          totalExpenses,
          totalIncomes,
          totalManualIncomes,
          totalBookingIncomes,
          netProfit
        },
        expensesByCategory,
        expensesByPaymentMethod,
        incomesByPaymentMethod
      });
    } catch (error) {
      console.error('Error generating monthly financial summary:', error);
      res.status(500).json({ message: 'שגיאה בהכנת סיכום פיננסי חודשי', error: error.message });
    }
  },
  
  /**
   * סיכום פיננסי שנתי
   */
  getYearlyFinancialSummary: async (req, res) => {
    try {
      const { year } = req.params;
      const { location } = req.query;
      
      if (!year) {
        return res.status(400).json({ message: 'חובה לציין שנה' });
      }
      
      // יצירת טווח תאריכים לשנה המבוקשת
      const startDate = new Date(parseInt(year), 0, 1); // 1 בינואר
      const endDate = new Date(parseInt(year), 11, 31); // 31 בדצמבר
      
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
      const expenses = await Expense.find(timeQuery);
      
      // קבלת נתוני הכנסות ידניות
      const manualIncomes = await ManualIncome.find(timeQuery);
      
      // קבלת נתוני הכנסות מהזמנות
      const bookingIncomes = await Booking.find({
        ...bookingTimeQuery,
        paymentStatus: { 
          $nin: ['unpaid', 'credit_or_yehuda', 'credit_rothschild'] 
        }
      });
      
      // חישוב סיכומים לפי חודשים
      const months = Array(12).fill(0).map((_, i) => i + 1);
      const monthlySummary = {};
      
      months.forEach(month => {
        monthlySummary[month] = {
          expenses: 0,
          manualIncomes: 0,
          bookingIncomes: 0,
          totalIncomes: 0,
          netProfit: 0
        };
      });
      
      // סיכום הוצאות לפי חודשים
      expenses.forEach(expense => {
        const month = expense.date.getMonth() + 1;
        monthlySummary[month].expenses += expense.amount;
      });
      
      // סיכום הכנסות ידניות לפי חודשים
      manualIncomes.forEach(income => {
        const month = income.date.getMonth() + 1;
        monthlySummary[month].manualIncomes += income.amount;
      });
      
      // סיכום הכנסות מהזמנות לפי חודשים
      bookingIncomes.forEach(booking => {
        const month = booking.checkIn.getMonth() + 1;
        const amount = booking.paymentAmount || 0;
        monthlySummary[month].bookingIncomes += amount;
      });
      
      // חישוב סיכומים סופיים לכל חודש
      let totalYearlyExpenses = 0;
      let totalYearlyIncomes = 0;
      
      months.forEach(month => {
        const summary = monthlySummary[month];
        summary.totalIncomes = summary.manualIncomes + summary.bookingIncomes;
        summary.netProfit = summary.totalIncomes - summary.expenses;
        
        totalYearlyExpenses += summary.expenses;
        totalYearlyIncomes += summary.totalIncomes;
      });
      
      const yearlyNetProfit = totalYearlyIncomes - totalYearlyExpenses;
      
      res.status(200).json({
        year,
        location: location || 'all',
        totalYearlyExpenses,
        totalYearlyIncomes,
        yearlyNetProfit,
        monthlySummary
      });
    } catch (error) {
      console.error('Error generating yearly financial summary:', error);
      res.status(500).json({ message: 'שגיאה בהכנת סיכום פיננסי שנתי', error: error.message });
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