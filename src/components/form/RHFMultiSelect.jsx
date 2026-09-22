import { useState, useMemo } from "react";
import { useFormContext, Controller } from "react-hook-form";
import {
  TextField,
  MenuItem,
  Box,
  Typography,
  InputAdornment,
  Checkbox,
  ListItemText
} from "@mui/material";
import { Search } from "lucide-react";

export default function RHFMultiSelect({
  name,
  label,
  options = [],
  placeholder = "Select options",
  required = false,
  disabled = false,
  hint,
  className = "",
  sx = {},
  ...props
}) {
  const { control } = useFormContext();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter((opt) =>
      (opt.label || "")
        .toString()
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
    );
  }, [options, searchTerm]);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { value, onChange, ...fieldProps }, fieldState: { error } }) => {
        const selectedValues = Array.isArray(value) ? value : [];

        return (
          <Box sx={{ mb: 2 }}>
            {label && (
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: "#334155", mb: 0.75 }}
              >
                {" "}
                {label}{" "}
                {required && <span style={{ color: "#E11D48" }}>*</span>}{" "}
              </Typography>
            )}
            <TextField
              {...fieldProps}
              value={selectedValues}
              onChange={(e) => {
                // e.target.value contains the array of selected options
                onChange(e.target.value);
              }}
              select
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
              SelectProps={{
                multiple: true,
                displayEmpty: true,
                onClose: () => setSearchTerm(""),
                renderValue: (selected) => {
                  if (selected.length === 0) {
                    return <span style={{ color: "#94A3B8" }}>{placeholder}</span>;
                  }
                  const selectedLabels = options
                    .filter(opt => selected.includes(opt.value))
                    .map(opt => opt.label);
                  return selectedLabels.join(", ");
                },
                MenuProps: {
                  autoFocus: false,
                  PaperProps: {
                    sx: {
                      maxHeight: 320,
                      boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.08)",
                      borderRadius: "8px",
                      mt: 0.5,
                    },
                  },
                },
              }}
              {...props}
            >
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  position: "sticky",
                  top: 0,
                  bgcolor: "background.paper",
                  zIndex: 2,
                  borderBottom: "1px solid #f1f5f9",
                  mb: 1,
                }}
                onKeyDown={(e) => e.stopPropagation()}
                onClickCapture={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={18} color="#94A3B8" />{" "}
                      </InputAdornment>
                    ),
                    sx: { borderRadius: "6px" },
                  }}
                />
              </Box>

              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    <Checkbox checked={selectedValues.includes(opt.value)} />
                    <ListItemText primary={opt.label} />
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>
                  <span style={{ color: "#94A3B8" }}>No options found</span>
                </MenuItem>
              )}
            </TextField>
          </Box>
        );
      }}
    />
  );
}
