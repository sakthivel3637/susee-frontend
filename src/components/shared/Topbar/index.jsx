import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  LogOut,
  User,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  PanelLeftClose,
  PanelLeft,
  FileText,
  Truck,
  AlertCircle,
  Info,
} from "lucide-react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Badge,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import useAuthStore from "../../../store/useAuthStore";
import useUIStore from "../../../store/useUIStore";
import { ROUTES } from "../../../config/routes";
import { getMeApi } from "../../../api/authApi";
import {
  getNotificationsApi,
  getUnreadNotificationCountApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
} from "../../../api/notificationApi";
import {
  removeRegisteredDeviceToken,
  requestNotificationPermissionAndRegister,
  setupForegroundMessageListener,
} from "../../../config/firebase";
import { toastInfo } from "../../../notifications/toast";
import { usePermissions } from "../../../hooks/usePermissions";
import { socket, connectSocket } from "../../../socket/socket";
const getNotificationIcon = (type) => {
  const t = String(type || "").toUpperCase();
  if (t.includes("JOB") || t.includes("ASSIGN") || t.includes("WORK")) {
    return <FileText size={18} color="#3B82F6" style={{ marginTop: 2 }} />;
  }
  if (t.includes("GATE") || t.includes("VEHICLE")) {
    return <Truck size={18} color="#10B981" style={{ marginTop: 2 }} />;
  }
  if (t.includes("DELAY") || t.includes("WARN") || t.includes("ERROR")) {
    return <AlertCircle size={18} color="#EF4444" style={{ marginTop: 2 }} />;
  }
  return <Info size={18} color="#64748B" style={{ marginTop: 2 }} />;
};

