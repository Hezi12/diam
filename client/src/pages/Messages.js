import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  useTheme,
  useMediaQuery,
  Chip,
  IconButton,
  Drawer,
} from '@mui/material';
import {
  ChatBubbleOutline as ChatIcon,
  Check as CheckIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  Psychology as BrainIcon,
} from '@mui/icons-material';

const LS_MESSAGES_KEY = 'diam_messages';
const LS_TIMESTAMP_KEY = 'diam_messages_timestamp';
const LS_STATUSES_KEY = 'diam_message_statuses';
const LS_KNOWLEDGE_KEY = 'diam_ai_knowledge';

const DEFAULT_KNOWLEDGE = {
  lastUpdated: "2026-02-17T14:30:00",
  replyStyle: {
    tone: "short, warm, personal",
    signEnglish: "David",
    signHebrew: "דוד",
    alwaysInclude: "WhatsApp: +972-506070260",
    israeliFormat: "0506070260"
  },
  propertyDescriptions: {
    airportGH: [
      "בית גדול שהפך לפני כמה שנים לבית הארחה",
      "כל חדר הוא פרטי לגמרי עם שירותים ומקלחת פרטיים",
      "המקום שקט",
      "נמצא כרבע שעה מהשדה תעופה"
    ]
  },
  rules: [
    "לא לתאר כ-cozy או comfortable — לתאר את המבנה והפרטיות",
    "לא להזכיר מחיר מונית אלא אם האורח שואל ספציפית",
    "מהשדה תעופה — יש מוניות כל הזמן בעמדה מסודרת ביציאה מהטרמינל",
    "חשבוניות — לבקש מייל מהאורח + בקשה אישית לפידבק בבוקינג",
    "תמיד לענות בשפה של האורח",
    "הודעות לא בעברית — להציג מקור + תרגום עברית עם 🇮🇱"
  ],
  feedbackLog: [
    {
      date: "2026-02-17",
      lesson: "לא cozy — לתאר מבנה ופרטיות",
      source: "פידבק על תשובה לשניאור פרידמן"
    },
    {
      date: "2026-02-17",
      lesson: "חשבונית — לבקש מייל + לבקש פידבק אישי בבוקינג",
      source: "פידבק על תשובה לשמעון שכטר"
    }
  ]
};

