import { Button as MuiButton, CircularProgress } from "@mui/material";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  fullWidth = false,
  leftIcon: LeftIcon = null,
  rightIcon: RightIcon = null,
  className = "",
  onClick,
  type = "button",
  sx = {},
  ...props
}) {
  let muiVariant = "contained";
  let color = "primary";

  let baseSx = {};

  switch (variant) {
    case "primary":
      muiVariant = "contained";
      color = "primary";
      baseSx = {
        background: "linear-gradient(145deg, #0d2f6e 0%, #1a4fc4 50%, #2563eb 100%)",
        color: "#ffffff !important",
        fontWeight: 600,
        boxShadow: "0 2px 4px rgba(26, 79, 196, 0.16), 0 1px 2px rgba(0, 0, 0, 0.06)",
        border: "1px solid transparent",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          background: "linear-gradient(145deg, #0a2558 0%, #1643a6 50%, #1d4ed8 100%)",
          color: "#ffffff !important",
          boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35), 0 2px 4px rgba(0, 0, 0, 0.1)",
          transform: "translateY(-1px)",
        },
        "&:active": {
          transform: "translateY(0)",
          boxShadow: "0 1px 3px rgba(26, 79, 196, 0.2)",
        },
        "&.Mui-disabled": {
          background: "none",
          backgroundColor: isLoading ? "#1a4fc4" : "#E2E8F0",
          opacity: isLoading ? 0.7 : 1,
          color: (isLoading ? "#ffffff" : "#94A3B8") + " !important",
          transform: "none",
          boxShadow: "none",
        },
      };
      break;
    case "secondary":
      muiVariant = "outlined";
      color = "inherit";
      baseSx = {
        color: "#475569",
        borderColor: "#CBD5E1",
        backgroundColor: "#ffffff",
        boxShadow: "none",
        fontWeight: 600,
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          backgroundColor: "#F1F5F9",
          borderColor: "#94A3B8",
          color: "#0F172A",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.04)",
          transform: "translateY(-1px)",
        },
        "&:active": {
          transform: "translateY(0)",
        },
        "&.Mui-disabled": {
          borderColor: "#E2E8F0",
          backgroundColor: "transparent",
          color: "#94A3B8",
          opacity: isLoading ? 0.7 : 1,
        },
      };
      break;
    case "back":
    case "outline-primary":
      muiVariant = "outlined";
      color = "primary";
      baseSx = {
        color: "#1a4fc4",
        borderColor: "#1a4fc4",
        backgroundColor: "transparent",
        boxShadow: "none",
        borderRadius: "8px",
        fontWeight: 600,
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          backgroundColor: "#1a4fc4",
          borderColor: "#1a4fc4",
          color: "#ffffff !important",
          boxShadow: "0 4px 12px rgba(26, 79, 196, 0.2)",
          transform: "translateY(-1px)",
        },
        "&:active": {
          transform: "translateY(0)",
        },
        "&.Mui-disabled": {
          borderColor: "#E2E8F0",
          backgroundColor: "transparent",
          color: "#94A3B8",
          opacity: isLoading ? 0.7 : 1,
        },
      };
      break;
    case "success":
      muiVariant = "contained";
      color = "success";
      baseSx = {
        background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
        color: "#ffffff !important",
        fontWeight: 600,
        boxShadow: "0 2px 4px rgba(16, 185, 129, 0.2)",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          background: "linear-gradient(135deg, #047857 0%, #059669 100%)",
          color: "#ffffff !important",
          boxShadow: "0 4px 12px rgba(16, 185, 129, 0.35)",
          transform: "translateY(-1px)",
        },
        "&:active": {
          transform: "translateY(0)",
        },
      };
      break;
    case "danger":
      muiVariant = "contained";
      color = "error";
      baseSx = {
        background: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
        color: "#ffffff !important",
        fontWeight: 600,
        boxShadow: "0 2px 4px rgba(239, 68, 68, 0.2)",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          background: "linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)",
          color: "#ffffff !important",
          boxShadow: "0 4px 12px rgba(239, 68, 68, 0.35)",
          transform: "translateY(-1px)",
        },
        "&:active": {
          transform: "translateY(0)",
        },
      };
      break;
    case "warning":
      muiVariant = "contained";
      color = "warning";
      baseSx = {
        background: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)",
        color: "#ffffff !important",
        fontWeight: 600,
        boxShadow: "0 2px 4px rgba(245, 158, 11, 0.2)",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          background: "linear-gradient(135deg, #b45309 0%, #d97706 100%)",
          color: "#ffffff !important",
          boxShadow: "0 4px 12px rgba(245, 158, 11, 0.35)",
          transform: "translateY(-1px)",
        },
        "&:active": {
          transform: "translateY(0)",
        },
      };
      break;
    case "ghost":
      muiVariant = "text";
      color = "inherit";
      baseSx = {
        color: "#475569",
        backgroundColor: "transparent",
        boxShadow: "none",
        fontWeight: 500,
        transition: "all 0.2s ease",
        "&:hover": {
          backgroundColor: "#F1F5F9",
          color: "#0F172A",
        },
      };
      break;
    case "outline":
      muiVariant = "outlined";
      color = "inherit";
      baseSx = {
        color: "#334155",
        borderColor: "#CBD5E1",
        backgroundColor: "#ffffff",
        boxShadow: "none",
        fontWeight: 600,
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          backgroundColor: "#F8FAFC",
          borderColor: "#94A3B8",
          color: "#0F172A",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.04)",
          transform: "translateY(-1px)",
        },
        "&:active": {
          transform: "translateY(0)",
        },
      };
      break;
    case "link":
      muiVariant = "text";
      color = "info";
      baseSx = {
        color: "#2563eb",
        padding: "4px 8px",
        minWidth: "auto",
        fontWeight: 600,
        "&:hover": {
          backgroundColor: "transparent",
          textDecoration: "underline",
          color: "#1d4ed8",
        },
      };
      break;
    default:
      break;
  }

  const muiSize = size === "sm" ? "small" : size === "lg" ? "large" : "medium";

  return (
    <MuiButton
      type={type}
      variant={muiVariant}
      color={color}
      size={muiSize}
      fullWidth={fullWidth}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={className}
      startIcon={
        isLoading ? (
          <CircularProgress size={16} color="inherit" />
        ) : LeftIcon ? (
          <LeftIcon size={16} />
        ) : null
      }
      endIcon={!isLoading && RightIcon ? <RightIcon size={16} /> : null}
      sx={{ ...baseSx, ...sx }}
      {...props}
    >
      {children}
    </MuiButton>
  );
}
