import React from "react";
import { Box, TextField, Typography, Button, CircularProgress } from "@mui/material";
import { Download } from "lucide-react";

export default function DateFilter({
  fromDate,
  toDate,
  onChange,
  onExport,
  isExporting = false,
  sx = {},
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        flexWrap: "wrap",
        ...sx,
      }}
    >
      <TextField
        type="date"
        size="small"
        label="From Date"
        value={fromDate || ""}
        onChange={(e) => onChange && onChange("from", e.target.value)}
        InputLabelProps={{ shrink: true }}
        sx={{
          width: 150,
          "& .MuiOutlinedInput-root": {
            bgcolor: "background.paper",
            borderRadius: "24px",
            fontSize: "0.875rem",
            "& fieldset": { borderColor: "#E2E8F0" },
            "&:hover fieldset": { borderColor: "#CBD5E1" },
            "&.Mui-focused fieldset": {
              borderColor: "primary.main",
              borderWidth: "1px",
            },
          },
        }}
      />
      <Typography variant="body2" color="text.secondary">
        to
      </Typography>
      <TextField
        type="date"
        size="small"
        label="To Date"
        value={toDate || ""}
        onChange={(e) => onChange && onChange("to", e.target.value)}
        InputLabelProps={{ shrink: true }}
        sx={{
          width: 150,
          "& .MuiOutlinedInput-root": {
            bgcolor: "background.paper",
            borderRadius: "24px",
            fontSize: "0.875rem",
            "& fieldset": { borderColor: "#E2E8F0" },
            "&:hover fieldset": { borderColor: "#CBD5E1" },
            "&.Mui-focused fieldset": {
              borderColor: "primary.main",
              borderWidth: "1px",
            },
          },
        }}
      />
      {onExport && (
        <Button
          variant="contained"
          onClick={onExport}
          disabled={isExporting}
          startIcon={isExporting ? <CircularProgress size={16} color="inherit" /> : <Download size={16} />}
          sx={{
            bgcolor: "primary.main",
            color: "white",
            "&:hover": { bgcolor: "primary.dark" },
            borderRadius: "8px",
            textTransform: "none",
            fontSize: "0.875rem",
            height: 40,
            px: 2,
            ml: 0.5,
            boxShadow: "none",
            "&.Mui-disabled": {
              bgcolor: "primary.main",
              color: "white",
              opacity: 0.7
            }
          }}
        >
          {isExporting ? "Exporting..." : "Export"}
        </Button>
      )}
    </Box>
  );
}
