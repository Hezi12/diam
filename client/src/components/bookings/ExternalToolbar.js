import React from 'react';
import { Box, IconButton, Tooltip, Divider } from '@mui/material';
import PaymentIcon from '@mui/icons-material/Payment';
import ApartmentIcon from '@mui/icons-material/Apartment';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import { STYLE_CONSTANTS } from '../../design-system/styles/StyleConstants';

/**
 * רכיב סרגל כלים עם קישורים לאתרים חיצוניים
 */
const ExternalToolbar = () => {
  const colors = STYLE_CONSTANTS.colors;
  
  // רשימת האתרים החיצוניים
  const externalSites = [
    {
      name: 'Credit Guard',
      url: 'https://console.creditguard.co.il/html/login.html',
      icon: <PaymentIcon />,
      color: '#00a651'
    },
    {
      name: 'Booking.com',
      url: 'https://account.booking.com/sign-in?op_token=EgVvYXV0aCKyAQoUNlo3Mm9IT2QzNk5uN3prM3BpcmgSCWF1dGhvcml6ZRoaaHR0cHM6Ly9hZG1pbi5ib29raW5nLmNvbS8qOnsiYXV0aF9hdHRlbXB0X2lkIjoiY2QxZGRlNGYtMDZlNi00ZTU2LTg0YjgtNTZhOTZmNzA4ZDgxIn0yK1JjNkNLOHhRWTE4S0o0TjNGaTh4b3lva1d3YVdyZ0RwdTVUeWZpXzBVNTg6BFMyNTZCBGNvZGUqEzDA2YChwtgnOgBCAFiAmN_p5jI',
      icon: <ApartmentIcon />,
      color: '#003580'
    },
    {
      name: 'Expedia',
      url: 'https://www.expediapartnercentral.com/Account/Logon?returnUrl=https%3A%2F%2Fapps.expediapartnercentral.com%2Flodging%2Fhome%2Fhome%3Fhtid%3D25818583',
      icon: <FlightTakeoffIcon />,
      color: '#00355F'
    }
  ];

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center',
      gap: 2,
      background: 'rgba(0,0,0,0.02)',
      py: 1,
      px: 2.5,
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    }}>
      
      <Box sx={{ display: 'flex', gap: 2 }}>
        {externalSites.map((site, index) => (
          <React.Fragment key={site.name}>
            {index > 0 && (
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            )}
            <Tooltip title={site.name} arrow placement="bottom">
              <IconButton
                component="a" 
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={site.name}
                sx={{
                  color: site.color,
                  bgcolor: `${site.color}15`,
                  p: 1,
                  transition: 'all 0.25s',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    bgcolor: `${site.color}25`,
                    boxShadow: `0 4px 8px ${site.color}30`
                  },
                }}
              >
                {site.icon}
              </IconButton>
            </Tooltip>
          </React.Fragment>
        ))}
      </Box>
    </Box>
  );
};

export default ExternalToolbar; 