export default function Topbar() {
  const theme = useTheme();
  const isLaptop = useMediaQuery("(max-width: 1366px)");
  const { user, role, logout, setUser, setMenus } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar, setSidebarMobileOpen } =
    useUIStore();
  const [userHasToggled, setUserHasToggled] = useState(false);
  const [lastCollapsedVal, setLastCollapsedVal] = useState(sidebarCollapsed);

  useEffect(() => {
    if (sidebarCollapsed !== lastCollapsedVal) {
      setUserHasToggled(true);
      setLastCollapsedVal(sidebarCollapsed);
    }
  }, [sidebarCollapsed, lastCollapsedVal]);

  const effectiveCollapsed = sidebarCollapsed || (isLaptop && !userHasToggled);

  const navigate = useNavigate();
  const location = useLocation();
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const [userAnchorEl, setUserAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { canRead } = usePermissions();
  const canReadNotifications = canRead("/notifications");

  const fetchUnreadCount = async () => {
    if (!canReadNotifications) return;
    try {
      const response = await getUnreadNotificationCountApi();
      if (response?.success) {
        setUnreadCount(response.data?.count || 0);
      }
    } catch (error) {
      console.error("Failed to fetch unread notification count:", error);
    }
  };

  const fetchNotifications = async () => {
    if (!canReadNotifications) return;
    try {
      const response = await getNotificationsApi({
        unreadOnly: true,
        limit: 10,
      });
      if (response?.success) {
        const list = response.data?.notifications || [];
        const mapped = list.map((n) => {
          const date = new Date(n.createdAt);
          const timeStr = date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          return {
            ...n,
            text: n.message ? `${n.title}: ${n.message}` : n.title,
            time: timeStr,
            read: n.readAt !== null,
          };
        });
        setNotifications(mapped);
      }
      await fetchUnreadCount();
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await getMeApi();
        if (response?.success) {
          const fetchedUser = response.data.user || response.data;
          setUser(fetchedUser);
          setMenus(response.data.menus || []);
        }
      } catch (error) {
        console.error("Failed to fetch user details:", error);
      }
    };
    fetchUserDetails();
  }, [setUser, setMenus]);

  // Refresh notification badge when socket events arrive
  useEffect(() => {
    const handleRefresh = () => {
      if (canReadNotifications) {
        fetchNotifications();
      }
    };

    socket.on("notification-created", handleRefresh);
    socket.on("notification-read", handleRefresh);
    socket.on("notification-read-all", handleRefresh);

    return () => {
      socket.off("notification-created", handleRefresh);
      socket.off("notification-read", handleRefresh);
      socket.off("notification-read-all", handleRefresh);
    };
  }, [canReadNotifications]);

  // Notification polling + Firebase — only for users who can read notifications
  useEffect(() => {
    if (user && canReadNotifications) {
      fetchNotifications();
      requestNotificationPermissionAndRegister();

      const unsubscribe = setupForegroundMessageListener((payload) => {
        console.log(
          "React Application received foreground push payload:",
          payload,
        );
        fetchNotifications();
        if (payload?.notification) {
          // toastInfo(
          //   `${payload.notification.title}: ${payload.notification.body}`,
          // );
          if (Notification.permission === "granted") {
            try {
              new Notification(payload.notification.title, {
                body: payload.notification.body,
                icon: "/favicon.ico",
              });
            } catch (err) {
              console.warn(
                "Could not launch browser Notification in foreground:",
                err,
              );
            }
          }
        }
      });

      const interval = setInterval(fetchNotifications, 30000);
      return () => {
        clearInterval(interval);
        if (unsubscribe) unsubscribe();
      };
    }
  }, [user, canReadNotifications]);

  useEffect(() => {
    const handleServiceWorkerMessage = (event) => {
      if (event.data && event.data.type === "FCM_BG_MESSAGE") {
        console.log(
          "Received broadcast from Service Worker:",
          event.data.payload,
        );
        fetchNotifications();
        const payload = event.data.payload;
        if (payload?.notification) {
          // toastInfo(
          //   `${payload.notification.title}: ${payload.notification.body}`,
          // );
        }
      }
    };

    navigator.serviceWorker?.addEventListener(
      "message",
      handleServiceWorkerMessage,
    );
    return () => {
      navigator.serviceWorker?.removeEventListener(
        "message",
        handleServiceWorkerMessage,
      );
    };
  }, []);

  const handleLogout = async () => {
    await removeRegisteredDeviceToken();
    logout();
    navigate(ROUTES.LOGIN);
  };

  const handleNotificationClick = async (n) => {
    setNotifAnchorEl(null);
    if (!n.read) {
      try {
        await markNotificationReadApi(n.id);
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === n.id ? { ...item, read: true } : item,
          ),
        );
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }
    if (n.jobCard?.slug) {
      navigate(`/job-cards/view/${n.jobCard.slug}`);
    } else if (n.gateEntry?.slug) {
      navigate(`/gate-entry`);
    }
  };

  const markAllRead = async () => {
    try {
      await markAllNotificationsReadApi();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const getPageTitle = (pathname) => {
    if (pathname === '/locations') return 'Service Center & Location';
    if (pathname === '/locations/new') return 'Service Center & Location / Add';
    if (pathname.startsWith('/locations/edit/')) return 'Service Center & Location / Edit';
    if (pathname.startsWith('/locations/view/')) return 'Service Center & Location / Details';
    if (pathname.startsWith('/locations/')) return 'Service Center & Location';
    return (
      pathname
        .split("/")
        .filter(Boolean)
        .map((s) => s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
        .join(" / ") || "Dashboard"
    );
  };

  const pageTitle = getPageTitle(location.pathname);

  return (
    <AppBar
      position="static"
      color="default"
      elevation={0}
      sx={{
        bgcolor: "transparent",
        backgroundImage: "none",
        boxShadow: "none",
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          edge="start"
          onClick={() => setSidebarMobileOpen(true)}
          sx={{ mr: 2, display: { lg: "none" } }}
        >
          <MenuIcon />
        </IconButton>
        <IconButton
          color="inherit"
          onClick={toggleSidebar}
          sx={{ mr: 2, display: { xs: "none", lg: "flex" } }}
        >
          {effectiveCollapsed ? (
            <PanelLeft size={20} />
          ) : (
            <PanelLeftClose size={20} />
          )}
        </IconButton>

        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ flexGrow: 1, fontWeight: 600, fontSize: "1.1rem" }}
        >
          {pageTitle}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {canReadNotifications && (
            <IconButton
              color="inherit"
              onClick={(e) => setNotifAnchorEl(e.currentTarget)}
            >
              <Badge badgeContent={unreadCount} color="error">
                <Bell size={20} />
              </Badge>
            </IconButton>
          )}

          <Menu
            anchorEl={notifAnchorEl}
            open={Boolean(notifAnchorEl)}
            onClose={() => setNotifAnchorEl(null)}
            PaperProps={{ sx: { width: 320, mt: 1.5, borderRadius: 2 } }}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          >
            <Box
              sx={{
                px: 2,
                py: 1.5,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="subtitle1" fontWeight={600}>
                Notifications
              </Typography>
              {/* <Typography variant="body2" color="primary" sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }} onClick={markAllRead}>
                Mark all read
              </Typography> */}
            </Box>
            <Divider />
            <Box sx={{ maxHeight: 350, overflowY: "auto" }}>
              {notifications.length === 0 ? (
                <Box
                  sx={{ p: 4, textAlign: "center", color: "text.secondary" }}
                >
                  <Typography variant="body2">No notifications</Typography>
                </Box>
              ) : (
                notifications.map((n) => (
                  <MenuItem
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    sx={{
                      py: 1.5,
                      px: 2,
                      alignItems: "flex-start",
                      bgcolor: n.read ? "transparent" : "action.hover",
                      gap: 1.5,
                    }}
                  >
                    {!n.read && (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          bgcolor: "primary.main",
                          mt: 0.8,
                        }}
                      />
                    )}
                    {getNotificationIcon(n.type)}
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: n.read ? 400 : 500,
                          color: "text.primary",
                          mb: 0.5,
                          whiteSpace: "normal",
                        }}
                      >
                        {n.text}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {n.time}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))
              )}
            </Box>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
