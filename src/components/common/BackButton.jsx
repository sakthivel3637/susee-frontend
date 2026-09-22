import React from 'react';
import { Box } from '@mui/material';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function BackButton({ 
  to, 
  onClick, 
  label = 'Back', 
  sx = {} 
}) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) onClick();
    else if (to) navigate(to);
    else navigate(-1);
  };

  return (
    <Box
      component="button"
      onClick={handleClick}
      className="back-btn"
    >
      <ArrowLeft size={16} /> {label}
    </Box>
  );
}
