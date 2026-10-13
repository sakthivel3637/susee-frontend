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
  Chip,
} from "@mui/material";
import { AlertTriangle, X } from "lucide-react";
import { socket } from "../../../socket/socket";
import useAuthStore from "../../../store/useAuthStore";
import {
  getNotificationsApi,
  markNotificationReadApi,
} from "../../../api/notificationApi";

/**
 * Dynamic Workflow & Redirection Mapping:
 * Maps status codes or stage titles to the target page, department tab, and status filter.
 */
export function resolveStageRedirection(rawStatusCode, title = "", message = "") {
  const code = String(rawStatusCode || "").toUpperCase();
  const text = `${title} ${message}`.toLowerCase();

  // 1. Assignment Pending Stages -> Redirect to /assign-mechanic with department tab
  if (code === "MECHANICAL_ASSIGNMENT_PENDING" || text.includes("mechanical assignment")) {
    return {
      path: "/assign-mechanic",
      state: { tab: "mechanical", activeTab: "mechanical" },
      stageTitle: "Mechanical Assignment Pending",
      targetLabel: "Assign Work (Mechanical)",
      isAssignment: true,
    };
  }
  if (code === "BODY_SHOP_ASSIGNMENT_PENDING" || text.includes("body shop assignment")) {
    return {
      path: "/assign-mechanic",
      state: { tab: "body-shop", activeTab: "body-shop" },
      stageTitle: "Body Shop Assignment Pending",
      targetLabel: "Assign Work (Body Shop)",
      isAssignment: true,
    };
  }
  if (code === "WATER_WASH_ASSIGNMENT_PENDING" || text.includes("water wash assignment")) {
    return {
      path: "/assign-mechanic",
      state: { tab: "water-wash", activeTab: "water-wash" },
      stageTitle: "Water Wash Assignment Pending",
      targetLabel: "Assign Work (Water Wash)",
      isAssignment: true,
    };
  }

  // 2. In Progress & Stage Delays -> Redirect to /job-cards with activeTab & statusFilter preselected
  if (code === "MECHANICAL_IN_PROGRESS" || text.includes("mechanical in progress")) {
    return {
      path: "/job-cards",
      state: { activeTab: "mechanic", statusFilter: "MECHANICAL_IN_PROGRESS" },
      stageTitle: "Mechanical In Progress",
      targetLabel: "Job Cards (Mechanic Work)",
      isAssignment: false,
    };
  }
  if (code === "BODY_SHOP_IN_PROGRESS" || text.includes("body shop in progress")) {
    return {
      path: "/job-cards",
      state: { activeTab: "bodyshop", statusFilter: "BODY_SHOP_IN_PROGRESS" },
      stageTitle: "Body Shop In Progress",
      targetLabel: "Job Cards (Body Shop)",
      isAssignment: false,
    };
  }
  if (code === "WATER_WASH_IN_PROGRESS" || text.includes("water wash in progress")) {
    return {
      path: "/job-cards",
      state: { activeTab: "waterwash", statusFilter: "WATER_WASH_IN_PROGRESS" },
      stageTitle: "Water Wash In Progress",
      targetLabel: "Job Cards (Water Wash)",
      isAssignment: false,
    };
  }
  if (
    code === "READY_FOR_DELIVERY" ||
    code === "READY_FOR_DELIVERED" ||
    text.includes("ready for delivery")
  ) {
    return {
      path: "/job-cards",
      state: { activeTab: "delivery", statusFilter: code || "READY_FOR_DELIVERY" },
      stageTitle: "Ready for Delivery",
      targetLabel: "Job Cards (Delivery)",
      isAssignment: false,
    };
  }

  // 3. Dynamic Fallbacks by code prefixes
  if (code.includes("MECHANIC")) {
    return {
      path: "/job-cards",
      state: { activeTab: "mechanic", statusFilter: code },
      stageTitle: title || "Mechanical Work Delay",
      targetLabel: "Job Cards (Mechanic)",
      isAssignment: false,
    };
  }
  if (code.includes("BODY_SHOP")) {
    return {
      path: "/job-cards",
      state: { activeTab: "bodyshop", statusFilter: code },
      stageTitle: title || "Body Shop Work Delay",
      targetLabel: "Job Cards (Body Shop)",
      isAssignment: false,
    };
  }
  if (code.includes("WATER_WASH")) {
    return {
      path: "/job-cards",
      state: { activeTab: "waterwash", statusFilter: code },
      stageTitle: title || "Water Wash Work Delay",
      targetLabel: "Job Cards (Water Wash)",
      isAssignment: false,
    };
  }

  // General Job Card Status
  if (code) {
    return {
      path: "/job-cards",
      state: { activeTab: "all", statusFilter: code },
      stageTitle: title || "Job Card Delay",
      targetLabel: "Job Cards",
      isAssignment: false,
    };
  }

  // Default Fallback
  return {
    path: "/job-cards",
    state: { activeTab: "all", statusFilter: "" },
    stageTitle: title || "Alert",
    targetLabel: "Job Cards",
    isAssignment: false,
  };
}

