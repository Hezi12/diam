import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Switch, 
  FormControlLabel,
  Fade
} from '@mui/material';
import { FilterList as FilterIcon } from '@mui/icons-material';
import { useFilter } from '../../contexts/FilterContext';

/**
 * קומפוננט סינון מוסתר - מופעל בקומבינציה מיוחדת בלבד
 * הקומבינציה: לחיצה על כותרת "הגדרות המערכת" 7 פעמים תוך 3 שניות
 */
const HiddenFilterToggle = () => {
  const { isFilterActive, toggleFilter } = useFilter();
  const [isVisible, setIsVisible] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  // איפוס מונה הלחיצות כל 3 שניות
  useEffect(() => {
    const timer = setTimeout(() => {
      if (clickCount > 0) {
        setClickCount(0);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [clickCount]);

  // פונקציה להתמודדות עם לחיצות על כותרת ההגדרות
  const handleTitleClick = () => {
    const currentTime = Date.now();
    
    // אם עברו יותר מ-3 שניות מהלחיצה הקודמת, איפוס המונה
    if (currentTime - lastClickTime > 3000) {
      setClickCount(1);
    } else {
      setClickCount(prev => prev + 1);
    }
    
    setLastClickTime(currentTime);

    // אם הגענו ל-7 לחיצות תוך 3 שניות - הצג את הקומפוננט
    if (clickCount + 1 >= 7) {
      setIsVisible(true);
      setClickCount(0);
      
      // הסתר אוטומטית אחרי 30 שניות
      setTimeout(() => {
        setIsVisible(false);
      }, 30000);
    }
  };

  // אם הקומפוננט לא גלוי, החזר רק את הפונקציה לחיצה על הכותרת
  if (!isVisible) {
    return {
      handleTitleClick,
      isHidden: true
    };
  }

  return {
    handleTitleClick,
    isHidden: false,
    component: (
      <Fade in={isVisible} timeout={300}>
        <Box
          sx={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999,
            bgcolor: 'rgba(255, 193, 7, 0.95)',
            color: '#333',
            p: 2,
            borderRadius: 2,
            minWidth: 200,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            border: '2px solid #ff9800'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <FilterIcon sx={{ fontSize: 18, mr: 1 }} />
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              מצב סינון
            </Typography>
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={isFilterActive}
                onChange={toggleFilter}
                size="small"
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#fff',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#ff9800',
                  },
                }}
              />
            }
            label={
              <Typography variant="body2">
                {isFilterActive ? 'פעיל' : 'כבוי'}
              </Typography>
            }
            sx={{ m: 0 }}
          />

          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block', 
              mt: 1, 
              fontSize: '0.7rem',
              opacity: 0.8
            }}
          >
            נעלם תוך 30 שניות
          </Typography>
        </Box>
      </Fade>
    )
  };
};

export default HiddenFilterToggle;
