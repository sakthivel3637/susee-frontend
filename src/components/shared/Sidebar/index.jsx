import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Bell,
  Building,
  Car,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Clock,
  Database,
  Droplets,
  FileText,
  LayoutDashboard,
  LogIn,
  LogOut,
  MapPin,
  Monitor,
  Package,
  Paintbrush,
  Plus,
  Settings,
  ShieldCheck,
  Truck,
  User,
  Users,
  Wrench,
} from "lucide-react";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Box,
  Typography,
  Divider,
  IconButton,
  useTheme,
  useMediaQuery,
  Tooltip,
  Popover,
  Avatar,
  Menu,
  MenuItem,
} from "@mui/material";
import useAuthStore from "../../../store/useAuthStore";
import useUIStore from "../../../store/useUIStore";
import { buildSidebarMenus } from "../../../utils/authAccess";
import { ROUTES } from "../../../config/routes";
import { getInitials, avatarColor } from "../../../utils/helpers";
import { removeRegisteredDeviceToken } from "../../../config/firebase";
import logoImg from "../../../assets/img/logo.jpg";

const ICON_MAP = {
  AlertCircle,
  Bell,
  Building,
  Car,
  CheckSquare,
  ClipboardList,
  Clock,
  Database,
  Droplets,
  FileText,
  LayoutDashboard,
  LogIn,
  LogOut,
  MapPin,
  Monitor,
  Package,
  Paintbrush,
  Plus,
  Settings,
  ShieldCheck,
  Truck,
  User,
  Users,
  Wrench,
  Tool: Wrench,
};

