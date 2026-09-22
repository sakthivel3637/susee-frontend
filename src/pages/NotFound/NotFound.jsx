import { Link } from 'react-router-dom';
import { Box, Typography, Container, useTheme, Button } from '@mui/material';
import { Home, AlertCircle } from 'lucide-react';

export default function NotFound() {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
        px: 3,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '100%',
          background: `radial-gradient(circle at 50% -20%, ${theme.palette.primary.light}20, transparent 60%)`,
          zIndex: 0,
        }
      }}
    >
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box 
          sx={{ 
            width: 120, 
            height: 120, 
            borderRadius: '50%', 
            bgcolor: `${theme.palette.primary.main}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 4,
            boxShadow: `0 0 0 10px ${theme.palette.primary.main}05`,
          }}
        >
          <AlertCircle size={64} color={theme.palette.primary.main} strokeWidth={1.5} />
        </Box>
        
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '5rem', md: '7rem' },
            fontWeight: 800,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1,
            mb: 2,
            letterSpacing: '-0.02em',
          }}
        >
          404
        </Typography>
        
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700, 
            color: 'text.primary', 
            mb: 2,
            fontSize: { xs: '1.5rem', md: '2rem' }
          }}
        >
          Page Not Found
        </Typography>
        
        <Typography 
          variant="body1" 
          color="text.secondary" 
          sx={{ 
            mb: 5,
            fontSize: '1.1rem',
            lineHeight: 1.6,
          }}
        >
          The page you are looking for might have been removed, or is temporarily unavailable. Let's get you back on track.
        </Typography>
        
        <Button 
          component={Link} 
          to="/" 
          variant="contained" 
          startIcon={<Home size={20} />} 
          size="large"
          sx={{
            px: 4,
            py: 1.5,
            borderRadius: 2,
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '1.05rem',
            bgcolor: 'primary.main',
            color: 'white',
            border: '2px solid transparent',
            boxShadow: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: 'transparent',
              color: 'primary.main',
              borderColor: 'primary.main',
              boxShadow: 'none',
              transform: 'none',
            }
          }}
        >
          Return to Dashboard
        </Button>
      </Container>
    </Box>
  );
}
