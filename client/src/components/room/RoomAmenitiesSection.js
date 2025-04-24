import React from 'react';
import { 
  Grid, 
  Typography, 
  Box, 
  Checkbox, 
  FormControlLabel, 
  FormGroup,
  FormLabel
} from '@mui/material';
import { styled } from '@mui/material/styles';

// יצירת רכיב עם תמיכה מלאה ב-RTL
const RTLFormControlLabel = styled(FormControlLabel)(({ theme }) => ({
  width: '100%', 
  margin: 0,
  flexDirection: 'row-reverse',
  justifyContent: 'space-between',
  '& .MuiFormControlLabel-label': {
    marginRight: 0,
    marginLeft: 8,
    fontSize: '0.9rem',
  },
  '& .MuiCheckbox-root': {
    padding: '4px',
  }
}));

// קטגוריות שירותים ומתקנים בחדר
const amenitiesCategories = [
  {
    category: "שירותי חדר",
    items: [
      "מיזוג אוויר",
      "טלוויזיה",
      "WiFi",
      "מקרר",
      "כספת",
      "מיני בר",
      "קומקום חשמלי"
    ]
  },
  {
    category: "שירותי חדר אמבטיה",
    items: [
      "מייבש שיער",
      "מוצרי טיפוח",
      "מגבות",
      "חלוקי רחצה",
      "ג'קוזי",
      "אמבטיה"
    ]
  }
];

const RoomAmenitiesSection = ({ formData, onChange, viewOnly }) => {
  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    
    const updatedAmenities = checked
      ? [...(formData.amenities || []), name]
      : (formData.amenities || []).filter(amenity => amenity !== name);
    
    const event = {
      target: {
        name: 'amenities',
        value: updatedAmenities
      }
    };
    
    onChange(event);
  };

  return (
    <Box
      sx={{
        p: 2,
        width: '100%',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        backgroundColor: '#f8f8f8',
      }}
    >
      <Typography 
        variant="h6" 
        sx={{ 
          mb: 2, 
          fontWeight: 'bold', 
          textAlign: 'right',
          direction: 'rtl' 
        }}
      >
        שירותים ומתקנים
      </Typography>
      
      <Grid container spacing={3} sx={{ direction: 'rtl' }}>
        {amenitiesCategories.map((category, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Box>
              <FormLabel 
                component="div" 
                sx={{ 
                  mb: 1, 
                  fontWeight: 'bold', 
                  fontSize: '1rem',
                  color: 'primary.main',
                  textAlign: 'right'
                }}
              >
                {category.category}
              </FormLabel>
              
              <FormGroup sx={{ display: 'flex', flexDirection: 'column' }}>
                {category.items.map((item, itemIndex) => (
                  <RTLFormControlLabel
                    key={itemIndex}
                    control={
                      <Checkbox
                        checked={formData.amenities?.includes(item) || false}
                        onChange={handleCheckboxChange}
                        name={item}
                        disabled={viewOnly}
                        size="small"
                      />
                    }
                    label={item}
                    disabled={viewOnly}
                  />
                ))}
              </FormGroup>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default RoomAmenitiesSection; 