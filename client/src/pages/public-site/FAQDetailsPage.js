import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  Grid,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  LocalParking as ParkingIcon,
  Wifi as WifiIcon,
  AcUnit as AcIcon,
  Restaurant as RestaurantIcon,
  LocalLaundryService as LaundryIcon,
  Security as SecurityIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Flight as FlightIcon
} from '@mui/icons-material';
import PublicSiteLayout from '../../components/public-site/PublicSiteLayout';

const FAQDetailsPage = () => {
  const faqs = [
    {
      question: "מה כלול במחיר הלינה?",
      answer: "המחיר כולל מיטה נוחה, מזגן, טלוויזיה, Wi-Fi חינם, מקלחת פרטית עם מים חמים, מגבות ומצעים נקיים."
    },
    {
      question: "באיזה שעות ניתן להגיע ולעזוב?",
      answer: "צ'ק-אין החל מ-14:00, צ'ק-אאוט עד 11:00. ניתן לתאם שעות שונות מראש בתיאום טלפוני."
    },
    {
      question: "האם יש חניה חינם?",
      answer: "כן, יש חניה חינם ומאובטחת לכל האורחים. החניה נמצאת בשטח המלונית."
    },
    {
      question: "כמה זמן לוקח להגיע לנתב״ג?",
      answer: "המלונית נמצאת במרחק 5-10 דקות נסיעה מנמל התעופה בן גוריון, תלוי בתנועה."
    },
    {
      question: "האם יש הסעות לשדה התעופה?",
      answer: "כן, ניתן לתאם הסעה לשדה התעופה בתיאום מראש. יש עלות נוספת עבור השירות."
    },
    {
      question: "איך מתבצע התשלום?",
      answer: "ניתן לשלם במזומן או בכרטיס אשראי בעת ההגעה למלונית. אין צורך בתשלום מראש."
    },
    {
      question: "מה המדיניות ביטול?",
      answer: "ביטול חינם עד 24 שעות לפני המועד. ביטול ברגע האחרון או אי הגעה עלולים לכלול חיוב."
    },
    {
      question: "האם המקום מתאים למשפחות עם ילדים?",
      answer: "כן, אנחנו מקבלים בברכה משפחות עם ילדים. יש אפשרות למיטות נוספות בתיאום מראש."
    }
  ];

  const services = [
    { icon: <WifiIcon />, title: "Wi-Fi חינם", description: "אינטרנט אלחוטי מהיר בכל החדרים" },
    { icon: <AcIcon />, title: "מזגן", description: "מיזוג אוויר מתכוונן בכל חדר" },
    { icon: <ParkingIcon />, title: "חניה חינם", description: "מקומות חניה מאובטחים" },
    { icon: <SecurityIcon />, title: "אבטחה 24/7", description: "שמירה והתראת אבטחה" },
    { icon: <LaundryIcon />, title: "כביסה", description: "שירותי כביסה בתיאום" },
    { icon: <FlightIcon />, title: "הסעות", description: "הסעה לשדה התעופה" }
  ];

  const policies = [
    "צ'ק-אין החל מהשעה 14:00",
    "צ'ק-אאוט עד השעה 11:00", 
    "ביטול חינם עד 24 שעות מראש",
    "תשלום בהגעה - מזומן או כרטיס אשראי",
    "עישון אסור בחדרים",
    "חיות מחמד בתיאום מראש בלבד",
    "שקט לילי החל מ-22:00"
  ];

  return (
    <PublicSiteLayout>
      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* כותרת ראשית */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography 
            variant="h3" 
            component="h1" 
            sx={{ 
              fontWeight: 600, 
              color: '#1e293b',
              mb: 2
            }}
          >
            שאלות נפוצות ופרטים נוספים
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#64748b',
              fontWeight: 400,
              maxWidth: '600px',
              mx: 'auto'
            }}
          >
            כל מה שחשוב לדעת לפני ההזמנה והגעה למלונית
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* שאלות נפוצות */}
          <Grid item xs={12} lg={8}>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 600, color: '#1e293b' }}>
              שאלות נפוצות
            </Typography>
            
            {faqs.map((faq, index) => (
              <Accordion 
                key={index}
                elevation={1}
                sx={{ 
                  mb: 1,
                  border: '1px solid #e2e8f0',
                  '&:before': { display: 'none' },
                  borderRadius: '8px !important',
                  overflow: 'hidden'
                }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon />}
                  sx={{ 
                    bgcolor: '#f8fafc',
                    '&:hover': { bgcolor: '#f1f5f9' },
                    borderBottom: '1px solid #e2e8f0'
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    {faq.question}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 3 }}>
                  <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                    {faq.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Grid>

          {/* פרטים נוספים */}
          <Grid item xs={12} lg={4}>
            {/* שירותים */}
            <Card 
              elevation={2} 
              sx={{ 
                mb: 4, 
                border: '1px solid #e2e8f0',
                borderRadius: 2
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#1e293b' }}>
                  השירותים שלנו
                </Typography>
                <Grid container spacing={2}>
                  {services.map((service, index) => (
                    <Grid item xs={12} key={index}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ 
                          color: '#059669', 
                          mr: 2,
                          p: 1,
                          bgcolor: 'rgba(5, 150, 105, 0.1)',
                          borderRadius: 1
                        }}>
                          {service.icon}
                        </Box>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {service.title}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#64748b' }}>
                            {service.description}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            {/* כללי המקום */}
            <Card 
              elevation={2} 
              sx={{ 
                mb: 4,
                border: '1px solid #e2e8f0',
                borderRadius: 2
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#1e293b' }}>
                  כללי המקום
                </Typography>
                <List sx={{ p: 0 }}>
                  {policies.map((policy, index) => (
                    <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckCircleIcon sx={{ color: '#059669', fontSize: 20 }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={policy}
                        sx={{ 
                          m: 0,
                          '& .MuiListItemText-primary': {
                            fontSize: '0.9rem'
                          }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

            {/* פרטי קשר מהירים */}
            <Card 
              elevation={2} 
              sx={{ 
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                bgcolor: '#f8fafc'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#1e293b' }}>
                  צריכים עזרה?
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PhoneIcon sx={{ color: '#dc2626', mr: 1, fontSize: 20 }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      050-123-4567
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <EmailIcon sx={{ color: '#dc2626', mr: 1, fontSize: 20 }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      info@airport-guesthouse.co.il
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ScheduleIcon sx={{ color: '#dc2626', mr: 1, fontSize: 20 }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      זמינים 24/7
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </PublicSiteLayout>
  );
};

export default FAQDetailsPage; 