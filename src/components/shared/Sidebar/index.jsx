import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
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
} from "@mui/material";
import useAuthStore from "../../../store/useAuthStore";
import useUIStore from "../../../store/useUIStore";
import { buildSidebarMenus } from "../../../utils/authAccess";
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
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
  const isDesktopFlyout = useMediaQuery("(min-width: 1201px)");
  const { pathname } = useLocation();
  const { menus: allowedMenus } = useAuthStore();
  const { sidebarCollapsed, sidebarMobileOpen, setSidebarMobileOpen } =
    useUIStore();
  const isLaptop = useMediaQuery("(max-width: 1366px)");
  const [userHasToggled, setUserHasToggled] = useState(false);
  const [lastCollapsedVal, setLastCollapsedVal] = useState(sidebarCollapsed);

  useEffect(() => {
    if (sidebarCollapsed !== lastCollapsedVal) {
      setUserHasToggled(true);
      setLastCollapsedVal(sidebarCollapsed);
    }
  }, [sidebarCollapsed, lastCollapsedVal]);

  const effectiveCollapsed = sidebarCollapsed || (isLaptop && !userHasToggled);

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
                borderRadius: 0,
                mb: 0.5,
                mx: 1,
                bgcolor: groupActive ? "primary.main" : "transparent",
                color: groupActive ? "primary.contrastText" : "inherit",
                "&:hover": {
                  bgcolor: groupActive ? "primary.main" : "action.hover",
                },
                justifyContent: isCollapsedState ? "center" : "flex-start",
              }}
            >
              {Icon && (
                <ListItemIcon
                  sx={{ minWidth: isCollapsedState ? 0 : 40, color: "inherit" }}
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
                    }}
                  >
                    <ChevronRight size={16} />
                  </Box>
                ) : isExpanded ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
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
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "divider",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  borderRadius: "4px",
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
              borderRadius: 0,
              pl: isCollapsedState
                ? "auto"
                : isDesktopFlyout && depth > 0
                  ? 2
                  : depth > 0
                    ? 4
                    : 2,
              justifyContent: isCollapsedState ? "center" : "flex-start",
              bgcolor: active
                ? depth > 0
                  ? "rgba(26, 67, 77, 0.08)"
                  : "primary.main"
                : "transparent",
              color: active
                ? depth > 0
                  ? "primary.main"
                  : "primary.contrastText"
                : "inherit",
              "&:hover": {
                bgcolor: active
                  ? depth > 0
                    ? "rgba(26, 67, 77, 0.08)"
                    : "primary.main"
                  : "action.hover",
              },
            }}
          >
            {Icon && (
              <ListItemIcon
                sx={{ minWidth: isCollapsedState ? 0 : 40, color: "inherit" }}
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
        bgcolor: "background.paper",
        borderRight: "1px solid",
        borderColor: "divider",
        overflow: { xs: "auto", lg: "hidden" },
      }}
    >
      {/* Brand */}
      <Box
        sx={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 0,
          width: "100%",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <Box
          component="img"
          src={logoImg}
          alt="Logo"
          sx={{
            width: "100%",
            height: "100%",
            maxHeight: "64px",
            maxWidth: "100%",
            transition: "all 0.2s ease-in-out",
          }}
        />
      </Box>

      <Divider />

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
            background: "rgba(0, 0, 0, 0.1)",
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "rgba(0, 0, 0, 0.2)",
          },
        }}
      >
        <List>{menus.map((item) => renderMenuItem(item))}</List>
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
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: 260 },
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
