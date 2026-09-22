import React, { useState, useEffect } from 'react';
import { Box, Card, Typography, List, ListItem, ListItemText, ListItemIcon, IconButton, Chip, Tabs, Tab, Divider, Avatar } from '@mui/material';
import { Check, CheckCircle2, AlertCircle, Info, Bell, CheckSquare, FileText, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/shared/PageHeader';
import Button from '../../components/common/Button';
import { formatDateTime } from '../../utils/formatters';
import {
  getNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi
} from '../../api/notificationApi';
import { usePermissions } from '../../hooks/usePermissions';

const getIcon = (type) => {
  const t = String(type || '').toUpperCase();
  if (t.includes('JOB') || t.includes('ASSIGN') || t.includes('WORK')) {
    return <FileText size={20} color="#3B82F6" />;
  }
  if (t.includes('GATE') || t.includes('VEHICLE')) {
    return <Truck size={20} color="#10B981" />;
  }
  if (t.includes('DELAY') || t.includes('WARN') || t.includes('ERROR')) {
    return <AlertCircle size={20} color="#EF4444" />;
  }
  return <Info size={20} color="#64748B" />;
};

const getBgColor = (type) => {
  const t = String(type || '').toUpperCase();
  if (t.includes('JOB') || t.includes('ASSIGN') || t.includes('WORK')) {
    return '#3B82F615';
  }
  if (t.includes('GATE') || t.includes('VEHICLE')) {
    return '#10B98115';
  }
  if (t.includes('DELAY') || t.includes('WARN') || t.includes('ERROR')) {
    return '#EF444415';
  }
  return '#64748B15';
};

export default function NotificationsPage({ title = 'Notifications' }) {
  const [notifications, setNotifications] = useState([]);
  const [tab, setTab] = useState(0);
  const navigate = useNavigate();
  const { canUpdate } = usePermissions();
  const canUpdateNotifications = canUpdate('/notifications');

  const fetchNotifications = async () => {
    try {
      const response = await getNotificationsApi({ limit: 50, unreadOnly: tab === 1 });
      if (response?.success) {
        const list = response.data?.notifications || [];
        setNotifications(list);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [tab]);

  const filteredNotifs = notifications;

  const markAsRead = async (id) => {
    try {
      await markNotificationReadApi(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n)
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllRead = async () => {
    try {
      await markAllNotificationsReadApi();
      setNotifications(prev =>
        prev.map(n => ({ ...n, readAt: new Date().toISOString() }))
      );
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleItemClick = async (notif) => {
    if (notif.readAt === null) {
      await markAsRead(notif.id);
    }
    
    if (notif.jobCard?.slug) {
      navigate(`/job-cards/view/${notif.jobCard.slug}`);
    } else if (notif.gateEntry?.slug) {
      navigate(`/gate-entry`);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader
        title={title}
        breadcrumbs={[{ label: title }]}
        actions={canUpdateNotifications ? (
          <Button variant="secondary" leftIcon={CheckSquare} onClick={markAllRead}>
            Mark all as read
          </Button>
        ) : null}
      />

      <Card sx={{ borderRadius: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tabs
            value={tab}
            onChange={(e, v) => setTab(v)}
            sx={{
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.95rem' }
            }}
          >
            <Tab label="All Notifications" />
            <Tab label="Unread" />
          </Tabs>
        </Box>
        <List disablePadding>
          {filteredNotifs.length === 0 ? (
            <Box sx={{ p: 8, textAlign: 'center', color: 'text.secondary' }}>
              <Bell size={48} style={{ opacity: 0.2, margin: '0 auto 16px auto', display: 'block' }} />
              <Typography variant="h6" fontWeight={700} color="text.primary" gutterBottom>
                All caught up!
              </Typography>
              <Typography variant="body2">
                You have no new notifications right now.
              </Typography>
            </Box>
          ) : (
            filteredNotifs.map((notif, index) => {
              const isRead = notif.readAt !== null;
              return (
                <React.Fragment key={notif.id}>
                  <ListItem
                    sx={{
                      py: 2.5, px: { xs: 2, sm: 3 },
                      bgcolor: isRead ? 'transparent' : '#F8FAFC',
                      transition: 'background-color 0.2s',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: '#F1F5F9' }
                    }}
                    onClick={() => handleItemClick(notif)}
                    secondaryAction={
                      !isRead && (
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notif.id);
                          }}
                          title="Mark as read"
                        >
                          <Check size={20} color="#64748B" />
                        </IconButton>
                      )
                    }
                  >
                    <ListItemIcon sx={{ minWidth: { xs: 48, sm: 64 } }}>
                      <Avatar sx={{ bgcolor: getBgColor(notif.type), width: 40, height: 40 }}>
                        {getIcon(notif.type)}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                          <Typography variant="subtitle2" fontWeight={isRead ? 600 : 700} color={isRead ? 'text.secondary' : 'text.primary'}>
                            {notif.title}
                          </Typography>
                          {!isRead && <Chip label="New" size="small" color="primary" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pr: { xs: 4, sm: 8 } }}>
                          <Typography variant="body2" color={isRead ? 'text.secondary' : 'text.primary'}>
                            {notif.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ mt: 0.5 }}>
                            {formatDateTime(notif.createdAt)}
                          </Typography>
                        </Box>
                      }
                      sx={{ m: 0 }}
                    />
                  </ListItem>
                  {index < filteredNotifs.length - 1 && <Divider />}
                </React.Fragment>
              );
            })
          )}
        </List>
      </Card>
    </Box>
  );
}
