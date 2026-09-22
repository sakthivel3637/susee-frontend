import React from 'react';
import Button from './Button';

export default function ResetFiltersButton({ onReset }) {
  return (
    <Button
      variant="primary"
      onClick={onReset}
    >
      Reset
    </Button>
  );
}
