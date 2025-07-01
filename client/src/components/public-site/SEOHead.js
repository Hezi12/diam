import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { usePublicLanguage, usePublicTranslation } from '../../contexts/PublicLanguageContext';

const SEOHead = ({ 
  title, 
  description, 
  keywords, 
  location = 'airport',
  canonical,
  ogImage,
  structuredData 
}) => {
  const locationPath = useLocation();
  const { currentLanguage } = usePublicLanguage();
  const t = usePublicTranslation();
  
  // בסיס URL - צריך להחליף לדומיין האמיתי
  const baseUrl = 'https://www.diamhotels.com';
  const currentUrl = `${baseUrl}${locationPath.pathname}`;
  
  // מידע ספציפי לכל אתר
  const siteInfo = {
    airport: {
      name: 'Airport Guest House',
      address: 'הארז 12, אור יהודה',
      phone: '+972-3-1234567',
      email: 'airport@diamhotels.com',
      defaultTitle: 'מלונית Airport Guest House - נמל התעופה בן גוריון | אור יהודה',
      defaultDescription: 'מלונית מודרנית ונוחה ליד נמל התעופה בן גוריון. חדרים נקיים ומאובזרים, Wi-Fi חינם, חניה וקרבה לשדה התעופה. הזמנה מיידית אונליין.',
      defaultKeywords: 'מלונית נמל התעופה, Airport Guest House, מלון בן גוריון, אירוח אור יהודה, מלונית שדה תעופה, חדרים ליד נתבג'
    },
    rothschild: {
      name: 'Rothschild 79',
      address: 'רוטשילד 79, פתח תקווה',
      phone: '+972-3-7654321',
      email: 'rothschild@diamhotels.com',
      defaultTitle: 'Rothschild 79 - אירוח באמצע פתח תקווה | חדרים פרטיים',
      defaultDescription: 'אירוח איכותי במרכז פתח תקווה. חדרים פרטיים ונקיים, חניה במקום, קרוב לתחבורה ציבורית וקניות. תמורה מעולה למחיר.',
      defaultKeywords: 'מלון פתח תקווה, אירוח פתח תקווה, Rothschild 79, חדרים פתח תקווה, מלונית פתח תקווה, אירוח מרכז'
    }
  };
  
  const site = siteInfo[location];
  const siteTitle = title || site.defaultTitle;
  const siteDescription = description || site.defaultDescription;
  const siteKeywords = keywords || site.defaultKeywords;
  
  // Structured Data (JSON-LD)
  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    "name": site.name,
    "url": currentUrl,
    "logo": `${baseUrl}/icons/logo192.png`,
    "image": ogImage || `${baseUrl}/icons/logo512.png`,
    "description": siteDescription,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": site.address,
      "addressLocality": location === 'airport' ? 'אור יהודה' : 'פתח תקווה',
      "addressCountry": "IL"
    },
    "telephone": site.phone,
    "email": site.email,
    "priceRange": "₪₪",
    "amenityFeature": [
      {
        "@type": "LocationFeatureSpecification",
        "name": "Free WiFi",
        "value": true
      },
      {
        "@type": "LocationFeatureSpecification", 
        "name": "Free Parking",
        "value": true
      },
      {
        "@type": "LocationFeatureSpecification",
        "name": "Air Conditioning", 
        "value": true
      }
    ],
    "checkinTime": "15:00",
    "checkoutTime": "11:00"
  };
  
  const finalStructuredData = structuredData || defaultStructuredData;

  return (
    <Helmet>
      {/* בסיסי SEO */}
      <title>{siteTitle}</title>
      <meta name="description" content={siteDescription} />
      <meta name="keywords" content={siteKeywords} />
      <meta name="robots" content="index, follow" />
      <meta name="author" content="DIAM Hotels" />
      
      {/* שפה וכיוון */}
      <html lang={currentLanguage} dir={currentLanguage === 'he' ? 'rtl' : 'ltr'} />
      
      {/* Open Graph למדיה חברתית */}
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={siteDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:site_name" content={site.name} />
      <meta property="og:image" content={ogImage || `${baseUrl}/icons/logo512.png`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content={currentLanguage === 'he' ? 'he_IL' : 'en_US'} />
      
      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={siteDescription} />
      <meta name="twitter:image" content={ogImage || `${baseUrl}/icons/logo512.png`} />
      
      {/* קנוניקל URL */}
      <link rel="canonical" href={canonical || currentUrl} />
      
      {/* מידע נוסף */}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      <meta name="theme-color" content="#1976d2" />
      
      {/* קישורים אלטרנטיביים */}
      <link rel="alternate" hrefLang="he" href={currentUrl} />
      <link rel="alternate" hrefLang="en" href={currentUrl.replace('/he/', '/en/')} />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(finalStructuredData)}
      </script>
    </Helmet>
  );
};

export default SEOHead; 