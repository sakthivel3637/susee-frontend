import { useState, useMemo } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { TextField, MenuItem, Box, Typography, InputAdornment, } from "@mui/material";
import { Search, Edit2 } from "lucide-react";

export default function RHFSelect({
  name,
  label,
  options = [],
  placeholder = "Select an option",
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
        .includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

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
              {" "}
              {label}{" "}
              {required && <span style={{ color: "#E11D48" }}>*</span>}{" "}
            </Typography>
          )}
          <TextField
            {...field}
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
              displayEmpty: true,
              onClose: () => setSearchTerm(""),
              renderValue: (selectedVal) => {
                if (!selectedVal) {
                  return <span style={{ color: "#94A3B8" }}>{placeholder}</span>;
                }
                const selectedOption = options.find(
                  (opt) => String(opt.value) === String(selectedVal)
                );
                return selectedOption ? selectedOption.label : selectedVal;
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

            <MenuItem
              value=""
              disabled
              sx={{ display: searchTerm ? "none" : "block" }}
            >
              <span style={{ color: "#94A3B8" }}>{placeholder}</span>
            </MenuItem>

            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <MenuItem
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                  sx={{
                    display: "flex",
                    justify: "space-between",
                    alignItems: "center",
                    cursor: opt.disabled ? "not-allowed" : "pointer",
                    "&.Mui-disabled": {
                      pointerEvents: "auto !important",
                      opacity: 0.75,
                      bgcolor: "#F8FAFC",
                    },
                    ...opt.sx,
                  }}
                >
                  <Box
                    sx={{
                      flexGrow: 1,
                      pr: 1,
                      minWidth: 0,
                      cursor: opt.disabled ? "not-allowed" : "pointer",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: opt.disabled ? "#94A3B8" : "inherit",
                        fontWeight: opt.disabled ? 400 : 500,
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                      }}
                    >
                      {opt.label}
                    </Typography>
                  </Box>
                  {opt.action && (
                    <Box
                      component="span"
                      title={opt.actionTooltip || "Edit option"}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        opt.action(opt.value);
                      }}
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        p: 0.75,
                        borderRadius: "4px",
                        cursor: "pointer",
                        color: "#0284C7",
                        bgcolor: "#E0F2FE",
                        "&:hover": { bgcolor: "#BAE6FD", color: "#0369A1" },
                        zIndex: 10,
                      }}
                    >
                      {opt.actionIcon || <Edit2 size={14} />}
                    </Box>
                  )}
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>
                <span style={{ color: "#94A3B8" }}>No options found</span>
              </MenuItem>
            )}
          </TextField>
        </Box>
      )}
    />
  );
}
