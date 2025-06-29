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
  Flight as FlightIcon,
  BedroomParent as BedroomParentIcon,
  WhatsApp as WhatsAppIcon
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
      answer: "צ'ק-אין החל מ-15:00, צ'ק-אאוט עד 10:00. ניתן לתאם שעות שונות מראש בתיאום טלפוני."
    },
    {
      question: "האם יש חניה חינם?",
      answer: "כן, אין בעיה של חניה באזור. יש מקומות חניה זמינים ונוחים בסביבה."
    },
    {
      question: "כמה זמן לוקח להגיע לנתב״ג?",
      answer: "המלונית נמצאת במרחק 15 דקות נסיעה מנמל התעופה בן גוריון, כמובן תלוי בתנועה."
    },
    {
      question: "האם יש הסעות לשדה התעופה?",
      answer: "אנחנו עובדים עם מוניות מקומיות ואפשר לתאם מראש ולהזמין. יש עלות נוספת עבור השירות."
    },
    {
      question: "האם המקום מתאים למשפחות עם ילדים?",
      answer: "כן, אנחנו מקבלים בברכה משפחות עם ילדים. יש אפשרות למיטות נוספות בתיאום מראש."
    },
    {
      question: "מה יש לאכול באזור?",
      answer: "יש הרבה מסעדות וגם קניון בקרבת מקום. במקום האירוח יהיה לכם את כל הפרטים על המקומות הטובים באזור."
    }
  ];

  const services = [
    { icon: <WifiIcon />, title: "Wi-Fi חינם", description: "אינטרנט אלחוטי מהיר בכל החדרים" },
    { icon: <AcIcon />, title: "מזגן", description: "מיזוג אוויר מתכוונן בכל חדר" },
    { icon: <ParkingIcon />, title: "חניה חינם", description: "מקומות חניה זמינים" },
    { icon: <BedroomParentIcon />, title: "חדרים פרטיים", description: "חדרים פרטיים לגמרי כולל שירותים ומקלחת" },
    { icon: <FlightIcon />, title: "הסעות", description: "הסעה לשדה התעופה" }
  ];

  const policies = [
    "צ'ק-אין החל מהשעה 15:00",
    "צ'ק-אאוט עד השעה 10:00", 
    "צ'ק-אין מהיר עצמאי בכל שעה",
    "עישון אסור בחדרים",
    "אסור לקיים מסיבות או אירועים - אנחנו דואגים לשמור על שקט ונוחות לכל האורחים"
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
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1.5 }}>
                        <Box sx={{ 
                          color: '#059669', 
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
                    <ListItem key={index} sx={{ px: 0, py: 0.5, direction: 'rtl', gap: 1.5 }}>
                      <ListItemIcon sx={{ minWidth: 'auto', ml: 0, mr: 0 }}>
                        <CheckCircleIcon sx={{ color: '#059669', fontSize: 20 }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={policy}
                        sx={{ 
                          m: 0,
                          textAlign: 'right',
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
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1.5 }}>
                    <PhoneIcon sx={{ color: '#dc2626', fontSize: 20 }} />
                    <Typography 
                      variant="body2" 
                      component="a"
                      href="tel:+972506070260"
                      sx={{ 
                        fontWeight: 500,
                        color: 'inherit',
                        textDecoration: 'none',
                        '&:hover': {
                          color: '#dc2626'
                        }
                      }}
                    >
                      0506070260
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1.5 }}>
                    <EmailIcon sx={{ color: '#dc2626', fontSize: 20 }} />
                    <Typography 
                      variant="body2" 
                      component="a"
                      href="mailto:diamshotels@gmail.com"
                      sx={{ 
                        fontWeight: 500,
                        color: 'inherit',
                        textDecoration: 'none',
                        '&:hover': {
                          color: '#dc2626'
                        }
                      }}
                    >
                      diamshotels@gmail.com
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <WhatsAppIcon sx={{ color: '#25D366', fontSize: 20 }} />
                    <Typography 
                      variant="body2" 
                      component="a"
                      href="https://wa.me/972506070260"
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ 
                        fontWeight: 500,
                        color: '#25D366',
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                    >
                      זמינים בווטסאפ - עונים מהר!
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