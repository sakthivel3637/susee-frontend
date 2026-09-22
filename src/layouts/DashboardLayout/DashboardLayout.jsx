import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Box, useTheme, useMediaQuery } from "@mui/material";
import Sidebar from "../../components/shared/Sidebar";
import Topbar from "../../components/shared/Topbar";
import useUIStore from "../../store/useUIStore";

export default function DashboardLayout() {
  const theme = useTheme();
  const isLaptop = useMediaQuery("(max-width: 1366px)");
  const { sidebarCollapsed } = useUIStore();
  const [userHasToggled, setUserHasToggled] = useState(false);
  const [lastCollapsedVal, setLastCollapsedVal] = useState(sidebarCollapsed);

  useEffect(() => {
    if (sidebarCollapsed !== lastCollapsedVal) {
      setUserHasToggled(true);
      setLastCollapsedVal(sidebarCollapsed);
    }
  }, [sidebarCollapsed, lastCollapsedVal]);

  const effectiveCollapsed = sidebarCollapsed || (isLaptop && !userHasToggled);
  const sidebarWidth = effectiveCollapsed ? 80 : 260;

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        bgcolor: "background.default",
      }}
    >
      <Sidebar />
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          transition: "margin-left 0.3s",
          height: "100vh",
        }}
      >
        <Topbar />
        <Box
          component="main"
          sx={{ flexGrow: 1, pb: { xs: 2, md: 3 }, pt: 8, overflowY: "auto" }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
