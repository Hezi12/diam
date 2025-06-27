import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Switch,
    TextField,
    Button,
    Grid,
    Alert,
    CircularProgress,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Tooltip,
    Divider,
    FormControlLabel,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction
} from '@mui/material';
import {
    Sync,
    Settings,
    CheckCircle,
    Error,
    Schedule,
    ContentCopy,
    Visibility,
    Science,
    Refresh,
    Save,
    NotificationsActive,
    Delete
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import axios from 'axios';

const StyledCard = styled(Card)(({ theme }) => ({
    marginBottom: theme.spacing(2),
    transition: 'all 0.3s ease',
    '&:hover': {
        boxShadow: theme.shadows[4],
        transform: 'translateY(-2px)'
    }
}));

const StatusChip = styled(Chip)(({ status }) => ({
    fontWeight: 'bold',
    ...(status === 'success' && {
        backgroundColor: '#4caf50',
        color: 'white'
    }),
    ...(status === 'error' && {
        backgroundColor: '#f44336',
        color: 'white'
    }),
    ...(status === 'pending' && {
        backgroundColor: '#ff9800',
        color: 'white'
    }),
    ...(status === 'never' && {
        backgroundColor: '#9e9e9e',
        color: 'white'
    })
}));

const ICalSettings = () => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('airport');
    const [testUrlDialog, setTestUrlDialog] = useState(false);
    const [testUrl, setTestUrl] = useState('');
    const [testResult, setTestResult] = useState(null);
    const [testing, setTesting] = useState(false);
    const [viewExportDialog, setViewExportDialog] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        loadSettings();
    }, [selectedLocation]);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/ical/settings/${selectedLocation}`);
            setSettings(response.data);
        } catch (error) {
            console.error('שגיאה בטעינת הגדרות:', error);
            setError('שגיאה בטעינת הגדרות iCal');
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        try {
            setSaving(true);
            setError('');
            
            await axios.put(`/api/ical/settings/${selectedLocation}`, settings);
            setSuccess('הגדרות נשמרו בהצלחה!');
            
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            console.error('שגיאה בשמירת הגדרות:', error);
            setError('שגיאה בשמירת ההגדרות');
        } finally {
            setSaving(false);
        }
    };

    const syncRoom = async (roomId) => {
        try {
            setSyncing(true);
            setError('');
            
            const response = await axios.post(`/api/ical/sync/${selectedLocation}/${roomId}`);
            
            if (response.data.success) {
                setSuccess(`סנכרון הושלם! נמצאו ${response.data.newBookings} הזמנות חדשות`);
                await loadSettings(); // רענון הגדרות לעדכון סטטוס
            }
            
            setTimeout(() => setSuccess(''), 5000);
        } catch (error) {
            console.error('שגיאה בסנכרון:', error);
            setError(error.response?.data?.error || 'שגיאה בסנכרון');
        } finally {
            setSyncing(false);
        }
    };

    const syncAllRooms = async () => {
        try {
            setSyncing(true);
            setError('');
            
            const response = await axios.post(`/api/ical/sync/${selectedLocation}`);
            
            if (response.data.success) {
                setSuccess(`סנכרון כל החדרים הושלם! נמצאו ${response.data.totalNewBookings} הזמנות חדשות`);
                await loadSettings();
            }
            
            setTimeout(() => setSuccess(''), 5000);
        } catch (error) {
            console.error('שגיאה בסנכרון כל החדרים:', error);
            setError(error.response?.data?.error || 'שגיאה בסנכרון');
        } finally {
            setSyncing(false);
        }
    };

    const testICalUrl = async () => {
        try {
            setTesting(true);
            setTestResult(null);
            
            const response = await axios.post('/api/ical/test-url', { url: testUrl });
            setTestResult(response.data);
        } catch (error) {
            setTestResult({
                success: false,
                error: error.response?.data?.error || 'שגיאה בבדיקת הקישור'
            });
        } finally {
            setTesting(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setSuccess('הקישור הועתק ללוח!');
        setTimeout(() => setSuccess(''), 2000);
    };

    const deleteImportedBookings = async () => {
        try {
            setDeleting(true);
            setError('');
            
            const response = await axios.delete(`/api/ical/imported-bookings/${selectedLocation}`);
            
            if (response.data.success) {
                setSuccess(`נמחקו ${response.data.deletedCount} הזמנות מיובאות בהצלחה!`);
                await loadSettings(); // רענון הגדרות
                setDeleteDialog(false);
            }
            
            setTimeout(() => setSuccess(''), 5000);
        } catch (error) {
            console.error('שגיאה במחיקת הזמנות מיובאות:', error);
            setError(error.response?.data?.error || 'שגיאה במחיקת ההזמנות');
        } finally {
            setDeleting(false);
        }
    };

    const updateRoomSetting = (roomId, field, value) => {
        setSettings(prev => ({
            ...prev,
            rooms: prev.rooms.map(room => 
                room.roomId === roomId 
                    ? { ...room, [field]: value }
                    : room
            )
        }));
    };

    const updateGlobalSetting = (field, value) => {
        setSettings(prev => ({
            ...prev,
            globalSettings: {
                ...prev.globalSettings,
                [field]: value
            }
        }));
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'success': return 'success';
            case 'error': return 'error';
            case 'pending': return 'warning';
            default: return 'default';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'success': return 'הצליח';
            case 'error': return 'שגיאה';
            case 'pending': return 'בתהליך';
            case 'never': return 'מעולם לא';
            default: return 'לא ידוע';
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>טוען הגדרות iCal...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                🔄 הגדרות סנכרון בוקינג (iCal)
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                סנכרון אוטומטי של זמינות עם Booking.com באמצעות קבצי iCal
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            )}

            {/* בחירת מיקום */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item>
                        <Typography variant="h6">מיקום:</Typography>
                    </Grid>
                    <Grid item>
                        <Button
                            variant={selectedLocation === 'airport' ? 'contained' : 'outlined'}
                            onClick={() => setSelectedLocation('airport')}
                            sx={{ mr: 1 }}
                        >
                            Airport
                        </Button>
                        <Button
                            variant={selectedLocation === 'rothschild' ? 'contained' : 'outlined'}
                            onClick={() => setSelectedLocation('rothschild')}
                        >
                            Rothschild
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* הגדרות כלליות */}
            <StyledCard>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        <Settings /> הגדרות כלליות
                    </Typography>
                    
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={settings?.globalSettings?.autoSyncEnabled || false}
                                        onChange={(e) => updateGlobalSetting('autoSyncEnabled', e.target.checked)}
                                    />
                                }
                                label="סנכרון אוטומטי כל שעתיים"
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="תדירות סנכרון (דקות)"
                                fullWidth
                                type="number"
                                value={settings?.globalSettings?.syncInterval || 120}
                                onChange={(e) => updateGlobalSetting('syncInterval', parseInt(e.target.value) || 120)}
                                placeholder="120"
                                helperText="כמה דקות בין כל סנכרון אוטומטי (ברירת מחדל: 120)"
                                inputProps={{ min: 15, max: 1440 }}
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="כתובת מייל להתראות"
                                fullWidth
                                value={settings?.globalSettings?.notifications?.email || ''}
                                onChange={(e) => updateGlobalSetting('notifications', {
                                    ...settings?.globalSettings?.notifications,
                                    email: e.target.value
                                })}
                                placeholder="example@gmail.com"
                            />
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 2 }}>
                        <Button
                            variant="contained"
                            onClick={saveSettings}
                            disabled={saving}
                            startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                            sx={{ mr: 2 }}
                        >
                            {saving ? 'שומר...' : 'שמור הגדרות'}
                        </Button>
                        
                        <Button
                            variant="outlined"
                            onClick={syncAllRooms}
                            disabled={syncing}
                            startIcon={syncing ? <CircularProgress size={20} /> : <Sync />}
                            sx={{ mr: 2 }}
                        >
                            {syncing ? 'מסנכרן...' : 'סנכרן כל החדרים'}
                        </Button>
                        
                        <Button
                            variant="outlined"
                            color="error"
                            onClick={() => setDeleteDialog(true)}
                            disabled={deleting}
                            startIcon={<Delete />}
                        >
                            מחק הזמנות מיובאות
                        </Button>
                    </Box>
                </CardContent>
            </StyledCard>

            {/* הגדרות חדרים */}
            <StyledCard>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        🏨 הגדרות חדרים - {selectedLocation.toUpperCase()}
                    </Typography>
                    
                    <Grid container spacing={2}>
                        {settings?.rooms?.map((room) => (
                            <Grid item xs={12} key={room.roomId}>
                                <Paper sx={{ p: 2, border: '1px solid #e0e0e0' }}>
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid item xs={12} md={2}>
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {room.roomName}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                ID: {room.roomId}
                                            </Typography>
                                        </Grid>
                                        
                                        <Grid item xs={12} md={1}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={room.enabled}
                                                        onChange={(e) => updateRoomSetting(room.roomId, 'enabled', e.target.checked)}
                                                        size="small"
                                                    />
                                                }
                                                label="פעיל"
                                            />
                                        </Grid>
                                        
                                        <Grid item xs={12} md={4}>
                                            <TextField
                                                label="קישור iCal מבוקינג (ייבוא)"
                                                fullWidth
                                                size="small"
                                                value={room.bookingIcalUrl || ''}
                                                onChange={(e) => updateRoomSetting(room.roomId, 'bookingIcalUrl', e.target.value)}
                                                placeholder="https://admin.booking.com/hotel/..."
                                            />
                                        </Grid>
                                        
                                        <Grid item xs={12} md={3}>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <StatusChip
                                                    status={room.syncStatus}
                                                    label={getStatusText(room.syncStatus)}
                                                    size="small"
                                                />
                                                {room.lastSync && (
                                                    <Typography variant="caption">
                                                        {new Date(room.lastSync).toLocaleString('he-IL')}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Grid>
                                        
                                        <Grid item xs={12} md={2}>
                                            <Box display="flex" gap={1}>
                                                <Tooltip title="ייבוא מבוקינג (סנכרון ידני)">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => syncRoom(room.roomId)}
                                                        disabled={!room.enabled || !room.bookingIcalUrl || syncing}
                                                        color="primary"
                                                    >
                                                        <Sync />
                                                    </IconButton>
                                                </Tooltip>
                                                
                                                <Tooltip title="צפה בקישור ייצוא">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => {
                                                            setSelectedRoom(room);
                                                            setViewExportDialog(true);
                                                        }}
                                                    >
                                                        <Visibility />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                    
                                    {room.syncError && (
                                        <Alert severity="error" sx={{ mt: 1 }}>
                                            {room.syncError}
                                        </Alert>
                                    )}
                                    
                                    {room.importedBookings > 0 && (
                                        <Typography variant="caption" color="success.main" sx={{ mt: 1, display: 'block' }}>
                                            ✅ יובאו {room.importedBookings} הזמנות מבוקינג
                                        </Typography>
                                    )}
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </CardContent>
            </StyledCard>

            {/* כפתורי פעולה */}
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                    variant="outlined"
                    onClick={() => setTestUrlDialog(true)}
                                            startIcon={<Science />}
                >
                    בדוק קישור iCal
                </Button>
                
                <Button
                    variant="outlined"
                    onClick={loadSettings}
                    startIcon={<Refresh />}
                >
                    רענן נתונים
                </Button>
            </Box>

            {/* דיאלוג בדיקת קישור */}
            <Dialog open={testUrlDialog} onClose={() => setTestUrlDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>בדיקת קישור iCal</DialogTitle>
                <DialogContent>
                    <TextField
                        label="קישור iCal"
                        fullWidth
                        value={testUrl}
                        onChange={(e) => setTestUrl(e.target.value)}
                        placeholder="https://admin.booking.com/hotel/..."
                        sx={{ mt: 2 }}
                    />
                    
                    {testResult && (
                        <Alert 
                            severity={testResult.success ? 'success' : 'error'} 
                            sx={{ mt: 2 }}
                        >
                            {testResult.success ? (
                                <Box>
                                    <Typography variant="body2">
                                        ✅ הקישור תקין! נמצאו {testResult.info.totalEvents} אירועים
                                    </Typography>
                                    {testResult.info.sampleEvents.length > 0 && (
                                        <Box sx={{ mt: 1 }}>
                                            <Typography variant="caption">דוגמאות:</Typography>
                                            {testResult.info.sampleEvents.map((event, index) => (
                                                <Typography key={index} variant="caption" display="block">
                                                    • {event.summary} ({new Date(event.start).toLocaleDateString('he-IL')})
                                                </Typography>
                                            ))}
                                        </Box>
                                    )}
                                </Box>
                            ) : (
                                testResult.error
                            )}
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTestUrlDialog(false)}>סגור</Button>
                    <Button 
                        onClick={testICalUrl} 
                        disabled={!testUrl || testing}
                        variant="contained"
                        startIcon={testing ? <CircularProgress size={20} /> : <Science />}
                    >
                        {testing ? 'בודק...' : 'בדוק קישור'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* דיאלוג צפייה בקישור ייצוא */}
            <Dialog open={viewExportDialog} onClose={() => setViewExportDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>קישור ייצוא לבוקינג</DialogTitle>
                <DialogContent>
                    {selectedRoom && (
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                {selectedRoom.roomName}
                            </Typography>
                            
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                השתמש בקישור הזה בבוקינג כדי לייבא את הזמינות מהמערכת שלך:
                            </Typography>
                            
                            <Paper sx={{ p: 2, bgcolor: 'grey.100', mb: 2 }}>
                                <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                                    {window.location.origin}/api/ical/export/{selectedLocation}/{selectedRoom.roomId}
                                </Typography>
                            </Paper>
                            
                            <Button
                                variant="outlined"
                                startIcon={<ContentCopy />}
                                onClick={() => copyToClipboard(`${window.location.origin}/api/ical/export/${selectedLocation}/${selectedRoom.roomId}`)}
                                fullWidth
                            >
                                העתק קישור
                            </Button>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewExportDialog(false)}>סגור</Button>
                </DialogActions>
            </Dialog>

            {/* דיאלוג אישור מחיקת הזמנות מיובאות */}
            <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ color: 'error.main' }}>
                    ⚠️ מחיקת כל ההזמנות המיובאות
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        האם אתה בטוח שברצונך למחוק את <strong>כל ההזמנות שיובאו מבוקינג.קום</strong> במיקום {selectedLocation.toUpperCase()}?
                    </Typography>
                    
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                            פעולה זו תמחק את כל ההזמנות עם מקור "booking" ותאפס את מוני הסנכרון.
                            <br />
                            לאחר המחיקה תוכל לבצע סנכרון מחדש כדי לקבל את כל ההזמנות בצורה חדשה.
                        </Typography>
                    </Alert>
                    
                    <Typography variant="body2" color="text.secondary">
                        זוהי פעולה בלתי הפיכה. ההזמנות הרגילות (לא מיובאות) לא יושפעו.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog(false)} disabled={deleting}>
                        ביטול
                    </Button>
                    <Button 
                        onClick={deleteImportedBookings}
                        disabled={deleting}
                        variant="contained"
                        color="error"
                        startIcon={deleting ? <CircularProgress size={20} /> : <Delete />}
                    >
                        {deleting ? 'מוחק...' : 'מחק הזמנות מיובאות'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ICalSettings; 