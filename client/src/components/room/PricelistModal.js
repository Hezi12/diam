import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Paper,
  Typography,
  Box,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  Tooltip,
  Switch,
  FormControlLabel,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { STYLE_CONSTANTS } from '../../styles/StyleConstants';

const PricelistModal = ({ open, onClose, rooms, location, onRoomsUpdate }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [editedRooms, setEditedRooms] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // קבלת צבעים לפי מיקום
  const getLocationColors = () => {
    return location === 'airport' 
      ? { main: STYLE_CONSTANTS.colors.airport.main, bgLight: STYLE_CONSTANTS.colors.airport.bgLight }
      : { main: STYLE_CONSTANTS.colors.rothschild.main, bgLight: STYLE_CONSTANTS.colors.rothschild.bgLight };
  };

  const locationColors = getLocationColors();
  const colors = STYLE_CONSTANTS.colors;

  // איפוס הטופס כאשר החלון נפתח
  useEffect(() => {
    if (open) {
      setEditedRooms({});
      setError('');
      setSuccess('');
      setHasChanges(false);
    }
  }, [open]);

  // פונקציה לעדכון מחיר חדר
  const updateRoomPrice = (roomId, field, value) => {
    const numericValue = parseFloat(value) || 0;
    
    setEditedRooms(prev => {
      const newEditedRooms = {
        ...prev,
        [roomId]: {
          ...prev[roomId],
          [field]: numericValue
        }
      };

      // חישוב אוטומטי של מע"מ
      const roomData = newEditedRooms[roomId];
      
      if (field === 'basePrice') {
        // חישוב מחיר כולל מע"מ
        roomData.vatPrice = parseFloat((numericValue * 1.18).toFixed(2));
      } else if (field === 'vatPrice') {
        // חישוב מחיר ללא מע"מ
        roomData.basePrice = parseFloat((numericValue / 1.18).toFixed(2));
      } else if (field === 'fridayPrice') {
        // חישוב מחיר שישי כולל מע"מ
        roomData.fridayVatPrice = parseFloat((numericValue * 1.18).toFixed(2));
      } else if (field === 'fridayVatPrice') {
        // חישוב מחיר שישי ללא מע"מ
        roomData.fridayPrice = parseFloat((numericValue / 1.18).toFixed(2));
      } else if (field === 'saturdayPrice') {
        // חישוב מחיר שבת כולל מע"מ
        roomData.saturdayVatPrice = parseFloat((numericValue * 1.18).toFixed(2));
      } else if (field === 'saturdayVatPrice') {
        // חישוב מחיר שבת ללא מע"מ
        roomData.saturdayPrice = parseFloat((numericValue / 1.18).toFixed(2));
      }

      setHasChanges(true);
      return newEditedRooms;
    });
  };

  // קבלת ערך מחיר (מהטבלה הערוכה או מהנתונים המקוריים)
  const getRoomValue = (room, field) => {
    if (editedRooms[room._id] && editedRooms[room._id][field] !== undefined) {
      return editedRooms[room._id][field];
    }
    return room[field] || 0;
  };

  // פונקציה לשמירת כל השינויים
  const handleSaveAll = async () => {
    if (!hasChanges) {
      onClose();
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // שמירת כל החדרים שנערכו
      const savePromises = Object.keys(editedRooms).map(async (roomId) => {
        const roomData = editedRooms[roomId];
        const response = await axios.put(`/api/rooms/${roomId}`, {
          ...roomData,
          location
        });
        return response.data;
      });

      await Promise.all(savePromises);
      
      setSuccess(`${Object.keys(editedRooms).length} חדרים עודכנו בהצלחה`);
      setHasChanges(false);
      
      // רענון נתוני החדרים
      if (onRoomsUpdate) {
        onRoomsUpdate();
      }
      
      // סגירת החלון אחרי 2 שניות
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err) {
      console.error('שגיאה בשמירת מחירים:', err);
      setError('שגיאה בשמירת המחירים. אנא נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  // פונקציה לאיפוס השינויים
  const handleReset = () => {
    setEditedRooms({});
    setHasChanges(false);
    setError('');
    setSuccess('');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : '16px',
          maxHeight: '90vh',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: locationColors.bgLight,
          color: locationColors.main,
          fontWeight: 600,
          fontSize: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: `2px solid ${locationColors.main}`,
          py: 2
        }}
      >
        מחירון {location === 'airport' ? 'Airport Guest House' : 'רוטשילד'}
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Tooltip title="איפוס שינויים">
          <IconButton
            onClick={handleReset}
            disabled={!hasChanges || loading}
            size="small"
            sx={{ color: locationColors.main }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="סגירה">
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ color: locationColors.main }}
          >
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </DialogTitle>

      <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
        {error && (
          <Alert severity="error" sx={{ m: 2, borderRadius: '10px' }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ m: 2, borderRadius: '10px' }}>
            {success}
          </Alert>
        )}

        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            maxHeight: 'calc(90vh - 200px)',
            overflow: 'auto'
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    bgcolor: locationColors.bgLight,
                    color: locationColors.main,
                    borderBottom: `2px solid ${locationColors.main}`,
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    textAlign: 'right'
                  }}
                >
                  חדר
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    bgcolor: locationColors.bgLight,
                    color: locationColors.main,
                    borderBottom: `2px solid ${locationColors.main}`,
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    textAlign: 'right'
                  }}
                >
                  מחיר בסיס
                  <Typography variant="caption" display="block" sx={{ opacity: 0.7 }}>
                    ללא מע"מ / כולל מע"מ
                  </Typography>
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    bgcolor: locationColors.bgLight,
                    color: locationColors.main,
                    borderBottom: `2px solid ${locationColors.main}`,
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    textAlign: 'right'
                  }}
                >
                  אורח נוסף
                  <Typography variant="caption" display="block" sx={{ opacity: 0.7 }}>
                    ₪ ללילה
                  </Typography>
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    bgcolor: locationColors.bgLight,
                    color: locationColors.main,
                    borderBottom: `2px solid ${locationColors.main}`,
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    textAlign: 'right'
                  }}
                >
                  יום שישי
                  <Typography variant="caption" display="block" sx={{ opacity: 0.7 }}>
                    ללא מע"מ / כולל מע"מ
                  </Typography>
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    bgcolor: locationColors.bgLight,
                    color: locationColors.main,
                    borderBottom: `2px solid ${locationColors.main}`,
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    textAlign: 'right'
                  }}
                >
                  יום שבת
                  <Typography variant="caption" display="block" sx={{ opacity: 0.7 }}>
                    ללא מע"מ / כולל מע"מ
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rooms.map((room) => (
                <TableRow
                  key={room._id}
                  sx={{
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
                    borderBottom: '1px solid rgba(0,0,0,0.05)'
                  }}
                >
                  <TableCell sx={{ fontWeight: 500 }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {room.roomNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {room.category}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  {/* מחיר בסיס */}
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <TextField
                        type="number"
                        value={getRoomValue(room, 'basePrice')}
                        onChange={(e) => updateRoomPrice(room._id, 'basePrice', e.target.value)}
                        size="small"
                        inputProps={{ step: 0.01, min: 0 }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            fontSize: '0.875rem',
                            height: '32px'
                          }
                        }}
                        placeholder="ללא מע״מ"
                      />
                      <TextField
                        type="number"
                        value={getRoomValue(room, 'vatPrice')}
                        onChange={(e) => updateRoomPrice(room._id, 'vatPrice', e.target.value)}
                        size="small"
                        inputProps={{ step: 0.01, min: 0 }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            fontSize: '0.875rem',
                            height: '32px',
                            bgcolor: 'rgba(0,0,0,0.02)'
                          }
                        }}
                        placeholder="כולל מע״מ"
                      />
                    </Box>
                  </TableCell>
                  
                  {/* אורח נוסף */}
                  <TableCell>
                    <TextField
                      type="number"
                      value={getRoomValue(room, 'extraGuestCharge')}
                      onChange={(e) => updateRoomPrice(room._id, 'extraGuestCharge', e.target.value)}
                      size="small"
                      inputProps={{ step: 0.01, min: 0 }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          fontSize: '0.875rem',
                          height: '32px'
                        }
                      }}
                      placeholder="0"
                    />
                  </TableCell>
                  
                  {/* יום שישי */}
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <TextField
                        type="number"
                        value={getRoomValue(room, 'fridayPrice')}
                        onChange={(e) => updateRoomPrice(room._id, 'fridayPrice', e.target.value)}
                        size="small"
                        inputProps={{ step: 0.01, min: 0 }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            fontSize: '0.875rem',
                            height: '32px'
                          }
                        }}
                        placeholder="ללא מע״מ"
                      />
                      <TextField
                        type="number"
                        value={getRoomValue(room, 'fridayVatPrice')}
                        onChange={(e) => updateRoomPrice(room._id, 'fridayVatPrice', e.target.value)}
                        size="small"
                        inputProps={{ step: 0.01, min: 0 }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            fontSize: '0.875rem',
                            height: '32px',
                            bgcolor: 'rgba(0,0,0,0.02)'
                          }
                        }}
                        placeholder="כולל מע״מ"
                      />
                    </Box>
                  </TableCell>
                  
                  {/* יום שבת */}
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <TextField
                        type="number"
                        value={getRoomValue(room, 'saturdayPrice')}
                        onChange={(e) => updateRoomPrice(room._id, 'saturdayPrice', e.target.value)}
                        size="small"
                        inputProps={{ step: 0.01, min: 0 }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            fontSize: '0.875rem',
                            height: '32px'
                          }
                        }}
                        placeholder="ללא מע״מ"
                      />
                      <TextField
                        type="number"
                        value={getRoomValue(room, 'saturdayVatPrice')}
                        onChange={(e) => updateRoomPrice(room._id, 'saturdayVatPrice', e.target.value)}
                        size="small"
                        inputProps={{ step: 0.01, min: 0 }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            fontSize: '0.875rem',
                            height: '32px',
                            bgcolor: 'rgba(0,0,0,0.02)'
                          }
                        }}
                        placeholder="כולל מע״מ"
                      />
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <DialogActions
        sx={{
          p: 2,
          bgcolor: 'rgba(0,0,0,0.02)',
          borderTop: '1px solid rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box>
          {hasChanges && (
            <Typography variant="body2" color="text.secondary">
              {Object.keys(editedRooms).length} חדרים עודכנו
            </Typography>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            onClick={onClose}
            variant="outlined"
            disabled={loading}
            sx={{
              borderColor: 'rgba(0,0,0,0.2)',
              color: 'text.secondary'
            }}
          >
            ביטול
          </Button>
          
          <Button
            onClick={handleSaveAll}
            variant="contained"
            disabled={loading || !hasChanges}
            startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
            sx={{
              bgcolor: colors.accent.green,
              '&:hover': { bgcolor: colors.accent.green, opacity: 0.9 },
              boxShadow: 'none'
            }}
          >
            {loading ? 'שומר...' : 'שמור הכל'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default PricelistModal; 