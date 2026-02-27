import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';

/**
 * רכיב לתפיסת שגיאות רינדור ב-React
 *
 * עוטף רכיבי ילד ותופס שגיאות שמתרחשות במהלך רינדור,
 * מציג הודעת שגיאה ידידותית למשתמש עם אפשרות לנסות שוב.
 *
 * @param {Object} props - מאפייני הרכיב
 * @param {React.ReactNode} props.children - רכיבי הילד שייעטפו
 * @param {React.ReactNode} [props.fallback] - ממשק מותאם אישית להצגה בעת שגיאה
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // אם סופק ממשק מותאם אישית, להציג אותו
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '200px',
            p: 3,
          }}
        >
          <Paper
            elevation={2}
            sx={{
              p: 4,
              textAlign: 'center',
              maxWidth: 500,
              width: '100%',
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" color="error" gutterBottom>
              משהו השתבש
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              אירעה שגיאה בלתי צפויה. אנא נסה שוב.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={this.handleReset}
            >
              נסה שוב
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