export default function Sidebar() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
  const isDesktopFlyout = useMediaQuery("(min-width: 1201px)");
  const { pathname } = useLocation();
  const { menus: allowedMenus, user, role, logout } = useAuthStore();
  const { sidebarCollapsed, sidebarMobileOpen, setSidebarMobileOpen } =
    useUIStore();
  const isLaptop = useMediaQuery("(max-width: 1366px)");
  const [userHasToggled, setUserHasToggled] = useState(false);
  const [lastCollapsedVal, setLastCollapsedVal] = useState(sidebarCollapsed);
  const [userAnchorEl, setUserAnchorEl] = useState(null);

  useEffect(() => {
    if (sidebarCollapsed !== lastCollapsedVal) {
      setUserHasToggled(true);
      setLastCollapsedVal(sidebarCollapsed);
    }
  }, [sidebarCollapsed, lastCollapsedVal]);

  const effectiveCollapsed = sidebarCollapsed || (isLaptop && !userHasToggled);

  const handleLogout = async () => {
    setUserAnchorEl(null);
    await removeRegisteredDeviceToken();
    logout();
    navigate(ROUTES.LOGIN);
  };

  const [expandedGroups, setExpandedGroups] = useState({});
  const [hoverAnchorEl, setHoverAnchorEl] = useState(null);
  const [hoveredMenuLabel, setHoveredMenuLabel] = useState(null);

  const menus = buildSidebarMenus(allowedMenus, ICON_MAP);

  const handlePopoverOpen = (event, label) => {
    if (isDesktopFlyout) {
      setHoverAnchorEl(event.currentTarget);
      setHoveredMenuLabel(label);
    }
  };

  const handlePopoverClose = () => {
    if (isDesktopFlyout) {
      setHoverAnchorEl(null);
      setHoveredMenuLabel(null);
    }
  };

  const isActive = (path) => {
    if (!path) return false;
    const cleanPath = path.split("?")[0];
    if (cleanPath === "/dashboard" && pathname === "/dashboard") return true;
    if (cleanPath !== "/dashboard") return pathname.startsWith(cleanPath);
    return false;
  };

  const isGroupActive = (item) => {
    if (!item.children) return false;
    return item.children.some((child) => isActive(child.path));
  };
  useEffect(() => {
    setExpandedGroups({});
  }, [pathname]);

  const toggleGroup = (label) => {
    setExpandedGroups((prev) => {
      const isCurrentlyExpanded =
        prev[label] !== undefined
          ? prev[label]
          : isGroupActive({
              children: menus.find((m) => m.label === label)?.children || [],
            });
      return {
        [label]: !isCurrentlyExpanded,
      };
    });
  };

  const sidebarWidth = effectiveCollapsed && !isMobile ? 80 : 260;

  const renderMenuItem = (item, depth = 0, forceExpanded = false) => {
    const hasChildren = item.children && item.children.length > 0;
    const groupActive = isGroupActive(item);
    const isExpanded =
      expandedGroups[item.label] !== undefined
        ? expandedGroups[item.label]
        : groupActive;
    const Icon = item.icon;
    const active = isActive(item.path);
    const isCollapsedState = !forceExpanded && effectiveCollapsed && !isMobile;

    if (hasChildren) {
      const isHovered = hoveredMenuLabel === item.label;
      const isMenuOpen =
        Boolean(hoverAnchorEl) && hoveredMenuLabel === item.label;

      return (
        <Box
          key={item.label}
          sx={{
            position: "relative",
          }}
        >
          <Tooltip
            title={item.label}
            placement="right"
            arrow
            disableHoverListener={!isCollapsedState}
          >
            <ListItemButton
              onClick={(e) => {
                if (isDesktopFlyout) {
                  if (isMenuOpen) {
                    handlePopoverClose();
                  } else {
                    handlePopoverOpen(e, item.label);
                  }
                } else {
                  toggleGroup(item.label);
                }
              }}
              sx={{
                borderRadius: "8px",
                mb: 0.5,
                mx: 1,
                bgcolor: "transparent",
                background: groupActive
                  ? "linear-gradient(90deg, #eff6ff 0%, #dbeafe 100%)"
                  : "transparent",
                boxShadow: groupActive
                  ? "inset 0 0 0 1px #bfdbfe"
                  : "none",
                color: groupActive ? "#000F7E" : "#475569",
                "&:hover": {
                  bgcolor: groupActive
                    ? undefined
                    : "#f1f5f9",
                  background: groupActive
                    ? "linear-gradient(90deg, #eff6ff 0%, #dbeafe 100%)"
                    : undefined,
                  color: "#000F7E",
                },
                justifyContent: isCollapsedState ? "center" : "flex-start",
              }}
            >
              {Icon && (
                <ListItemIcon
                  sx={{
                    minWidth: isCollapsedState ? 0 : 40,
                    color: groupActive ? "#000F7E" : "#64748b",
                  }}
                >
                  <Icon size={20} />
                </ListItemIcon>
              )}
              {!isCollapsedState && (
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: groupActive ? 600 : 500,
                  }}
                />
              )}
              {!isCollapsedState &&
                (isDesktopFlyout ? (
                  <Box
                    sx={{
                      display: "inline-flex",
                      transform:
                        isHovered || isExpanded
                          ? "rotate(90deg)"
                          : "rotate(0deg)",
                      transition: "transform 200ms ease-in-out",
                      color: groupActive
                        ? "#000F7E"
                        : "#94a3b8",
                    }}
                  >
                    <ChevronRight size={16} />
                  </Box>
                ) : isExpanded ? (
                  <ChevronDown
                    size={16}
                    color={groupActive ? "#000F7E" : "#94a3b8"}
                  />
                ) : (
                  <ChevronRight
                    size={16}
                    color={groupActive ? "#000F7E" : "#94a3b8"}
                  />
                ))}
            </ListItemButton>
          </Tooltip>
          {!isDesktopFlyout ? (
            <Collapse
              in={isExpanded && !isCollapsedState}
              timeout="auto"
              unmountOnExit
            >
              <List component="div" disablePadding>
                {item.children.map((child) => renderMenuItem(child, depth + 1))}
              </List>
            </Collapse>
          ) : (
            <Popover
              open={isMenuOpen}
              anchorEl={hoverAnchorEl}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
              onClose={handlePopoverClose}
              marginThreshold={0}
              PaperProps={{
                sx: {
                  minWidth: 220,
                  maxHeight: "calc(100vh - 80px)",
                  overflowY: "auto",
                  overflowX: "hidden",
                  scrollBehavior: "smooth",
                  background: "#ffffff",
                  color: "#1e293b",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05)",
                  borderRadius: "8px",
                  py: 1,
                  pointerEvents: "auto",
                },
              }}
            >
              <List component="div" disablePadding>
                {item.children.map((child) =>
                  renderMenuItem(child, depth + 1, true),
                )}
              </List>
            </Popover>
          )}
        </Box>
      );
    }

    return (
      <ListItem
        key={item.path || item.label}
        disablePadding
        sx={{ display: "block", mb: 0.5, px: 1 }}
      >
        <Tooltip
          title={item.label}
          placement="right"
          arrow
          disableHoverListener={!isCollapsedState}
        >
          <ListItemButton
            component={Link}
            to={item.path || "#"}
            onClick={() => {
              if (isMobile) {
                setSidebarMobileOpen(false);
              }
              handlePopoverClose();
            }}
            sx={{
              borderRadius: "8px",
              pl: isCollapsedState
                ? "auto"
                : isDesktopFlyout && depth > 0
                  ? 2
                  : depth > 0
                    ? 4
                    : 2,
              justifyContent: isCollapsedState ? "center" : "flex-start",
              color: active ? "#000F7E" : "#475569",
              background: active
                ? "linear-gradient(90deg, #eff6ff 0%, #dbeafe 100%)"
                : "transparent",
              boxShadow: active ? "inset 0 0 0 1px #bfdbfe" : "none",
              "&:hover": {
                background: active
                  ? "linear-gradient(90deg, #eff6ff 0%, #dbeafe 100%)"
                  : undefined,
                bgcolor: active ? undefined : "#f1f5f9",
                color: "#000F7E",
              },
            }}
          >
            {Icon && (
              <ListItemIcon
                sx={{
                  minWidth: isCollapsedState ? 0 : 40,
                  color: active ? "#000F7E" : "#64748b",
                }}
              >
                <Icon size={depth > 0 ? 16 : 20} />
              </ListItemIcon>
            )}
            {!isCollapsedState && (
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: depth > 0 ? "0.875rem" : "0.95rem",
                  fontWeight: active ? 600 : 500,
                }}
              />
            )}
          </ListItemButton>
        </Tooltip>
      </ListItem>
    );
  };

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#ffffff",
        borderRight: "1px solid #e2e8f0",
        color: "#1e293b",
        overflow: { xs: "auto", lg: "hidden" },
      }}
    >
      {/* Brand */}
      <Box
        sx={{
          height: 65,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
          width: "100%",
          overflow: "hidden",
          flexShrink: 0,
          background: "transparent",
        }}
      >
        <Box
          component="img"
          src={logoImg}
          alt="Logo"
          sx={{
            maxHeight: "65px",
            maxWidth: "100%",
            objectFit: "contain",
            margin: "0 auto",
            transition: "all 0.2s ease-in-out",
          }}
        />
      </Box>

      <Divider sx={{ borderColor: "#f1f5f9" }} />

      {/* Nav */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: { xs: "auto", lg: "auto" },
          overflowX: "hidden",
          py: 2,
          "&::-webkit-scrollbar": {
            width: "5px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(0, 0, 0, 0.12)",
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "rgba(0, 0, 0, 0.25)",
          },
        }}
      >
        <List>{menus.map((item) => renderMenuItem(item))}</List>
      </Box>

      {/* User Profile */}
      <Divider sx={{ borderColor: "#f1f5f9" }} />
      <Box
        sx={{
          p: 1.5,
          flexShrink: 0,
        }}
      >
        <Tooltip
          title={effectiveCollapsed && !isMobile ? (user?.fullName || user?.name || "User") : ""}
          placement="right"
          arrow
        >
          <Box
            onClick={(e) => setUserAnchorEl(e.currentTarget)}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: effectiveCollapsed && !isMobile ? "center" : "space-between",
              cursor: "pointer",
              p: 1,
              borderRadius: "8px",
              transition: "background-color 0.2s",
              "&:hover": { bgcolor: "#f1f5f9" },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                minWidth: 0,
                gap: 1.2,
              }}
            >
              <Avatar
                sx={{
                  bgcolor: avatarColor(user?.fullName || user?.name),
                  width: 34,
                  height: 34,
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {getInitials(user?.fullName || user?.name || "U")}
              </Avatar>

              {(!effectiveCollapsed || isMobile) && (
                <Box sx={{ minWidth: 0, overflow: "hidden" }}>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    noWrap
                    sx={{ color: "#0f172a", lineHeight: 1.2 }}
                  >
                    {user?.fullName || user?.name || "User"}
                  </Typography>
                  <Typography
                    variant="caption"
                    noWrap
                    sx={{ color: "#64748b", display: "block" }}
                  >
                    {user?.role?.name || role}
                  </Typography>
                </Box>
              )}
            </Box>

            {(!effectiveCollapsed || isMobile) && (
              <ChevronDown
                size={16}
                color="#94a3b8"
                style={{ flexShrink: 0, marginLeft: 4 }}
              />
            )}
          </Box>
        </Tooltip>

        <Menu
          anchorEl={userAnchorEl}
          open={Boolean(userAnchorEl)}
          onClose={() => setUserAnchorEl(null)}
          PaperProps={{
            sx: {
              minWidth: 200,
              background: "#ffffff",
              color: "#1e293b",
              border: "1px solid #e2e8f0",
              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05)",
              borderRadius: "8px",
              py: 0.5,
              mb: 1,
            },
          }}
          transformOrigin={{
            horizontal: "left",
            vertical: "bottom",
          }}
          anchorOrigin={{
            horizontal: effectiveCollapsed && !isMobile ? "right" : "left",
            vertical: "top",
          }}
        >
          <MenuItem
            onClick={() => {
              navigate(ROUTES.PROFILE);
              setUserAnchorEl(null);
              if (isMobile) setSidebarMobileOpen(false);
            }}
            sx={{
              color: "#334155",
              "&:hover": {
                bgcolor: "#f1f5f9",
                color: "#000F7E",
              },
            }}
          >
            <ListItemIcon sx={{ color: "inherit" }}>
              <User size={18} />
            </ListItemIcon>
            <ListItemText primary="Profile" />
          </MenuItem>

          <Divider sx={{ borderColor: "#f1f5f9", my: 0.5 }} />

          <MenuItem
            onClick={handleLogout}
            sx={{
              color: "#ef4444",
              "&:hover": {
                bgcolor: "#fef2f2",
                color: "#dc2626",
              },
            }}
          >
            <ListItemIcon sx={{ color: "inherit" }}>
              <LogOut size={18} />
            </ListItemIcon>
            <ListItemText primary="Sign Out" />
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { lg: sidebarWidth }, flexShrink: { lg: 0 } }}
    >
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={sidebarMobileOpen}
        onClose={() => setSidebarMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", lg: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: 260,
            background: "#ffffff",
            color: "#1e293b",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", lg: "block" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: sidebarWidth,
            height: "100vh",
            background: "#ffffff",
            color: "#1e293b",
            borderRight: "1px solid #e2e8f0",
            transition: theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflow: "hidden",
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}
