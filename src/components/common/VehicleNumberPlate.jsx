import React from "react";
import { Box } from "@mui/material";

const PLATE_COLORS = [
  "#1E40AF",
  "#991B1B",
  "#3730A3",
  "#065F46",
  "#92400E",
  "#5B21B6",
  "#9D174D",
  "#155E75",
  "#115E59",
  "#9A3412",
  "#166534",
];

export default function VehicleNumberPlate({ vehicleNumber, size = "md" }) {
  if (!vehicleNumber) return null;

  const fontSize = size === "sm" ? "0.75rem" : "0.85rem";
  let hash = 0;
  for (let i = 0; i < vehicleNumber.length; i++) {
    hash = vehicleNumber.charCodeAt(i) + ((hash << 5) - hash);
  }
  const textColor = PLATE_COLORS[Math.abs(hash) % PLATE_COLORS.length];

  return (
    <Box
      component="span"
      sx={{
        display: "inline-block",
        fontFamily: "'Inter', sans-serif",
        fontWeight: 800,
        fontSize,
        color: textColor,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        whiteSpace: "nowrap",
      }}
    >
      {vehicleNumber}
    </Box>
  );
}