function extractJobCardNo(msg) {
  if (!msg) return null;
  const match = msg.match(/(?:Reference:\s*|Job Card:\s*|JC-)([A-Za-z0-9\-_]+)/i);
  return match ? (match[1].startsWith("JC-") ? match[1] : `JC-${match[1]}`) : null;
}

function extractVehicleReg(msg) {
  if (!msg) return null;
  const match = msg.match(/for\s+([A-Z0-9\s]{5,15})(?:\s+has|\.|\,|$)/i);
  return match ? match[1].trim() : null;
}

function normalizeNotification(n) {
  const statusCode =
    n.statusCode ||
    n.processStageTracking?.status?.statusCode ||
    (n.type === "UNASSIGNED_ALERT"
      ? n.message?.toLowerCase().includes("body shop")
        ? "BODY_SHOP_ASSIGNMENT_PENDING"
        : "MECHANICAL_ASSIGNMENT_PENDING"
      : null);

  const jobCardNo =
    n.jobCardNo ||
    n.jobCard?.jobCardNo ||
    extractJobCardNo(n.message) ||
    (n.jobCard?.slug ? n.jobCard.slug.toUpperCase() : null);

  const vehicleReg =
    n.vehicleReg ||
    n.jobCard?.vehicle?.registrationNo ||
    n.gateEntry?.vehicle?.registrationNo ||
    extractVehicleReg(n.message) ||
    null;

  const jobCardSlug = n.jobCardSlug || n.jobCard?.slug || null;
  const jobCardId = n.jobCardId || null;
  const notifId = n.id || n.notifId || null;

  return {
    notifId,
    title: n.title || "Alert",
    message: n.message || "",
    type: n.type || "DELAY_ALERT",
    jobCardId,
    jobCardSlug,
    jobCardNo,
    vehicleReg,
    statusCode,
    createdAt: n.createdAt || null,
  };
}

function getGroupKey(item) {
  const redirection = resolveStageRedirection(item.statusCode, item.title, item.message);
  return item.statusCode || redirection.stageTitle || item.type || "ALERT";
}

function mergeItemIntoGroups(groupsList, item) {
  const normalized = normalizeNotification(item);
  const groupKey = getGroupKey(normalized);
  const redirection = resolveStageRedirection(
    normalized.statusCode,
    normalized.title,
    normalized.message
  );

  const list = [...groupsList];
  const existingIdx = list.findIndex((g) => g.groupKey === groupKey);

  if (existingIdx >= 0) {
    const existing = { ...list[existingIdx] };
    const notifIds = [...existing.notifIds];
    if (normalized.notifId && !notifIds.includes(normalized.notifId)) {
      notifIds.push(normalized.notifId);
    }

    const jobCards = [...existing.jobCards];
    const jcExists = jobCards.some(
      (jc) =>
        (normalized.jobCardId && jc.jobCardId === normalized.jobCardId) ||
        (normalized.jobCardNo && jc.jobCardNo && jc.jobCardNo === normalized.jobCardNo) ||
        (normalized.jobCardSlug && jc.jobCardSlug && jc.jobCardSlug === normalized.jobCardSlug)
    );

    if (!jcExists && (normalized.jobCardId || normalized.jobCardNo || normalized.jobCardSlug)) {
      jobCards.push({
        jobCardId: normalized.jobCardId,
        jobCardSlug: normalized.jobCardSlug,
        jobCardNo: normalized.jobCardNo || "Job Card",
        vehicleReg: normalized.vehicleReg,
        message: normalized.message,
      });
    }

    list[existingIdx] = {
      ...existing,
      notifIds,
      jobCards,
    };
    return list;
  } else {
    const jobCards = [];
    if (normalized.jobCardId || normalized.jobCardNo || normalized.jobCardSlug) {
      jobCards.push({
        jobCardId: normalized.jobCardId,
        jobCardSlug: normalized.jobCardSlug,
        jobCardNo: normalized.jobCardNo || "Job Card",
        vehicleReg: normalized.vehicleReg,
        message: normalized.message,
      });
    }
    list.push({
      groupKey,
      statusCode: normalized.statusCode,
      title: redirection.stageTitle || normalized.title || "Delay Alert",
      type: normalized.type,
      message: normalized.message,
      redirection,
      notifIds: normalized.notifId ? [normalized.notifId] : [],
      jobCards,
    });
    return list;
  }
}

