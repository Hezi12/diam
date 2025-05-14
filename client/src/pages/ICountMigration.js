import React from 'react';
import { Container, Typography, Box, Paper, Tabs, Tab } from '@mui/material';
import MigrationPanel from '../components/icount/MigrationPanel';

/**
 * דף מיגרציה למערכת iCount
 */
const ICountMigration = () => {
  return (
    <Container maxWidth="lg">
      <Paper elevation={1} sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            מעבר למערכת iCount
          </Typography>
          <Typography variant="body1" color="text.secondary">
            דף זה מיועד לביצוע המעבר ממערכת החשבוניות הפנימית למערכת iCount.
            ניתן להעביר חשבוניות קיימות ולוודא שהמערכת החדשה עובדת כראוי.
          </Typography>
        </Box>
        
        <MigrationPanel />
      </Paper>
    </Container>
  );
};

export default ICountMigration; 