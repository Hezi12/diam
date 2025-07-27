import React from 'react';
import { useFilter } from './FilterContext';
import { Box, CircularProgress } from '@mui/material';
import './FilterContext.css';

/**
 * Wrapper component שמבטיח שהתוכן יוצג רק אחרי שהקונטקסט מוכן
 */
const FilterReadyWrapper = ({ children, showLoader = true }) => {
  const { isReady } = useFilter();

  if (!isReady && showLoader) {
    return (
      <Box 
        className="filter-context-wrapper loading"
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh',
          minHeight: '200px'
        }}
      >
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <div className={`filter-context-wrapper ${isReady ? 'ready' : 'loading'}`}>
      {children}
    </div>
  );
};

export default FilterReadyWrapper;
