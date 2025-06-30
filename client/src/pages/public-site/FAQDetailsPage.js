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
import { usePublicTranslation } from '../../contexts/PublicLanguageContext';

const FAQDetailsPage = () => {
  const t = usePublicTranslation();
  
  const faqs = [
    {
      question: t('faq.questions.q1'),
      answer: t('faq.questions.a1')
    },
    {
      question: t('faq.questions.q2'),
      answer: t('faq.questions.a2')
    },
    {
      question: t('faq.questions.q3'),
      answer: t('faq.questions.a3')
    },
    {
      question: t('faq.questions.q4'),
      answer: t('faq.questions.a4')
    },
    {
      question: t('faq.questions.q5'),
      answer: t('faq.questions.a5')
    },
    {
      question: t('faq.questions.q6'),
      answer: t('faq.questions.a6')
    },
    {
      question: t('faq.questions.q7'),
      answer: t('faq.questions.a7')
    }
  ];

  const services = [
    { 
      icon: <WifiIcon />, 
      title: t('faq.servicesItems.wifi.title'), 
      description: t('faq.servicesItems.wifi.description') 
    },
    { 
      icon: <AcIcon />, 
      title: t('faq.servicesItems.ac.title'), 
      description: t('faq.servicesItems.ac.description') 
    },
    { 
      icon: <ParkingIcon />, 
      title: t('faq.servicesItems.parking.title'), 
      description: t('faq.servicesItems.parking.description') 
    },
    { 
      icon: <BedroomParentIcon />, 
      title: t('faq.servicesItems.rooms.title'), 
      description: t('faq.servicesItems.rooms.description') 
    },
    { 
      icon: <FlightIcon />, 
      title: t('faq.servicesItems.shuttle.title'), 
      description: t('faq.servicesItems.shuttle.description') 
    }
  ];

  const policies = [
    t('faq.policies.checkin'),
    t('faq.policies.checkout'),
    t('faq.policies.selfCheckin'),
    t('faq.policies.noSmoking'),
    t('faq.policies.noParties')
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
            {t('faq.faqTitle')}
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
            {t('faq.faqSubtitle')}
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* שאלות נפוצות */}
          <Grid item xs={12} lg={8}>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 600, color: '#1e293b' }}>
              {t('faq.frequentlyAsked')}
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
                  {t('faq.services')}
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
                  {t('faq.housePolicies')}
                </Typography>
                <List sx={{ p: 0 }}>
                  {policies.map((policy, index) => (
                    <ListItem key={index} sx={{ px: 0, py: 1 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <CheckCircleIcon sx={{ color: '#059669', fontSize: 20 }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={policy}
                        primaryTypographyProps={{
                          variant: 'body2',
                          sx: { lineHeight: 1.5 }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

            {/* יצירת קשר */}
            <Card 
              elevation={2} 
              sx={{ 
                border: '1px solid #e2e8f0',
                borderRadius: 2
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#1e293b' }}>
                  {t('faq.contactDetails')}
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <WhatsAppIcon sx={{ color: '#25D366', mr: 2 }} />
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {t('contact.whatsapp')}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        component="a"
                        href="https://wa.me/972506070260"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ 
                          color: '#25D366',
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        050-607-0260
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PhoneIcon sx={{ color: '#6b7280', mr: 2 }} />
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {t('contact.phone')}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        component="a"
                        href="tel:+972506070260"
                        sx={{ 
                          color: '#6b7280',
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        050-607-0260
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocationIcon sx={{ color: '#dc2626', mr: 2 }} />
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {t('faq.location')}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b' }}>
                        {t('location.address')}
                      </Typography>
                    </Box>
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