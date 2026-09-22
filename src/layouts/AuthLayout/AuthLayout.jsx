import { Outlet } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import loginPageImage from "../../assets/img/login-page-image.png";

export default function AuthLayout() {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: { xs: "center", md: "flex-end" },
        minHeight: "100vh",
        bgcolor: "#F9F9F9",
        backgroundImage: `url(${loginPageImage})`,
        backgroundSize: { xs: "cover", md: "contain" },
        backgroundPosition: { xs: "center", md: "left 5% center" },
        backgroundRepeat: "no-repeat",
      }}
    >
      <Box
        sx={{
          width: { xs: "100%", md: "50%", lg: "40%" },
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          p: 4,
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 500,
            bgcolor: "background.paper",
            borderRadius: "25px",
            p: { xs: 4, md: 6 },
            boxShadow: "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px",
          }}
        >
          <Outlet />
          <Typography
            sx={{
              mt: 4,
              color: "#2563eb",
              fontSize: "0.8rem",
              fontWeight: 500,
              textAlign: "center",
            }}
          >
            &copy; {new Date().getFullYear()} Susee Group Of Companies. All
            rights reserved.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
