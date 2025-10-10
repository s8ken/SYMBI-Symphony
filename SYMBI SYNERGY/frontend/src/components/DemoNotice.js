import React from 'react';
import { Alert, Box, Typography, Link, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const DemoNotice = () => {
  const theme = useTheme();
  const isDemoMode = process.env.REACT_APP_DEMO_MODE === 'true' || process.env.NODE_ENV === 'demo';

  if (!isDemoMode) return null;

  return (
    <Box 
      sx={{ 
        position: 'fixed', 
        top: { xs: 56, sm: 64 }, 
        left: 0, 
        right: 0, 
        zIndex: 1200,
        backgroundColor: 'rgba(13, 71, 161, 0.05)',
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${theme.palette.divider}`,
        py: 1
      }}
    >
      <Box sx={{ 
        maxWidth: 1200, 
        mx: 'auto', 
        px: { xs: 2, sm: 3 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 1
      }}>
        <Chip
          label="🎭 DEMO"
          size="small"
          color="primary"
          variant="outlined"
          sx={{ fontWeight: 600, fontSize: '0.75rem' }}
        />
        <Typography 
          variant="body2" 
          sx={{ 
            color: theme.palette.text.secondary,
            textAlign: 'center',
            fontSize: { xs: '0.8rem', sm: '0.9rem' }
          }}
        >
          Showcasing <strong>SYMBI Trust Protocol</strong> capabilities with limited functionality.
        </Typography>
        <Link 
          href="mailto:contact@symbi-trust.com" 
          sx={{ 
            fontSize: { xs: '0.8rem', sm: '0.9rem' },
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' }
          }}
        >
          Contact for full version →
        </Link>
      </Box>
    </Box>
  );
};

export default DemoNotice;