const Messages = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [messages, setMessages] = useState([]);
  const [timestamp, setTimestamp] = useState('');
  const [statuses, setStatuses] = useState({});
  const [feedbackGuest, setFeedbackGuest] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');

  // Knowledge system state
  const [knowledge, setKnowledge] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_KNOWLEDGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_KNOWLEDGE;
    } catch { return DEFAULT_KNOWLEDGE; }
  });
  const [knowledgeOpen, setKnowledgeOpen] = useState(false);
  const [knowledgeEditText, setKnowledgeEditText] = useState('');

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem(LS_MESSAGES_KEY);
      const savedTimestamp = localStorage.getItem(LS_TIMESTAMP_KEY);
      const savedStatuses = localStorage.getItem(LS_STATUSES_KEY);

      if (savedMessages) setMessages(JSON.parse(savedMessages));
      if (savedTimestamp) setTimestamp(savedTimestamp);
      if (savedStatuses) setStatuses(JSON.parse(savedStatuses));
    } catch (e) {
      console.error('Error loading messages from localStorage:', e);
    }
  }, []);

  // Save statuses to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(statuses).length > 0) {
      localStorage.setItem(LS_STATUSES_KEY, JSON.stringify(statuses));
    }
  }, [statuses]);

  // Expose global loadMessages function
  const loadMessages = useCallback((data, ts) => {
    setMessages(data || []);
    setTimestamp(ts || '');
    setStatuses({});
    setFeedbackGuest(null);

    localStorage.setItem(LS_MESSAGES_KEY, JSON.stringify(data || []));
    localStorage.setItem(LS_TIMESTAMP_KEY, ts || '');
    localStorage.removeItem(LS_STATUSES_KEY);

    // Dispatch event so sidebar badge updates
    window.dispatchEvent(new CustomEvent('diam-messages-updated'));
  }, []);

  // Expose global getMessageStatuses function
  const getMessageStatuses = useCallback(() => {
    const result = [];
    const messageCards = messages.filter(item => item.g);
    messageCards.forEach(card => {
      const guestKey = card.g;
      const status = statuses[guestKey];
      if (status) {
        const entry = { guest: guestKey, status: status.status };
        if (status.status === 'edited') {
          entry.feedback = status.feedback;
          entry.originalReply = card.r;
        } else if (status.status === 'approved') {
          entry.reply = card.r;
        }
        result.push(entry);
      }
    });
    return result;
  }, [messages, statuses]);

  // Register global functions
  useEffect(() => {
    window.loadMessages = loadMessages;
    window.getMessageStatuses = getMessageStatuses;
    return () => {
      // Don't remove on unmount — keep available globally
    };
  }, [loadMessages, getMessageStatuses]);

  // Knowledge API — global functions
  useEffect(() => {
    window.getKnowledge = () => knowledge;

    window.updateKnowledge = (updates) => {
      setKnowledge(prev => {
        const merged = { ...prev, ...updates, lastUpdated: new Date().toISOString() };
        localStorage.setItem(LS_KNOWLEDGE_KEY, JSON.stringify(merged));
        return merged;
      });
    };

    window.resetKnowledge = () => {
      setKnowledge(DEFAULT_KNOWLEDGE);
      localStorage.setItem(LS_KNOWLEDGE_KEY, JSON.stringify(DEFAULT_KNOWLEDGE));
    };
  }, [knowledge]);

  // Count pending messages for badge
  useEffect(() => {
    const count = messages.filter(item => item.g).length;
    window.__diamPendingMessages = count;
    window.dispatchEvent(new CustomEvent('diam-messages-updated'));
  }, [messages]);

  const handleOpenKnowledge = () => {
    setKnowledgeEditText(JSON.stringify(knowledge, null, 2));
    setKnowledgeOpen(true);
  };

  const handleSaveKnowledge = () => {
    try {
      const parsed = JSON.parse(knowledgeEditText);
      parsed.lastUpdated = new Date().toISOString();
      setKnowledge(parsed);
      localStorage.setItem(LS_KNOWLEDGE_KEY, JSON.stringify(parsed));
      setKnowledgeOpen(false);
    } catch (e) {
      alert('JSON לא תקין — בדוק את הפורמט');
    }
  };

  const handleResetKnowledge = () => {
    setKnowledge(DEFAULT_KNOWLEDGE);
    localStorage.setItem(LS_KNOWLEDGE_KEY, JSON.stringify(DEFAULT_KNOWLEDGE));
    setKnowledgeEditText(JSON.stringify(DEFAULT_KNOWLEDGE, null, 2));
  };

  const handleApprove = (guestName) => {
    setStatuses(prev => ({
      ...prev,
      [guestName]: { status: 'approved' },
    }));
    if (feedbackGuest === guestName) setFeedbackGuest(null);
  };

  const handleIgnore = (guestName) => {
    setStatuses(prev => ({
      ...prev,
      [guestName]: { status: 'ignored' },
    }));
    if (feedbackGuest === guestName) setFeedbackGuest(null);
  };

  const handleStartFeedback = (guestName) => {
    // If there's already a saved feedback, load it into the text field
    const existing = statuses[guestName];
    setFeedbackGuest(guestName);
    setFeedbackText(existing?.status === 'edited' ? (existing.feedback || '') : '');
  };

  const handleSaveFeedback = (guestName) => {
    if (!feedbackText.trim()) return;
    setStatuses(prev => ({
      ...prev,
      [guestName]: { status: 'edited', feedback: feedbackText.trim() },
    }));
    setFeedbackGuest(null);
  };

  const handleCancelFeedback = () => {
    setFeedbackGuest(null);
    setFeedbackText('');
  };

  const handleClearStatus = (guestName) => {
    setStatuses(prev => {
      const next = { ...prev };
      delete next[guestName];
      return next;
    });
    if (feedbackGuest === guestName) setFeedbackGuest(null);
  };

  const getCardBorder = (guestName) => {
    const status = statuses[guestName];
    if (!status) return 'none';
    switch (status.status) {
      case 'approved': return '2px solid #4caf50';
      case 'edited': return '2px solid #2196f3';
      case 'ignored': return '2px solid #bdbdbd';
      default: return 'none';
    }
  };

  const getCardBg = (guestName) => {
    const status = statuses[guestName];
    if (!status) return '#fff';
    switch (status.status) {
      case 'approved': return '#f1f8e9';
      case 'edited': return '#e3f2fd';
      case 'ignored': return '#fafafa';
      default: return '#fff';
    }
  };

  const hasMessages = messages.some(item => item.g);

  // Knowledge drawer component
  const knowledgeDrawer = (
    <Drawer
      anchor="left"
      open={knowledgeOpen}
      onClose={() => setKnowledgeOpen(false)}
      PaperProps={{
        sx: {
          width: isMobile ? '90%' : 480,
          p: 3,
          direction: 'rtl',
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          זיכרון AI
        </Typography>
        <IconButton onClick={() => setKnowledgeOpen(false)} size="small">
          <CloseIcon />
        </IconButton>
      </Box>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
        עדכון אחרון: {knowledge.lastUpdated ? new Date(knowledge.lastUpdated).toLocaleString('he-IL') : '—'}
      </Typography>
      <TextField
        multiline
        fullWidth
        minRows={20}
        maxRows={30}
        value={knowledgeEditText}
        onChange={(e) => setKnowledgeEditText(e.target.value)}
        variant="outlined"
        size="small"
        sx={{
          mb: 2,
          '& .MuiInputBase-input': {
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            direction: 'ltr',
            textAlign: 'left',
          }
        }}
      />
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant="contained"
          size="small"
          onClick={handleSaveKnowledge}
          sx={{ textTransform: 'none' }}
        >
          שמירה
        </Button>
        <Button
          size="small"
          onClick={handleResetKnowledge}
          sx={{ textTransform: 'none', color: 'text.secondary' }}
        >
          איפוס לברירת מחדל
        </Button>
      </Box>
    </Drawer>
  );

  // Empty state
  if (!hasMessages) {
    return (
      <Box sx={{ p: isMobile ? 2 : 3 }}>
        {knowledgeDrawer}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            הודעות אורחים
          </Typography>
          <IconButton onClick={handleOpenKnowledge} size="small" sx={{ color: 'text.secondary' }}>
            <BrainIcon />
          </IconButton>
        </Box>
        {timestamp && (
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            {timestamp}
          </Typography>
        )}
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 10,
        }}>
          <ChatIcon sx={{ fontSize: 80, color: '#e0e0e0', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
            אין הודעות ממתינות
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.disabled' }}>
            ה-AI יעדכן כאן הודעות חדשות בזמן הסריקה
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: isMobile ? 2 : 3 }}>
      {knowledgeDrawer}
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          הודעות אורחים
        </Typography>
        <IconButton onClick={handleOpenKnowledge} size="small" sx={{ color: 'text.secondary' }}>
          <BrainIcon />
        </IconButton>
      </Box>
      {timestamp && (
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
          {timestamp}
        </Typography>
      )}

      {/* Render sections and cards */}
      {messages.map((item, index) => {
        // Section header
        if (item.sec) {
          const nextItem = messages[index + 1];
          const hasCards = nextItem && nextItem.g;

          if (!hasCards) {
            // Empty section — gray line
            return (
              <Typography
                key={`sec-${index}`}
                variant="body2"
                sx={{
                  color: 'text.disabled',
                  py: 1,
                  mt: index > 0 ? 2 : 0,
                  borderBottom: '1px solid #eee',
                  fontSize: '0.85rem',
                }}
              >
                {item.sec}
              </Typography>
            );
          }

          return (
            <Typography
              key={`sec-${index}`}
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                mt: index > 0 ? 3 : 0,
                mb: 1.5,
                color: 'text.primary',
                fontSize: '1rem',
              }}
            >
              {item.sec}
            </Typography>
          );
        }

        // Message card
        if (item.g) {
          const guestKey = item.g;
          const status = statuses[guestKey];
          const isWritingFeedback = feedbackGuest === guestKey;

          return (
            <Paper
              key={`msg-${index}`}
              elevation={0}
              sx={{
                mb: 2,
                p: isMobile ? 2 : 2.5,
                border: getCardBorder(guestKey),
                backgroundColor: getCardBg(guestKey),
                borderRadius: 2,
                transition: 'all 0.2s ease',
              }}
            >
              {/* Mobile: Stack vertically. Desktop: Row layout */}
              <Box sx={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? 2 : 3,
              }}>
                {/* Right side — Guest info */}
                <Box sx={{
                  minWidth: isMobile ? 'auto' : 180,
                  maxWidth: isMobile ? '100%' : 200,
                  flexShrink: 0,
                }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                    {item.g}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    {item.p}
                  </Typography>
                  <Typography variant="caption" sx={{
                    color: item.d?.includes('עתיד') ? 'success.main' : 'text.disabled',
                    display: 'block',
                    mt: 0.5,
                  }}>
                    {item.d}
                  </Typography>
                </Box>

                {/* Center — Original message */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ mb: item.mt ? 0.5 : 0, lineHeight: 1.6 }}>
                    {item.m}
                  </Typography>
                  {item.mt && (
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                      {item.mt}
                    </Typography>
                  )}
                </Box>

                {/* Left side — Suggested reply */}
                <Box sx={{
                  flex: 1,
                  minWidth: 0,
                  backgroundColor: 'rgba(255, 235, 59, 0.08)',
                  borderRadius: 1.5,
                  p: 1.5,
                }}>
                    <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                    {item.r}
                  </Typography>
                  {item.rt && (
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem', mt: 0.5 }}>
                      {item.rt}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Saved feedback display */}
              {status?.status === 'edited' && status.feedback && !isWritingFeedback && (
                <Box sx={{ mt: 1.5, px: 0.5 }}>
                  <Typography variant="body2" sx={{ color: '#1976d2', fontSize: '0.85rem' }}>
                    💬 הערה: {status.feedback}
                  </Typography>
                </Box>
              )}

              {/* Feedback input field */}
              {isWritingFeedback && (
                <Box sx={{ mt: 2, p: 1.5, backgroundColor: 'rgba(33, 150, 243, 0.04)', borderRadius: 1.5 }}>
                  <TextField
                    multiline
                    fullWidth
                    minRows={2}
                    maxRows={4}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    variant="outlined"
                    size="small"
                    placeholder="למה התשובה לא מתאימה? (למשל: קצר מדי, טון לא נכון, חסר מידע...)"
                    sx={{ mb: 1 }}
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleSaveFeedback(guestKey)}
                      disabled={!feedbackText.trim()}
                      sx={{ textTransform: 'none', fontSize: '0.8rem' }}
                    >
                      שמור הערה
                    </Button>
                    <Button
                      size="small"
                      onClick={handleCancelFeedback}
                      sx={{ textTransform: 'none', fontSize: '0.8rem', color: 'text.secondary' }}
                    >
                      ביטול
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Action buttons */}
              <Box sx={{
                display: 'flex',
                gap: 1,
                mt: 2,
                pt: 1.5,
                borderTop: '1px solid',
                borderColor: 'divider',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}>
                {status && (
                  <Chip
                    size="small"
                    label={
                      status.status === 'approved' ? 'מאושר' :
                      status.status === 'edited' ? 'הערה' :
                      'התעלמות'
                    }
                    color={
                      status.status === 'approved' ? 'success' :
                      status.status === 'edited' ? 'primary' :
                      'default'
                    }
                    variant="outlined"
                    onDelete={() => handleClearStatus(guestKey)}
                    sx={{ mr: 1 }}
                  />
                )}
                <Button
                  size="small"
                  startIcon={<CheckIcon />}
                  onClick={() => handleApprove(guestKey)}
                  sx={{
                    color: '#4caf50',
                    textTransform: 'none',
                    fontWeight: status?.status === 'approved' ? 700 : 400,
                    '&:hover': { backgroundColor: 'rgba(76, 175, 80, 0.08)' },
                  }}
                >
                  אישור
                </Button>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => handleStartFeedback(guestKey)}
                  sx={{
                    color: '#2196f3',
                    textTransform: 'none',
                    fontWeight: status?.status === 'edited' ? 700 : 400,
                    '&:hover': { backgroundColor: 'rgba(33, 150, 243, 0.08)' },
                  }}
                >
                  עריכה
                </Button>
                <Button
                  size="small"
                  startIcon={<CloseIcon />}
                  onClick={() => handleIgnore(guestKey)}
                  sx={{
                    color: '#9e9e9e',
                    textTransform: 'none',
                    fontWeight: status?.status === 'ignored' ? 700 : 400,
                    '&:hover': { backgroundColor: 'rgba(158, 158, 158, 0.08)' },
                  }}
                >
                  התעלמות
                </Button>
              </Box>
            </Paper>
          );
        }

        return null;
      })}
    </Box>
  );
};

export default Messages;
