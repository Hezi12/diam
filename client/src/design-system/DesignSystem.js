import React from 'react';
import { Box, Typography, Container, Divider, Paper, Button, Grid } from '@mui/material';
import { Link } from 'react-router-dom';
import { 
  Palette as PaletteIcon, 
  Style as StyleIcon, 
  ViewModule as ViewModuleIcon,
  CalendarToday as CalendarTodayIcon,
  Book as BookIcon,
  Code as CodeIcon
} from '@mui/icons-material';

/**
 * DesignSystem - עמוד ראשי למערכת העיצוב
 * 
 * קובץ זה הוא המבוא למערכת העיצוב של Diam ומכיל:
 * 1. הנחיות כלליות לסגנון האחיד
 * 2. הפניות לדוגמאות של יישום העיצוב
 * 3. קישורים לקבצי העיצוב השונים
 * 
 * הערה: מערכת זו נועדה לשמש כמקור אמת לכל האתר ולהבטיח אחידות בעיצוב
 */

const DesignSystem = () => {
  // הגדרת סגנון עיצוב
  const style = {
    name: "קלאסי ונקי - עסקי",
    colors: {
      airport: {
        main: '#0071e3',
        bgLight: 'rgba(0, 113, 227, 0.08)'
      },
      rothschild: {
        main: '#4570e5',
        bgLight: 'rgba(69, 112, 229, 0.08)'
      },
      accent: {
        green: '#06a271',
        red: '#e34a6f',
        orange: '#f7971e',
      }
    },
    card: {
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      p: 2.5,
    },
    button: {
      borderRadius: '4px',
      textTransform: 'none',
    },
    table: {
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
    dialog: {
      borderRadius: '8px',
    }
  };

  return (
    <Container maxWidth="lg" sx={{ my: 5 }}>
      <Box sx={{ 
        mb: 4,
        display: 'flex',
        alignItems: 'center'
      }}>
        <Box 
          sx={{ 
            mr: 3.5, 
            bgcolor: style.colors.airport.bgLight, 
            p: 1.5, 
            borderRadius: style.card.borderRadius.replace('px', '') / 1.2 + 'px',
            display: 'flex'
          }}
        >
          <PaletteIcon sx={{ color: style.colors.airport.main, fontSize: 28 }} />
        </Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 500, color: 'text.primary' }}>
          מערכת העיצוב Diam
        </Typography>
      </Box>

      <Paper sx={{ 
        ...style.card, 
        mb: 4, 
        p: 3,
        borderTop: `3px solid ${style.colors.airport.main}`
      }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 500 }}>
          מטרת מערכת העיצוב
        </Typography>
        
        <Typography paragraph>
          מערכת העיצוב של Diam נועדה ליצור שפה עיצובית אחידה בכל האתר ובכל הממשקים. 
          המערכת מגדירה את הצבעים, הטיפוגרפיה, הרכיבים והסגנונות שישמשו בכל היישומים.
        </Typography>
        
        <Typography paragraph>
          הקבצים והדוגמאות בתיקייה זו משמשים כמקור אמת וכתיעוד חי של המערכת, וכל פיתוח 
          חדש צריך להתבסס על העקרונות והרכיבים המוגדרים כאן.
        </Typography>
      </Paper>

      <Typography variant="h5" sx={{ mb: 3, fontWeight: 500 }}>
        קבצי הדוגמה העיקריים
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ 
            ...style.card, 
            height: '100%',
            borderTop: `3px solid ${style.colors.accent.green}`
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <StyleIcon sx={{ color: style.colors.accent.green, mr: 1.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                הנחיות עיצוב
              </Typography>
            </Box>
            <Divider sx={{ my: 1.5 }} />
            <Typography paragraph color="text.secondary" sx={{ mb: 3 }}>
              מסמך מפורט המגדיר את כל העקרונות, הצבעים, גדלי טקסט, מרווחים 
              וסגנונות הרכיבים השונים במערכת.
            </Typography>
            <Button 
              component={Link} 
              to="/design-guidelines"
              variant="outlined"
              sx={{ 
                color: style.colors.accent.green,
                borderColor: style.colors.accent.green,
                '&:hover': { bgcolor: `rgba(6, 162, 113, 0.08)` },
                ...style.button
              }}
            >
              צפה בהנחיות
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ 
            ...style.card, 
            height: '100%',
            borderTop: `3px solid ${style.colors.airport.main}`
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ViewModuleIcon sx={{ color: style.colors.airport.main, mr: 1.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                דוגמאות רכיבים
              </Typography>
            </Box>
            <Divider sx={{ my: 1.5 }} />
            <Typography paragraph color="text.secondary" sx={{ mb: 3 }}>
              סט מלא של רכיבים בסיסיים כולל כפתורים, שדות קלט, טבלאות, 
              דיאלוגים ועוד עם הסברים ודוגמאות קוד.
            </Typography>
            <Button 
              component={Link} 
              to="/design-examples"
              variant="outlined"
              sx={{ 
                color: style.colors.airport.main,
                borderColor: style.colors.airport.main,
                '&:hover': { bgcolor: style.colors.airport.bgLight },
                ...style.button
              }}
            >
              צפה בדוגמאות
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ 
            ...style.card, 
            height: '100%',
            borderTop: `3px solid ${style.colors.rothschild.main}`
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CalendarTodayIcon sx={{ color: style.colors.rothschild.main, mr: 1.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                יומן הזמנות
              </Typography>
            </Box>
            <Divider sx={{ my: 1.5 }} />
            <Typography paragraph color="text.secondary" sx={{ mb: 3 }}>
              דוגמה מלאה של עמוד יומן הזמנות עם יישום של כל העקרונות העיצוביים
              עבור רכיב מורכב עם אינטראקציות.
            </Typography>
            <Button 
              component={Link} 
              to="/booking-calendar-examples"
              variant="outlined"
              sx={{ 
                color: style.colors.rothschild.main,
                borderColor: style.colors.rothschild.main,
                '&:hover': { bgcolor: style.colors.rothschild.bgLight },
                ...style.button
              }}
            >
              צפה בדוגמה
            </Button>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 5, mb: 2 }}>
        <Divider />
      </Box>

      <Typography variant="h6" sx={{ mb: 3, fontWeight: 500, color: 'text.secondary' }}>
        פרטי מערכת העיצוב
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ 
            p: 2, 
            borderRadius: style.card.borderRadius,
            boxShadow: style.card.boxShadow,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <CodeIcon sx={{ color: style.colors.airport.main, fontSize: 32, mb: 1 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              מיקום קבצים
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              /client/src/design-system
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ 
            p: 2, 
            borderRadius: style.card.borderRadius,
            boxShadow: style.card.boxShadow,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <BookIcon sx={{ color: style.colors.airport.main, fontSize: 32, mb: 1 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              גרסת מערכת
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              v1.0.0
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DesignSystem; 