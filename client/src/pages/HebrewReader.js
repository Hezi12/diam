import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Slider,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Fab,
  Chip,
  Snackbar,
  Alert,
  useMediaQuery,
  AppBar,
  Toolbar,
  Menu,
  MenuItem,
  Divider,
  LinearProgress,
  Tooltip,
  SwipeableDrawer,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  Speed,
  CloudUpload,
  Delete,
  Edit,
  Add,
  MenuBook,
  VolumeUp,
  SkipNext,
  SkipPrevious,
  TextFields,
  FormatSize,
  Bookmark,
  BookmarkBorder,
  MoreVert,
  Close,
  ContentPaste,
  LibraryBooks,
  Settings,
  ArrowBack,
  ArrowForward,
} from '@mui/icons-material';

const STORAGE_KEY = 'hebrew_reader_documents';
const BOOKMARKS_KEY = 'hebrew_reader_bookmarks';
const SETTINGS_KEY = 'hebrew_reader_settings';

// Helper: split text into sentences
const splitToSentences = (text) => {
  if (!text) return [];
  // Split by Hebrew sentence endings, newlines, or common delimiters
  const sentences = text
    .split(/(?<=[.!?׃\n])\s*/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  return sentences;
};

// Helper: load from localStorage
const loadDocuments = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveDocuments = (docs) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
};

const loadSettings = () => {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : { fontSize: 20, speed: 1, pitch: 1 };
  } catch {
    return { fontSize: 20, speed: 1, pitch: 1 };
  }
};

