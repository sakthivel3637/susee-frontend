import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
} from "@mui/material";
import { AlertCircle, X } from "lucide-react";
import { socket } from "../../../socket/socket";
import useAuthStore from "../../../store/useAuthStore";
import {
  getNotificationsApi,
  markNotificationReadApi,
} from "../../../api/notificationApi";

export default function NotificationPopup() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  // Track whether initial missed-notification fetch has been done for this login session
  const initialFetchDone = useRef(false);
  // Mark DB notification as read (only when we have a DB id)
  const markRead = useCallback(async (notifId) => {
    if (!notifId) return;
    try {
      await markNotificationReadApi(notifId);
    } catch {
      // Silent — don't block the user
    }
  }, []);

  const handleClose = useCallback(() => {
    if (current?.notifId) {
      markRead(current.notifId);
    }
    setOpen(false);
    // Wait for fade-out transition before setting current to null
    setTimeout(() => {
      setCurrent(null);
    }, 250);
  }, [current, markRead]);

  const handleView = useCallback(() => {
    if (current?.jobCardSlug) {
      navigate(`/job-cards/view/${current.jobCardSlug}`);
    }
    if (current?.notifId) {
      markRead(current.notifId);
    }
    setOpen(false);
    setTimeout(() => {
      setCurrent(null);
    }, 250);
  }, [current, navigate, markRead]);

  // Enqueue new notification items
  const enqueue = useCallback((entries) => {
    if (!entries || entries.length === 0) return;
    setQueue((prev) => [...prev, ...entries]);
  }, []);

  // When current popup is closed (current === null) and there are queued notifications, pop the next one
  useEffect(() => {
    if (!current && queue.length > 0) {
      const [next, ...rest] = queue;
      setCurrent(next);
      setQueue(rest);
      setOpen(true);
    }
  }, [current, queue]);

  // On login: fetch missed (unread) notifications from DB and queue as popups
  useEffect(() => {
    const userId = user?.id || user?.userId;
    if (!userId) {
      // Reset so next login re-fetches
      initialFetchDone.current = false;
      return;
    }
    if (initialFetchDone.current) return;
    initialFetchDone.current = true;

    const fetchMissed = async () => {
      try {
        const response = await getNotificationsApi({ unreadOnly: true, limit: 20 });
        if (!response?.success) return;
        const list = response.data?.notifications || [];
        if (list.length === 0) return;

        const entries = list.map((n) => ({
          title: n.title || "Alert",
          message: n.message || "",
          type: n.type,
          jobCardId: n.jobCardId || null,
          jobCardSlug: n.jobCard?.slug || null,
          notifId: n.id, // DB id — used to mark as read on dismiss
          // For DB notifications, derive department from message text
          statusCode: n.type === "UNASSIGNED_ALERT"
            ? (n.message?.toLowerCase().includes('body shop') ? 'BODY_SHOP_ASSIGNMENT_PENDING' : 'MECHANICAL_ASSIGNMENT_PENDING')
            : null,
        }));

        enqueue(entries);
      } catch {
        // Silent fail — don't break the app
      }
    };

    fetchMissed();
  }, [user?.id, user?.userId, enqueue]);

  // Real-time: socket events push new notifications as popups
  useEffect(() => {
    const userId = user?.id || user?.userId;
    if (!userId) return;

    const joinRoom = () => {
      socket.emit("join_user_room", userId);
    };

    joinRoom();
    socket.on("connect", joinRoom);

    const handleNotification = (notif) => {
      if (!notif) return;
      enqueue([{
        title: notif.title || "Alert",
        message: notif.message || "",
        type: notif.type,
        jobCardId: notif.jobCardId || null,
        jobCardSlug: notif.jobCardSlug || null,
        notifId: null, // Real-time socket events don't carry DB id
        statusCode: notif.statusCode || null, // passed from unassigned mechanic monitor job
      }]);
    };

    socket.on("notification-created", handleNotification);

    return () => {
      socket.off("connect", joinRoom);
      socket.off("notification-created", handleNotification);
    };
  }, [user?.id, user?.userId, enqueue]);

  if (!current) return null;

  const isDelay = current.type === "DELAY_ALERT" || current.type === "DELIVERY_DELAY_ALERT" || current.type === "UNASSIGNED_ALERT";
  const headerBg = isDelay ? "#FEF2F2" : "#EFF6FF";
  const iconColor = isDelay ? "#DC2626" : "#2563EB";
  const titleColor = isDelay ? "#991B1B" : "#1E40AF";
  const hasJobCard = Boolean(current.jobCardSlug);
  const isUnassignedAlert = current.type === "UNASSIGNED_ALERT";
  // Determine assign mechanic route: body-shop-assign-mechanic for BODY_SHOP, assign-mechanic for mechanical
  const isBodyShop = current.statusCode === 'BODY_SHOP_ASSIGNMENT_PENDING'
    || current.message?.toLowerCase().includes('body shop');
  const assignMechanicPath = isBodyShop ? '/body-shop-assign-mechanic' : '/assign-mechanic';

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
        },
      }}
    >
      <Box
        sx={{
          bgcolor: headerBg,
          px: 3,
          pt: 2,
          pb: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <AlertCircle size={24} color={iconColor} />
          <DialogTitle
            sx={{
              p: 0,
              fontWeight: 700,
              fontSize: "1.1rem",
              color: titleColor,
            }}
          >
            {current.title}
          </DialogTitle>
        </Box>
        <IconButton size="small" onClick={handleClose}>
          <X size={18} />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: 3, py: 2.5 }}>
        <Typography
          variant="body1"
          sx={{ color: "text.primary", lineHeight: 1.6 }}
        >
          {current.message}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          color="inherit"
          sx={{
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 2,
            px: 3,
            color: "text.secondary",
            borderColor: "divider",
          }}
        >
          Cancel
        </Button>
        {isUnassignedAlert ? (
          <Button
            onClick={() => {
              if (current?.notifId) markRead(current.notifId);
              navigate(assignMechanicPath);
              setOpen(false);
              setTimeout(() => setCurrent(null), 250);
            }}
            variant="contained"
            color="error"
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2,
              px: 4,
            }}
          >
            Assign Mechanic
          </Button>
        ) : (
          hasJobCard && (
            <Button
              onClick={handleView}
              variant="contained"
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
                px: 4,
              }}
            >
              View Job Card
            </Button>
          )
        )}
      </DialogActions>
    </Dialog>
  );
}
