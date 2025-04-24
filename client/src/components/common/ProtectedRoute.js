import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * רכיב להגנה על נתיבים שדורשים אימות
 * 
 * רכיב זה בודק האם המשתמש מחובר למערכת,
 * ואם לא, מעביר אותו לדף ההתחברות
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>טוען...</div>;
  }

  if (!isAuthenticated) {
    // שמירת הנתיב המקורי כדי לחזור אליו לאחר ההתחברות
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