const saveSettings = (settings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

const loadBookmarks = () => {
  try {
    const data = localStorage.getItem(BOOKMARKS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

const saveBookmarks = (bookmarks) => {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
};

const HebrewReader = () => {
  const isMobile = useMediaQuery('(max-width:768px)');

  // Documents state
  const [documents, setDocuments] = useState(loadDocuments);
  const [currentDocId, setCurrentDocId] = useState(null);
  const [showLibrary, setShowLibrary] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocText, setNewDocText] = useState('');
  const [editingDoc, setEditingDoc] = useState(null);

  // Reader state
  const [sentences, setSentences] = useState([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Settings state
  const [settings, setSettings] = useState(loadSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [bookmarks, setBookmarks] = useState(loadBookmarks);

  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Menu
  const [menuAnchor, setMenuAnchor] = useState(null);

  // Refs
  const synthRef = useRef(window.speechSynthesis);
  const currentUtteranceRef = useRef(null);
  const sentenceRefs = useRef([]);
  const isPlayingRef = useRef(false);
  const currentIndexRef = useRef(0);
  const fileInputRef = useRef(null);

  const currentDoc = documents.find(d => d.id === currentDocId);

  // Load sentences when document changes
  useEffect(() => {
    if (currentDoc) {
      const s = splitToSentences(currentDoc.text);
      setSentences(s);
      // Restore bookmark position
      const savedPos = bookmarks[currentDoc.id];
      const startIdx = savedPos && savedPos < s.length ? savedPos : 0;
      setCurrentSentenceIndex(startIdx);
      currentIndexRef.current = startIdx;
      setShowLibrary(false);
    }
  }, [currentDocId]);

  // Save documents to localStorage
  useEffect(() => {
    saveDocuments(documents);
  }, [documents]);

  // Save settings
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Save bookmarks
  useEffect(() => {
    saveBookmarks(bookmarks);
  }, [bookmarks]);

  // Scroll to current sentence
  useEffect(() => {
    if (sentenceRefs.current[currentSentenceIndex]) {
      sentenceRefs.current[currentSentenceIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentSentenceIndex]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      synthRef.current.cancel();
    };
  }, []);

  const speakSentence = useCallback((index) => {
    if (index >= sentences.length) {
      setIsPlaying(false);
      setIsPaused(false);
      isPlayingRef.current = false;
      setSnackbar({ open: true, message: 'הקריאה הסתיימה', severity: 'info' });
      return;
    }

    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(sentences[index]);
    utterance.lang = 'he-IL';
    utterance.rate = settings.speed;
    utterance.pitch = settings.pitch;

    // Try to find Hebrew voice
    const voices = synthRef.current.getVoices();
    const hebrewVoice = voices.find(v => v.lang.startsWith('he'));
    if (hebrewVoice) {
      utterance.voice = hebrewVoice;
    }

    utterance.onstart = () => {
      setCurrentSentenceIndex(index);
      currentIndexRef.current = index;
    };

    utterance.onend = () => {
      if (isPlayingRef.current) {
        const nextIdx = currentIndexRef.current + 1;
        speakSentence(nextIdx);
      }
    };

    utterance.onerror = (e) => {
      if (e.error !== 'canceled') {
        console.error('Speech error:', e);
        // Try to continue to next sentence
        if (isPlayingRef.current) {
          const nextIdx = currentIndexRef.current + 1;
          speakSentence(nextIdx);
        }
      }
    };

    currentUtteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  }, [sentences, settings.speed, settings.pitch]);

  const handlePlay = () => {
    if (sentences.length === 0) return;

    if (isPaused) {
      synthRef.current.resume();
      setIsPaused(false);
      setIsPlaying(true);
      isPlayingRef.current = true;
      return;
    }

    setIsPlaying(true);
    isPlayingRef.current = true;
    speakSentence(currentSentenceIndex);
  };

  const handlePause = () => {
    synthRef.current.pause();
    setIsPaused(true);
    setIsPlaying(false);
    isPlayingRef.current = false;
  };

  const handleStop = () => {
    synthRef.current.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    isPlayingRef.current = false;
  };

  const handleNext = () => {
    if (currentSentenceIndex < sentences.length - 1) {
      const wasPlaying = isPlaying;
      synthRef.current.cancel();
      const nextIdx = currentSentenceIndex + 1;
      setCurrentSentenceIndex(nextIdx);
      currentIndexRef.current = nextIdx;
      if (wasPlaying) {
        isPlayingRef.current = true;
        speakSentence(nextIdx);
      }
    }
  };

  const handlePrev = () => {
    if (currentSentenceIndex > 0) {
      const wasPlaying = isPlaying;
      synthRef.current.cancel();
      const prevIdx = currentSentenceIndex - 1;
      setCurrentSentenceIndex(prevIdx);
      currentIndexRef.current = prevIdx;
      if (wasPlaying) {
        isPlayingRef.current = true;
        speakSentence(prevIdx);
      }
    }
  };

  const handleSentenceClick = (index) => {
    const wasPlaying = isPlaying;
    synthRef.current.cancel();
    setCurrentSentenceIndex(index);
    currentIndexRef.current = index;
    if (wasPlaying) {
      isPlayingRef.current = true;
      speakSentence(index);
    }
  };

  const handleBookmark = () => {
    if (!currentDoc) return;
    const newBookmarks = { ...bookmarks, [currentDoc.id]: currentSentenceIndex };
    setBookmarks(newBookmarks);
    setSnackbar({ open: true, message: `סימניה נשמרה במשפט ${currentSentenceIndex + 1}`, severity: 'success' });
  };

  const handleAddDocument = () => {
    if (!newDocText.trim()) return;
    const title = newDocTitle.trim() || `מסמך ${documents.length + 1}`;

    if (editingDoc) {
      setDocuments(docs => docs.map(d =>
        d.id === editingDoc.id ? { ...d, title, text: newDocText.trim(), updatedAt: Date.now() } : d
      ));
      setSnackbar({ open: true, message: 'המסמך עודכן בהצלחה', severity: 'success' });
    } else {
      const newDoc = {
        id: Date.now().toString(),
        title,
        text: newDocText.trim(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setDocuments(docs => [...docs, newDoc]);
      setSnackbar({ open: true, message: 'המסמך נוסף בהצלחה', severity: 'success' });
    }

    setNewDocTitle('');
    setNewDocText('');
    setEditingDoc(null);
    setShowAddDialog(false);
  };

  const handleDeleteDocument = (docId) => {
    if (currentDocId === docId) {
      handleStop();
      setCurrentDocId(null);
      setShowLibrary(true);
    }
    setDocuments(docs => docs.filter(d => d.id !== docId));
    const newBookmarks = { ...bookmarks };
    delete newBookmarks[docId];
    setBookmarks(newBookmarks);
    setSnackbar({ open: true, message: 'המסמך נמחק', severity: 'info' });
  };

  const handleEditDocument = (doc) => {
    setEditingDoc(doc);
    setNewDocTitle(doc.title);
    setNewDocText(doc.text);
    setShowAddDialog(true);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      setNewDocText(text);
      setNewDocTitle(file.name.replace(/\.[^/.]+$/, ''));
      setShowAddDialog(true);
    };
    reader.readAsText(file, 'UTF-8');
    // Reset file input
    event.target.value = '';
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setNewDocText(text);
        setShowAddDialog(true);
      }
    } catch {
      setSnackbar({ open: true, message: 'לא ניתן לגשת ללוח - הדבק ידנית', severity: 'warning' });
      setShowAddDialog(true);
    }
  };

  const progress = sentences.length > 0 ? ((currentSentenceIndex + 1) / sentences.length) * 100 : 0;

  // ----- Library View -----
  const renderLibrary = () => (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f0eb', pb: 12 }}>
      <AppBar position="sticky" sx={{ bgcolor: '#2c1810', boxShadow: 3 }}>
        <Toolbar>
          <MenuBook sx={{ ml: 1, fontSize: 28 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            קורא עברית
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 2, maxWidth: 600, mx: 'auto' }}>
        {/* Action buttons */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button
            variant="contained"
            startIcon={<CloudUpload />}
            onClick={() => fileInputRef.current?.click()}
            sx={{
              bgcolor: '#2c1810',
              '&:hover': { bgcolor: '#4a2c1a' },
              borderRadius: 3,
              px: 3,
            }}
          >
            העלה קובץ
          </Button>
          <Button
            variant="contained"
            startIcon={<ContentPaste />}
            onClick={handlePasteFromClipboard}
            sx={{
              bgcolor: '#5d4037',
              '&:hover': { bgcolor: '#6d4c41' },
              borderRadius: 3,
              px: 3,
            }}
          >
            הדבק טקסט
          </Button>
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={() => {
              setEditingDoc(null);
              setNewDocTitle('');
              setNewDocText('');
              setShowAddDialog(true);
            }}
            sx={{
              bgcolor: '#795548',
              '&:hover': { bgcolor: '#8d6e63' },
              borderRadius: 3,
              px: 3,
            }}
          >
            כתוב טקסט
          </Button>
        </Box>

        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.text"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />

        {/* Documents list */}
        {documents.length === 0 ? (
          <Paper
            sx={{
              p: 4,
              textAlign: 'center',
              borderRadius: 3,
              bgcolor: '#fff8f0',
              border: '2px dashed #d7ccc8',
            }}
          >
            <MenuBook sx={{ fontSize: 64, color: '#bcaaa4', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              הספרייה ריקה
            </Typography>
            <Typography variant="body2" color="text.secondary">
              העלה קובץ טקסט, הדבק טקסט מהלוח, או כתוב טקסט חדש
            </Typography>
          </Paper>
        ) : (
          <List sx={{ bgcolor: 'transparent' }}>
            {documents.map((doc) => (
              <Paper
                key={doc.id}
                sx={{
                  mb: 1.5,
                  borderRadius: 3,
                  overflow: 'hidden',
                  bgcolor: '#fff8f0',
                  border: '1px solid #e0d6cc',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4,
                  },
                  cursor: 'pointer',
                }}
                onClick={() => setCurrentDocId(doc.id)}
              >
                <ListItem sx={{ py: 2 }}>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#2c1810' }}>
                        {doc.title}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {doc.text.substring(0, 100)}...
                        </Typography>
                        <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                          <Chip
                            size="small"
                            label={`${splitToSentences(doc.text).length} משפטים`}
                            sx={{ bgcolor: '#efebe9' }}
                          />
                          {bookmarks[doc.id] !== undefined && (
                            <Chip
                              size="small"
                              icon={<Bookmark sx={{ fontSize: 14 }} />}
                              label={`סימניה: ${bookmarks[doc.id] + 1}`}
                              sx={{ bgcolor: '#fff3e0' }}
                            />
                          )}
                        </Box>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditDocument(doc);
                      }}
                      sx={{ color: '#5d4037' }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDocument(doc.id);
                      }}
                      sx={{ color: '#c62828' }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </Paper>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );

  // ----- Reader View -----
  const renderReader = () => (
    <Box sx={{ minHeight: '100vh', bgcolor: '#faf6f1', display: 'flex', flexDirection: 'column' }}>
      {/* Top Bar */}
      <AppBar position="sticky" sx={{ bgcolor: '#2c1810', boxShadow: 3 }}>
        <Toolbar>
          <IconButton color="inherit" onClick={() => { handleStop(); setShowLibrary(true); setCurrentDocId(null); }}>
            <ArrowForward />
          </IconButton>
          <Typography variant="subtitle1" sx={{ flexGrow: 1, fontWeight: 700, mx: 1 }} noWrap>
            {currentDoc?.title}
          </Typography>
          <IconButton color="inherit" onClick={handleBookmark}>
            {bookmarks[currentDoc?.id] !== undefined ? <Bookmark /> : <BookmarkBorder />}
          </IconButton>
          <IconButton color="inherit" onClick={(e) => setMenuAnchor(e.currentTarget)}>
            <MoreVert />
          </IconButton>
        </Toolbar>
        {/* Progress bar */}
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 3,
            bgcolor: 'rgba(255,255,255,0.1)',
            '& .MuiLinearProgress-bar': { bgcolor: '#ffab40' },
          }}
        />
      </AppBar>

      {/* Settings Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => { setMenuAnchor(null); setShowSettings(true); }}>
          <Settings sx={{ ml: 1, fontSize: 20 }} /> הגדרות
        </MenuItem>
        <MenuItem onClick={() => {
          setMenuAnchor(null);
          handleEditDocument(currentDoc);
        }}>
          <Edit sx={{ ml: 1, fontSize: 20 }} /> ערוך מסמך
        </MenuItem>
      </Menu>

      {/* Sentence counter */}
      <Box sx={{ textAlign: 'center', py: 1, bgcolor: '#f5ebe0' }}>
        <Typography variant="caption" color="text.secondary">
          משפט {currentSentenceIndex + 1} מתוך {sentences.length}
        </Typography>
      </Box>

      {/* Text Content */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: isMobile ? 2 : 4,
          pb: 20,
          maxWidth: 700,
          mx: 'auto',
          width: '100%',
        }}
      >
        {sentences.map((sentence, index) => (
          <Typography
            key={index}
            ref={(el) => (sentenceRefs.current[index] = el)}
            onClick={() => handleSentenceClick(index)}
            sx={{
              fontSize: settings.fontSize,
              lineHeight: 2,
              mb: 1,
              p: 1,
              borderRadius: 2,
              cursor: 'pointer',
              direction: 'rtl',
              textAlign: 'right',
              fontFamily: '"David Libre", "Frank Ruhl Libre", "Noto Serif Hebrew", serif',
              transition: 'all 0.3s ease',
              bgcolor: index === currentSentenceIndex
                ? 'rgba(255, 171, 64, 0.2)'
                : 'transparent',
              borderRight: index === currentSentenceIndex
                ? '4px solid #ff8f00'
                : '4px solid transparent',
              color: index === currentSentenceIndex
                ? '#2c1810'
                : index < currentSentenceIndex
                  ? '#9e9e9e'
                  : '#4e342e',
              fontWeight: index === currentSentenceIndex ? 600 : 400,
              '&:hover': {
                bgcolor: index === currentSentenceIndex
                  ? 'rgba(255, 171, 64, 0.25)'
                  : 'rgba(0,0,0,0.04)',
              },
            }}
          >
            {sentence}
          </Typography>
        ))}
      </Box>

      {/* Bottom Controls */}
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: '#2c1810',
          color: 'white',
          borderRadius: '20px 20px 0 0',
          zIndex: 1000,
          pb: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Speed slider */}
        <Box sx={{ px: 3, pt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Speed sx={{ fontSize: 18, opacity: 0.7 }} />
          <Slider
            value={settings.speed}
            onChange={(_, val) => setSettings(s => ({ ...s, speed: val }))}
            min={0.3}
            max={2}
            step={0.1}
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => `${v}x`}
            sx={{
              color: '#ffab40',
              '& .MuiSlider-thumb': { width: 16, height: 16 },
            }}
          />
          <Typography variant="caption" sx={{ minWidth: 30, opacity: 0.7 }}>
            {settings.speed}x
          </Typography>
        </Box>

        {/* Playback controls */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: isMobile ? 1 : 3,
            py: 1.5,
            px: 2,
          }}
        >
          <IconButton
            onClick={handlePrev}
            disabled={currentSentenceIndex === 0}
            sx={{ color: 'white', '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)' } }}
          >
            <SkipNext /> {/* RTL - next icon is visually "previous" */}
          </IconButton>

          <IconButton onClick={handleStop} sx={{ color: 'white' }}>
            <Stop sx={{ fontSize: 28 }} />
          </IconButton>

          <Fab
            onClick={isPlaying ? handlePause : handlePlay}
            sx={{
              bgcolor: '#ff8f00',
              color: 'white',
              width: 64,
              height: 64,
              '&:hover': { bgcolor: '#ff6f00' },
            }}
          >
            {isPlaying ? <Pause sx={{ fontSize: 36 }} /> : <PlayArrow sx={{ fontSize: 36 }} />}
          </Fab>

          <IconButton onClick={handleStop} sx={{ color: 'white', visibility: 'hidden' }}>
            <Stop />
          </IconButton>

          <IconButton
            onClick={handleNext}
            disabled={currentSentenceIndex >= sentences.length - 1}
            sx={{ color: 'white', '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)' } }}
          >
            <SkipPrevious /> {/* RTL - prev icon is visually "next" */}
          </IconButton>
        </Box>
      </Paper>

      {/* Settings Drawer */}
      <SwipeableDrawer
        anchor="bottom"
        open={showSettings}
        onClose={() => setShowSettings(false)}
        onOpen={() => setShowSettings(true)}
        PaperProps={{
          sx: { borderRadius: '20px 20px 0 0', maxHeight: '50vh' },
        }}
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, textAlign: 'center' }}>
            הגדרות
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Typography gutterBottom>
            <FormatSize sx={{ verticalAlign: 'middle', ml: 1 }} />
            גודל טקסט: {settings.fontSize}px
          </Typography>
          <Slider
            value={settings.fontSize}
            onChange={(_, val) => setSettings(s => ({ ...s, fontSize: val }))}
            min={14}
            max={36}
            step={1}
            sx={{ color: '#2c1810', mb: 3 }}
          />

          <Typography gutterBottom>
            <Speed sx={{ verticalAlign: 'middle', ml: 1 }} />
            מהירות דיבור: {settings.speed}x
          </Typography>
          <Slider
            value={settings.speed}
            onChange={(_, val) => setSettings(s => ({ ...s, speed: val }))}
            min={0.3}
            max={2}
            step={0.1}
            sx={{ color: '#2c1810', mb: 3 }}
          />

          <Typography gutterBottom>
            <VolumeUp sx={{ verticalAlign: 'middle', ml: 1 }} />
            גובה קול: {settings.pitch}
          </Typography>
          <Slider
            value={settings.pitch}
            onChange={(_, val) => setSettings(s => ({ ...s, pitch: val }))}
            min={0.5}
            max={2}
            step={0.1}
            sx={{ color: '#2c1810', mb: 2 }}
          />
        </Box>
      </SwipeableDrawer>
    </Box>
  );

  // ----- Add/Edit Document Dialog -----
  const renderAddDialog = () => (
    <Dialog
      open={showAddDialog}
      onClose={() => { setShowAddDialog(false); setEditingDoc(null); }}
      fullScreen={isMobile}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}
    >
      <DialogTitle sx={{ bgcolor: '#2c1810', color: 'white', display: 'flex', alignItems: 'center' }}>
        {isMobile && (
          <IconButton color="inherit" onClick={() => { setShowAddDialog(false); setEditingDoc(null); }}>
            <Close />
          </IconButton>
        )}
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
          {editingDoc ? 'עריכת מסמך' : 'הוספת מסמך חדש'}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <TextField
          fullWidth
          label="שם המסמך"
          value={newDocTitle}
          onChange={(e) => setNewDocTitle(e.target.value)}
          placeholder="הכנס שם למסמך..."
          sx={{ mb: 2 }}
          InputProps={{ style: { direction: 'rtl' } }}
        />
        <TextField
          fullWidth
          multiline
          rows={isMobile ? 15 : 12}
          label="טקסט"
          value={newDocText}
          onChange={(e) => setNewDocText(e.target.value)}
          placeholder="הדבק או כתוב כאן את הטקסט בעברית..."
          InputProps={{ style: { direction: 'rtl', fontFamily: '"David Libre", serif', fontSize: 16, lineHeight: 1.8 } }}
        />
        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            {newDocText.length > 0 ? `${splitToSentences(newDocText).length} משפטים` : ''}
          </Typography>
          <Button
            size="small"
            startIcon={<CloudUpload />}
            onClick={() => fileInputRef.current?.click()}
          >
            העלה קובץ
          </Button>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => { setShowAddDialog(false); setEditingDoc(null); }}>ביטול</Button>
        <Button
          variant="contained"
          onClick={handleAddDocument}
          disabled={!newDocText.trim()}
          sx={{ bgcolor: '#2c1810', '&:hover': { bgcolor: '#4a2c1a' }, borderRadius: 2 }}
        >
          {editingDoc ? 'עדכן' : 'הוסף'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ direction: 'rtl' }}>
      <link href="https://fonts.googleapis.com/css2?family=David+Libre:wght@400;500;700&family=Frank+Ruhl+Libre:wght@400;500;700&display=swap" rel="stylesheet" />

      {showLibrary ? renderLibrary() : renderReader()}
      {renderAddDialog()}

      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.text"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default HebrewReader;
