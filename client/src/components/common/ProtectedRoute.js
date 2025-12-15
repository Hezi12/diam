import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Box, CircularProgress } from '@mui/material';

/**
 * רכיב להגנה על נתיבים שדורשים אימות
 * 
 * רכיב זה בודק האם המשתמש מחובר למערכת,
 * ואם לא, מעביר אותו לדף ההתחברות
 * 
 * חשוב: לא נטען שום תוכן עד שהאימות מאומת
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // בזמן טעינה - לא מציגים כלום, רק מסך טעינה
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          width: '100%',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // אם המשתמש לא מחובר - מעביר מיד לדף ההתחברות
  // חשוב: לא מציגים את ה-children כלל!
  if (!isAuthenticated) {
    // שמירת הנתיב המקורי כדי לחזור אליו לאחר ההתחברות
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // רק אם המשתמש מחובר - מציגים את התוכן
  return children;
};

export default ProtectedRoute;
