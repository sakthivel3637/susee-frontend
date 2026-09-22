import { useFormContext, Controller } from "react-hook-form";
import { TextField, Box, Typography } from "@mui/material";
export default function RHFTextarea({
  name,
  label,
  placeholder,
  rows = 4,
  required = false,
  disabled = false,
  hint,
  className = "",
  sx = {},
  ...props
}) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Box sx={{ mb: 2 }}>
          {label && (
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, color: "#334155", mb: 0.75 }}
            >
              {label} {required && <span style={{ color: "#E11D48" }}>*</span>}
            </Typography>
          )}
          <TextField
            {...field}
            multiline
            rows={rows}
            placeholder={placeholder}
            disabled={disabled}
            error={!!error}
            helperText={error ? error.message : hint}
            fullWidth
            className={className}
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
      )}
    />
  );
}
