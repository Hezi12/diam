import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, Typography, Paper, Button, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, 
  IconButton, Chip, Tooltip, Dialog, useMediaQuery, useTheme,
  CircularProgress, Alert, Divider
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Visibility as VisibilityIcon,
  AirplanemodeActive as AirportIcon,
  Apartment as RothschildIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import RoomForm from './RoomForm';
import GalleryManager from '../gallery/GalleryManager';
import { STYLE_CONSTANTS } from '../../design-system/styles/StyleConstants';

const RoomManagement = ({ location }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [rooms, setRooms] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);
  const [openGallery, setOpenGallery] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // קריאת API לקבלת החדרים
  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`/api/rooms/location/${location}`);
      setRooms(response.data);
    } catch (err) {
      console.error('שגיאה בקבלת חדרים:', err);
      setError('שגיאה בטעינת החדרים. אנא נסה שוב.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchRooms();
  }, [location]);
  
  const handleAddRoom = () => {
    setCurrentRoom(null);
    setIsEdit(false);
    setOpenForm(true);
    setViewOnly(false);
  };
  
  const handleEditRoom = (room) => {
    setCurrentRoom(room);
    setIsEdit(true);
    setOpenForm(true);
    setViewOnly(false);
  };
  
  const handleViewRoom = (room) => {
    setCurrentRoom(room);
    setIsEdit(false);
    setOpenForm(true);
    setViewOnly(true);
  };
  
  const handleDeleteRoom = async (roomId) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק חדר זה?')) {
      try {
        setLoading(true);
        await axios.delete(`/api/rooms/${roomId}`);
        setRooms(rooms.filter(room => room._id !== roomId));
      } catch (err) {
        console.error('שגיאה במחיקת חדר:', err);
        alert('שגיאה במחיקת החדר. אנא נסה שוב.');
      } finally {
        setLoading(false);
      }
    }
  };
  
  const handleSaveRoom = async (roomData) => {
    try {
      setLoading(true);
      
      if (isEdit) {
        // עדכון חדר קיים
        const response = await axios.put(`/api/rooms/${currentRoom._id}`, {
          ...roomData,
          location
        });
        
        // עדכון החדר ברשימה
        const updatedRooms = rooms.map(room => 
          room._id === currentRoom._id ? response.data : room
        );
        setRooms(updatedRooms);
      } else {
        // הוספת חדר חדש
        const response = await axios.post('/api/rooms', {
          ...roomData,
          location
        });
        
        // הוספת החדר החדש לרשימה
        setRooms([...rooms, response.data]);
      }
      
      setOpenForm(false);
    } catch (err) {
      console.error('שגיאה בשמירת החדר:', err);
      alert(`שגיאה ב${isEdit ? 'עדכון' : 'יצירת'} החדר. אנא נסה שוב.`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCloseForm = () => {
    setOpenForm(false);
  };
  
  const handleGalleryUpload = () => {
    setOpenGallery(true);
  };
  
  const handleCloseGallery = () => {
    setOpenGallery(false);
  };
  
  // שינוי שמות המיקומים
  const getLocationName = () => {
    return location === 'airport' ? 'Airport Guest House' : 'רוטשילד';
  };
  
  // קבלת הצבעים המתאימים לפי המיקום
  const getLocationColors = () => {
    return location === 'airport' 
      ? { main: STYLE_CONSTANTS.colors.airport.main, bgLight: STYLE_CONSTANTS.colors.airport.bgLight }
      : { main: STYLE_CONSTANTS.colors.rothschild.main, bgLight: STYLE_CONSTANTS.colors.rothschild.bgLight };
  };
  
  const locationColors = getLocationColors();
  const colors = STYLE_CONSTANTS.colors;
  
  return (
    <Box sx={{ maxWidth: '1000px', mx: 'auto' }}>
      <Box sx={{ 
        mb: 4,
        pt: 2,
        display: 'flex',
        alignItems: 'center'
      }}>
        <Box 
          sx={{ 
            mr: 3.5, 
            bgcolor: locationColors.bgLight, 
            p: 1.5, 
            borderRadius: 2,
            display: 'flex'
          }}
        >
          {location === 'airport' ? (
            <AirportIcon sx={{ color: locationColors.main, fontSize: 28 }} />
          ) : (
            <RothschildIcon sx={{ color: locationColors.main, fontSize: 28 }} />
          )}
        </Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 500, color: colors.text.primary }}>
          {getLocationName()}
        </Typography>
      </Box>
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            borderRadius: '10px',
            '& .MuiAlert-icon': {
              color: colors.accent.red
            },
            border: `1px solid rgba(${colors.accent.red.replace('#', '').match(/../g).map(hex => parseInt(hex, 16)).join(', ')}, 0.1)`,
            bgcolor: `rgba(${colors.accent.red.replace('#', '').match(/../g).map(hex => parseInt(hex, 16)).join(', ')}, 0.05)`,
            color: colors.accent.red
          }}
        >
          {error}
        </Alert>
      )}
      
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2,
        flexWrap: 'wrap',
        gap: 1,
      }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 500, 
            color: colors.text.primary,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          חדרים
        </Typography>
        
        <Box sx={{ 
          display: 'flex',
          gap: 1.5,
        }}>
          <Button 
            variant="outlined"
            onClick={handleGalleryUpload}
            sx={{ 
              color: colors.rothschild.main,
              borderColor: colors.rothschild.main,
              '&:hover': {
                backgroundColor: colors.rothschild.bgLight,
                borderColor: colors.rothschild.main
              }
            }}
          >
            גלריה
          </Button>
          
          <Button 
            variant="contained" 
            onClick={handleAddRoom}
            sx={{ 
              bgcolor: colors.accent.green, 
              '&:hover': { bgcolor: colors.accent.green, opacity: 0.9 },
              boxShadow: 'none',
            }}
            disabled={loading}
          >
            הוסף חדר
          </Button>
        </Box>
      </Box>
      
      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: '14px',
          overflow: 'hidden',
          border: '1px solid rgba(0,0,0,0.06)',
          mb: 4,
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={32} thickness={4} sx={{ color: locationColors.main }} />
          </Box>
        ) : (
          <TableContainer sx={{ overflow: 'visible' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ 
                  '& th': { 
                    fontWeight: 600, 
                    bgcolor: locationColors.bgLight,
                    color: locationColors.main,
                    borderBottom: `2px solid ${locationColors.main}`,
                  } 
                }}>
                  <TableCell sx={{ py: 2 }}>מספר חדר</TableCell>
                  <TableCell sx={{ py: 2 }}>קטגוריה</TableCell>
                  <TableCell sx={{ py: 2 }}>מחיר בסיס (ללא מע"מ)</TableCell>
                  <TableCell sx={{ py: 2 }}>מחיר כולל מע"מ</TableCell>
                  <TableCell sx={{ py: 2 }}>סטטוס</TableCell>
                  <TableCell align="center" sx={{ py: 2 }}>פעולות</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rooms.length > 0 ? (
                  rooms.map((room) => (
                    <TableRow 
                      key={room._id}
                      sx={{ 
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.01)' },
                        borderBottom: '1px solid rgba(0,0,0,0.05)'
                      }}
                    >
                      <TableCell>{room.roomNumber}</TableCell>
                      <TableCell>{room.category}</TableCell>
                      <TableCell>{room.basePrice} ₪</TableCell>
                      <TableCell>{room.vatPrice} ₪</TableCell>
                      <TableCell>
                        <Chip 
                          label={room.status ? 'פעיל' : 'לא פעיל'} 
                          color={room.status ? 'success' : 'default'}
                          size="small"
                          sx={{
                            backgroundColor: room.status ? 
                              `rgba(${colors.accent.green.replace('#', '').match(/../g).map(hex => parseInt(hex, 16)).join(', ')}, 0.1)` : 
                              'rgba(0,0,0,0.05)',
                            color: room.status ? colors.accent.green : colors.text.secondary,
                            fontWeight: 500,
                            border: room.status ? `1px solid ${colors.accent.green}` : '1px solid rgba(0,0,0,0.1)'
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Tooltip title="צפייה">
                            <IconButton 
                              size="small" 
                              onClick={() => handleViewRoom(room)}
                              sx={{ 
                                color: colors.airport.main,
                                bgcolor: colors.airport.bgLight,
                                '&:hover': {
                                  bgcolor: colors.airport.bgLight,
                                  opacity: 0.8
                                },
                                padding: '6px',
                              }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="עריכה">
                            <IconButton 
                              size="small" 
                              onClick={() => handleEditRoom(room)}
                              sx={{ 
                                color: colors.rothschild.main,
                                bgcolor: colors.rothschild.bgLight,
                                '&:hover': {
                                  bgcolor: colors.rothschild.bgLight,
                                  opacity: 0.8
                                },
                                padding: '6px',
                              }}
                              disabled={loading}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="מחיקה">
                            <IconButton 
                              size="small" 
                              onClick={() => handleDeleteRoom(room._id)}
                              sx={{ 
                                color: colors.accent.red,
                                bgcolor: `rgba(${colors.accent.red.replace('#', '').match(/../g).map(hex => parseInt(hex, 16)).join(', ')}, 0.1)`,
                                '&:hover': {
                                  bgcolor: `rgba(${colors.accent.red.replace('#', '').match(/../g).map(hex => parseInt(hex, 16)).join(', ')}, 0.1)`,
                                  opacity: 0.8
                                },
                                padding: '6px',
                              }}
                              disabled={loading}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color={colors.text.secondary}>
                        לא נמצאו חדרים. ניתן להוסיף חדר חדש בלחיצה על "הוסף חדר".
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      
      <Dialog 
        open={openForm} 
        onClose={handleCloseForm}
        fullScreen={isMobile}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            maxWidth: '600px',
            width: '95%',
            borderRadius: '12px',
            overflow: 'hidden'
          }
        }}
      >
        <RoomForm 
          room={currentRoom} 
          isEdit={isEdit}
          viewOnly={viewOnly}
          onSave={handleSaveRoom} 
          onCancel={handleCloseForm} 
        />
      </Dialog>
      
      <GalleryManager
        location={location}
        open={openGallery}
        onClose={handleCloseGallery}
      />
    </Box>
  );
};

export default RoomManagement; 