export default function NotificationPopup() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const initialFetchDone = useRef(false);

  // Mark single or batch DB notifications as read
  const markRead = useCallback(async (notifId) => {
    if (!notifId) return;
    try {
      await markNotificationReadApi(notifId);
    } catch {
      // Silent fail — don't block the user
    }
  }, []);

  const batchMarkRead = useCallback(
    async (ids) => {
      if (!ids || ids.length === 0) return;
      await Promise.allSettled(ids.map((id) => markRead(id)));
    },
    [markRead]
  );

  // Cancel / Close: Dismiss this group and mark all associated notifications as read
  const handleCancel = useCallback(() => {
    if (current?.notifIds?.length > 0) {
      batchMarkRead(current.notifIds);
    }
    setOpen(false);
    setTimeout(() => {
      setCurrent(null);
    }, 250);
  }, [current, batchMarkRead]);

  // Show: Mark all as read, dismiss popup, and redirect to target page with tab & status preselected
  const handleShow = useCallback(() => {
    if (current?.notifIds?.length > 0) {
      batchMarkRead(current.notifIds);
    }
    const redirection =
      current?.redirection ||
      resolveStageRedirection(current?.statusCode, current?.title, current?.message);

    setOpen(false);
    setTimeout(() => {
      setCurrent(null);
      navigate(redirection.path, { state: redirection.state });
    }, 200);
  }, [current, navigate, batchMarkRead]);

  // Click individual job card from the summary list
  const handleViewSingle = useCallback(
    (jobCardSlug) => {
      if (!jobCardSlug) return;
      if (current?.notifIds?.length > 0) {
        batchMarkRead(current.notifIds);
      }
      setOpen(false);
      setTimeout(() => {
        setCurrent(null);
        navigate(`/job-cards/view/${jobCardSlug}`);
      }, 200);
    },
    [current, navigate, batchMarkRead]
  );

  // When current popup is closed and there are queued stage groups, pop the next group
  useEffect(() => {
    if (!current && queue.length > 0) {
      const [next, ...rest] = queue;
      setCurrent(next);
      setQueue(rest);
      setOpen(true);
    }
  }, [current, queue]);

  // On login: Fetch missed notifications from DB and group them by stage
  useEffect(() => {
    const userId = user?.id || user?.userId;
    if (!userId) {
      initialFetchDone.current = false;
      return;
    }
    if (initialFetchDone.current) return;
    initialFetchDone.current = true;

    const fetchMissed = async () => {
      try {
        const response = await getNotificationsApi({ unreadOnly: true, limit: 100 });
        if (!response?.success) return;
        const list = response.data?.notifications || [];
        if (list.length === 0) return;

        let groups = [];
        for (const item of list) {
          groups = mergeItemIntoGroups(groups, item);
        }

        if (groups.length > 0) {
          setQueue((prev) => {
            let merged = [...prev];
            for (const g of groups) {
              const existingIdx = merged.findIndex((m) => m.groupKey === g.groupKey);
              if (existingIdx >= 0) {
                const combinedIds = Array.from(
                  new Set([...merged[existingIdx].notifIds, ...g.notifIds])
                );
                const combinedJcs = [...merged[existingIdx].jobCards];
                for (const jc of g.jobCards) {
                  if (
                    !combinedJcs.some(
                      (c) =>
                        (jc.jobCardId && c.jobCardId === jc.jobCardId) ||
                        (jc.jobCardNo && c.jobCardNo === jc.jobCardNo)
                    )
                  ) {
                    combinedJcs.push(jc);
                  }
                }
                merged[existingIdx] = {
                  ...merged[existingIdx],
                  notifIds: combinedIds,
                  jobCards: combinedJcs,
                };
              } else {
                merged.push(g);
              }
            }
            return merged;
          });
        }
      } catch {
        // Silent fail — don't break the app
      }
    };

    fetchMissed();
  }, [user?.id, user?.userId]);

  // Real-time: socket events push new notifications and merge dynamically into groups
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
      const normalized = normalizeNotification(notif);
      const groupKey = getGroupKey(normalized);

      // 1. If currently displaying the same stage group, update it immediately in place
      setCurrent((curr) => {
        if (curr && curr.groupKey === groupKey) {
          const merged = mergeItemIntoGroups([curr], notif);
          return merged[0];
        }
        return curr;
      });

      // 2. Otherwise update or enqueue into queue
      setQueue((prevQueue) => {
        return mergeItemIntoGroups(prevQueue, notif);
      });
    };

    const handleStageCompleted = (data) => {
      if (!data?.jobCardId) return;

      setQueue((prev) =>
        prev
          .map((group) => ({
            ...group,
            jobCards: group.jobCards.filter((jc) => jc.jobCardId !== data.jobCardId),
          }))
          .filter((group) => group.jobCards.length > 0)
      );

      setCurrent((curr) => {
        if (!curr) return null;
        const remaining = curr.jobCards.filter((jc) => jc.jobCardId !== data.jobCardId);
        if (remaining.length === 0) {
          setOpen(false);
          return null;
        }
        return { ...curr, jobCards: remaining };
      });
    };

    const handleNotificationRead = (data) => {
      if (!data) return;
      const targetNotifId = data.notificationId;
      const targetJcId = data.jobCardId;

      setQueue((prev) =>
        prev
          .map((group) => ({
            ...group,
            notifIds: targetNotifId
              ? group.notifIds.filter((id) => id !== targetNotifId)
              : group.notifIds,
            jobCards: targetJcId
              ? group.jobCards.filter((jc) => jc.jobCardId !== targetJcId)
              : group.jobCards,
          }))
          .filter((group) => group.jobCards.length > 0 || group.notifIds.length > 0)
      );

      setCurrent((curr) => {
        if (!curr) return null;
        const remainingIds = targetNotifId
          ? curr.notifIds.filter((id) => id !== targetNotifId)
          : curr.notifIds;
        const remainingJcs = targetJcId
          ? curr.jobCards.filter((jc) => jc.jobCardId !== targetJcId)
          : curr.jobCards;

        if (remainingJcs.length === 0 && (!targetNotifId || remainingIds.length === 0)) {
          setOpen(false);
          return null;
        }
        return { ...curr, notifIds: remainingIds, jobCards: remainingJcs };
      });
    };

    const handleNotificationReadAll = () => {
      setQueue([]);
      setOpen(false);
      setCurrent(null);
    };

    socket.on("notification-created", handleNotification);
    socket.on("notification-repeat-popup", handleNotification);
    socket.on("stage-completed", handleStageCompleted);
    socket.on("notification-read", handleNotificationRead);
    socket.on("notification-read-all", handleNotificationReadAll);

    return () => {
      socket.off("connect", joinRoom);
      socket.off("notification-created", handleNotification);
      socket.off("notification-repeat-popup", handleNotification);
      socket.off("stage-completed", handleStageCompleted);
      socket.off("notification-read", handleNotificationRead);
      socket.off("notification-read-all", handleNotificationReadAll);
    };
  }, [user?.id, user?.userId]);

  if (!current) return null;

  const jobCardCount = current.jobCards?.length || 0;

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
          border: "1px solid #E2E8F0",
        },
      }}
    >
      {/* Top Alert Header */}
      <Box
        sx={{
          bgcolor: "#FEF2F2",
          borderBottom: "1px solid #FEE2E2",
          px: 3,
          pt: 2.2,
          pb: 1.8,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              bgcolor: "#FEE2E2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AlertTriangle size={22} color="#DC2626" />
          </Box>
          <Box>
            <DialogTitle
              sx={{
                p: 0,
                fontWeight: 800,
                fontSize: "1.1rem",
                color: "#991B1B",
                lineHeight: 1.2,
              }}
            >
              {current.title}
            </DialogTitle>
            <Typography sx={{ fontSize: "0.8rem", color: "#B91C1C", mt: 0.2 }}>
              Stage delay alert requiring attention
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {jobCardCount > 0 && (
            <Chip
              label={`${jobCardCount} ${jobCardCount === 1 ? "Job Card" : "Job Cards"}`}
              size="small"
              sx={{
                bgcolor: "#DC2626",
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: "0.75rem",
                height: 24,
                borderRadius: "12px",
              }}
            />
          )}
          <IconButton size="small" onClick={handleCancel} sx={{ color: "#991B1B" }}>
            <X size={18} />
          </IconButton>
        </Box>
      </Box>

      {/* Dialog Body */}
      <DialogContent sx={{ px: 3, py: 2.5 }}>
        <Typography variant="body2" sx={{ color: "#475569", fontWeight: 500, mb: 1.5 }}>
          {jobCardCount > 0
            ? `The following ${jobCardCount} ${
                jobCardCount === 1 ? "job card is" : "job cards are"
              } waiting in this stage and have exceeded configured time limit:`
            : current.message || "Stage delay alert notification received."}
        </Typography>

        {/* Scrollable Job Cards List */}
        {jobCardCount > 0 && (
          <Box
            sx={{
              maxHeight: 220,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 1,
              pr: 0.5,
              "&::-webkit-scrollbar": { width: 5 },
              "&::-webkit-scrollbar-thumb": {
                bgcolor: "#CBD5E1",
                borderRadius: 4,
              },
            }}
          >
            {current.jobCards.map((jc, idx) => (
              <Box
                key={jc.jobCardId || jc.jobCardNo || idx}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 2,
                  py: 1.2,
                  borderRadius: 2,
                  bgcolor: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    bgcolor: "#F1F5F9",
                    borderColor: "#CBD5E1",
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      bgcolor: "#EFF6FF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#2563EB",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                    }}
                  >
                    {idx + 1}
                  </Box>
                  <Box>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.875rem",
                        color: "#1E293B",
                        lineHeight: 1.2,
                      }}
                    >
                      {jc.jobCardNo || "Job Card"}
                    </Typography>
                    {jc.vehicleReg && (
                      <Typography sx={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 500 }}>
                        Vehicle:{" "}
                        <span style={{ fontWeight: 600, color: "#334155" }}>
                          {jc.vehicleReg}
                        </span>
                      </Typography>
                    )}
                  </Box>
                </Box>

                {jc.jobCardSlug && (
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => handleViewSingle(jc.jobCardSlug)}
                    sx={{
                      textTransform: "none",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "#2563EB",
                      minWidth: "auto",
                      p: "2px 8px",
                      borderRadius: 1.5,
                      "&:hover": { bgcolor: "#EFF6FF" },
                    }}
                  >
                    View →
                  </Button>
                )}
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>

      {/* Two Action Buttons: Cancel and Show */}
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1.5, justifyContent: "flex-end" }}>
        <Button
          onClick={handleCancel}
          variant="outlined"
          color="inherit"
          sx={{
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 2,
            px: 3,
            color: "#64748B",
            borderColor: "#CBD5E1",
            "&:hover": {
              borderColor: "#94A3B8",
              bgcolor: "#F8FAFC",
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleShow}
          variant="contained"
          sx={{
            textTransform: "none",
            fontWeight: 700,
            borderRadius: 2,
            px: 4,
            bgcolor: "#DC2626",
            boxShadow: "0 4px 12px rgba(220, 38, 38, 0.25)",
            "&:hover": {
              bgcolor: "#B91C1C",
              boxShadow: "0 6px 16px rgba(185, 28, 28, 0.35)",
            },
          }}
        >
          Show
        </Button>
      </DialogActions>
    </Dialog>
  );
}
