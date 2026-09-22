import { useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import {
  TextField,
  Box,
  Typography,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Eye, EyeOff } from "lucide-react";
export default function RHFTextField({
  name,
  label,
  placeholder,
  type = "text",
  hint,
  required = false,
  disabled = false,
  readOnly = false,
  className = "",
  sx = {},
  rules = {},
  ...props
}) {
  const { control } = useFormContext();
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordType = type === "password";

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
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
            type={isPasswordType && showPassword ? "text" : type}
            placeholder={placeholder}
            disabled={disabled}
            InputProps={{
              readOnly: readOnly,
              endAdornment: isPasswordType ? (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
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
