import React from 'react';
import { 
  Grid, Box, Paper, Button, IconButton 
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon, 
  Delete as DeleteIcon 
} from '@mui/icons-material';

const RoomImagesSection = ({ imagePreview, viewOnly, onUpload, onRemove }) => {
  return (
    <Grid item xs={12}>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
        {imagePreview.map((src, index) => (
          <Paper 
            key={index}
            elevation={0}
            sx={{ 
              width: 80, 
              height: 60, 
              position: 'relative',
              borderRadius: 1,
              overflow: 'hidden',
              border: '1px solid rgba(0,0,0,0.08)'
            }}
          >
            <img 
              src={src} 
              alt={`תמונה ${index+1}`} 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
            {!viewOnly && (
              <IconButton
                size="small"
                sx={{ 
                  position: 'absolute', 
                  top: 1, 
                  right: 1,
                  backgroundColor: 'rgba(255,255,255,0.7)',
                  width: 18,
                  height: 18,
                  padding: 0,
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.9)',
                  }
                }}
                onClick={() => onRemove(index)}
              >
                <DeleteIcon sx={{ fontSize: 12 }} />
              </IconButton>
            )}
          </Paper>
        ))}
        
        {!viewOnly && (
          <Button
            component="label"
            variant="outlined"
            size="small"
            sx={{ 
              width: 80, 
              height: 60,
              borderStyle: 'dashed',
              borderRadius: 1,
              fontSize: '0.7rem',
              minWidth: 'unset',
              p: 0.5
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <CloudUploadIcon sx={{ fontSize: 16, mb: 0.5 }} />
              העלה
            </Box>
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={onUpload}
            />
          </Button>
        )}
      </Box>
    </Grid>
  );
};

export default RoomImagesSection; 