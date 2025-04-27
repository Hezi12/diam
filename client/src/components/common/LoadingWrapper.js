import React from 'react';
import { Box, CircularProgress, Typography, Paper } from '@mui/material';

/**
 * רכיב משותף לעטיפת תוכן עם מצב טעינה
 * 
 * @param {Object} props - מאפייני הרכיב
 * @param {boolean} props.loading - האם התוכן בטעינה
 * @param {React.ReactNode} props.children - התוכן שיוצג כאשר הטעינה הסתיימה
 * @param {string} [props.loadingText] - טקסט שיוצג במהלך טעינה (אופציונלי)
 * @param {boolean} [props.error] - האם יש שגיאה
 * @param {string} [props.errorMessage] - הודעת שגיאה (אופציונלי)
 * @param {function} [props.onRetry] - פונקציה שתופעל בלחיצה על כפתור הניסיון מחדש בשגיאה
 * @param {Object} [props.containerProps] - מאפיינים נוספים לקונטיינר
 */
const LoadingWrapper = ({ 
  loading, 
  children, 
  loadingText = 'טוען נתונים...',
  error = false,
  errorMessage = 'אירעה שגיאה בטעינת הנתונים',
  onRetry,
  containerProps = {}
}) => {
  // אם יש שגיאה
  if (error) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          my: 4,
          ...containerProps.sx 
        }}
        {...containerProps}
      >
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            textAlign: 'center', 
            maxWidth: 400, 
            width: '100%',
            borderRadius: 2,
            border: '1px solid rgba(0,0,0,0.08)'
          }}
        >
          <Typography color="error" variant="h6" gutterBottom>
            {errorMessage}
          </Typography>
          
          {onRetry && (
            <Box sx={{ mt: 2 }}>
              <button 
                onClick={onRetry}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                נסה שוב
              </button>
            </Box>
          )}
        </Paper>
      </Box>
    );
  }
  
  // אם בטעינה
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          my: 4,
          ...containerProps.sx 
        }}
        {...containerProps}
      >
        <CircularProgress size={40} thickness={4} />
        {loadingText && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {loadingText}
          </Typography>
        )}
      </Box>
    );
  }
  
  // אם אין שגיאה ולא טוען, מציג את התוכן
  return children;
};

export default LoadingWrapper; 