import { TextField, Box, Typography } from "@mui/material";

export default function Input({
  label,
  required,
  error,
  helperText,
  sx = {},
  ...props
}) {
  return (
    <Box sx={{ mb: 2, width: "100%" }}>
      {label && (
        <Typography
          variant="body2"
          sx={{ fontWeight: 600, color: "#334155", mb: 0.75 }}
        >
          {label} {required && <span style={{ color: "#E11D48" }}>*</span>}
        </Typography>
      )}
      <TextField
        error={!!error}
        helperText={error || helperText}
        fullWidth
        size="small"
        sx={{
          ...sx,
          "& .MuiOutlinedInput-root": {
            borderRadius: "8px",
            bgcolor: "#FFFFFF",
          },
        }}
        {...props}
      />
    </Box>
  );
}
