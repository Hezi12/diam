import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
  Box,
  Tooltip,
  useTheme
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

/**
 * רכיב להצגת רשימת הוצאות בטבלה
 * @param {Array} expenses - מערך של הוצאות להצגה
 * @param {Function} onDelete - פונקציה למחיקת הוצאה
 * @param {Function} onEdit - פונקציה לעריכת הוצאה
 * @param {Array} paymentMethods - אובייקט המכיל מיפוי בין ערכי אמצעי תשלום לתוויות
 */
const ExpensesList = ({ expenses, onDelete, onEdit, paymentMethods }) => {
  const [confirmDialog, setConfirmDialog] = useState({ open: false, id: null });
  const theme = useTheme();

  // מיפוי של ערכי אמצעי תשלום לשמות תצוגה
  const getPaymentMethodName = (method) => {
    const found = paymentMethods.find(m => m.value === method);
    return found ? found.label : method;
  };

  // פתיחת דיאלוג אישור מחיקה
  const handleOpenConfirmDialog = (id) => {
    setConfirmDialog({ open: true, id });
  };

  // סגירת דיאלוג אישור מחיקה
  const handleCloseConfirmDialog = () => {
    setConfirmDialog({ open: false, id: null });
  };

  // אישור מחיקת הוצאה
  const handleConfirmDelete = () => {
    if (confirmDialog.id) {
      onDelete(confirmDialog.id);
      handleCloseConfirmDialog();
    }
  };

  if (!expenses || expenses.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 3 }}>
        <Typography color="text.secondary">אין נתוני הוצאות לחודש זה</Typography>
      </Box>
    );
  }

  return (
    <>
      <TableContainer component={Paper} elevation={0} sx={{ 
        maxHeight: 400, 
        boxShadow: 'none',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        borderRadius: 2
      }}>
        <Table stickyHeader sx={{ minWidth: 650 }} size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>תאריך</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>סכום</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>קטגוריה</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>תיאור</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>אמצעי תשלום</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>פעולות</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense._id} sx={{ '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.03)' } }}>
                <TableCell>
                  {expense.date ? format(new Date(expense.date), 'dd/MM/yyyy', { locale: he }) : '-'}
                </TableCell>
                <TableCell sx={{ fontWeight: 'medium' }}>
                  ₪{expense.amount.toLocaleString()}
                </TableCell>
                <TableCell>{expense.category}</TableCell>
                <TableCell>{expense.description || '-'}</TableCell>
                <TableCell>{getPaymentMethodName(expense.paymentMethod)}</TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                    <Tooltip title="עריכה">
                      <IconButton 
                        size="small" 
                        onClick={() => onEdit(expense)}
                        sx={{ 
                          color: theme.palette.primary.main,
                          '&:hover': { 
                            bgcolor: theme.palette.primary.main
                          }
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="מחיקה">
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenConfirmDialog(expense._id)}
                        sx={{ 
                          color: theme.palette.error.main,
                          '&:hover': { 
                            bgcolor: theme.palette.error.main
                          }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* דיאלוג אישור מחיקה */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCloseConfirmDialog}
      >
        <DialogTitle>אישור מחיקה</DialogTitle>
        <DialogContent>
          <DialogContentText>
            האם אתה בטוח שברצונך למחוק את ההוצאה הזו?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} color="inherit">ביטול</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            מחיקה
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ExpensesList; 