import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, Typography, Paper, Button, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, 
  IconButton, Chip, Tooltip, Dialog, useMediaQuery, useTheme,
  CircularProgress, Alert
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Visibility as VisibilityIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import RoomForm from './room/RoomForm';
import GalleryManager from './gallery/GalleryManager';

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
  
  return (
    <Box>
      <Button 
        component={Link} 
        to="/settings" 
        startIcon={<ArrowBackIcon />}
        sx={{ 
          mb: 3, 
          color: 'var(--accent-blue-light)',
          borderColor: 'var(--accent-blue-light)',
          '&:hover': {
            backgroundColor: 'var(--bg-blue-light)',
            borderColor: 'var(--accent-blue-light)'
          }
        }}
        variant="outlined"
      >
        חזרה
      </Button>
    
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 500 }}>
          {getLocationName()}
        </Typography>
        
        <Box sx={{ '& > :first-of-type': { mr: 2 } }}>
          <Button 
            variant="outlined"
            onClick={handleGalleryUpload}
            sx={{
              color: 'var(--accent-purple)',
              borderColor: 'var(--accent-purple)',
              '&:hover': {
                backgroundColor: 'var(--bg-purple-light)',
                borderColor: 'var(--accent-purple)'
              }
            }}
          >
            גלריה
          </Button>
          
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleAddRoom}
            sx={{ 
              bgcolor: 'var(--accent-green)', 
              '&:hover': { bgcolor: 'var(--accent-green)', opacity: 0.9 } 
            }}
            disabled={loading}
          >
            הוסף חדר חדש
          </Button>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ 
                  '& th': { 
                    fontWeight: 600, 
                    bgcolor: 'var(--bg-indigo-light)',
                    color: 'var(--accent-indigo)',
                    borderBottom: '2px solid var(--accent-indigo)',
                  } 
                }}>
                  <TableCell>מספר חדר</TableCell>
                  <TableCell>קטגוריה</TableCell>
                  <TableCell>מחיר בסיס (ללא מע"מ)</TableCell>
                  <TableCell>מחיר כולל מע"מ</TableCell>
                  <TableCell>סטטוס</TableCell>
                  <TableCell>פעולות</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rooms.length > 0 ? (
                  rooms.map((room) => (
                    <TableRow key={room._id} sx={{ 
                      '&:hover': { 
                        bgcolor: 'rgba(0,0,0,0.01)'
                      },
                      borderBottom: '1px solid rgba(0,0,0,0.05)'
                    }}>
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
                            backgroundColor: room.status ? 'var(--bg-green-light)' : 'rgba(0,0,0,0.05)',
                            color: room.status ? 'var(--accent-green)' : 'var(--text-secondary)',
                            fontWeight: 500,
                            border: room.status ? '1px solid var(--accent-green)' : '1px solid rgba(0,0,0,0.1)'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="צפייה">
                            <IconButton 
                              size="small" 
                              onClick={() => handleViewRoom(room)}
                              sx={{ 
                                color: 'var(--accent-blue-light)',
                                bgcolor: 'var(--bg-blue-light)',
                                '&:hover': {
                                  bgcolor: 'var(--bg-blue-light)',
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
                                color: 'var(--accent-indigo)',
                                bgcolor: 'var(--bg-indigo-light)',
                                '&:hover': {
                                  bgcolor: 'var(--bg-indigo-light)',
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
                                color: 'var(--accent-pink)',
                                bgcolor: 'var(--bg-pink-light)',
                                '&:hover': {
                                  bgcolor: 'var(--bg-pink-light)',
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
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="textSecondary">
                        לא נמצאו חדרים. ניתן להוסיף חדר חדש בלחיצה על "הוסף חדר חדש".
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
            width: '95%'
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