import { useState, useEffect } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { Grid } from '@mui/material';
import { Car, Clock, Wrench, CheckCircle2, LogOut, Maximize, ClipboardList, User } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './Kiosk.module.css';
import { ROUTES } from '../../config/routes';
import useAuthStore from '../../store/useAuthStore';
import { getFirstReadablePath } from '../../utils/authAccess';
import { useTvKioskDashboard } from '../../queries/useDashboardQueries';
import { useSocket } from '../../hooks/useSocket';
import { formatWaitTime } from '../../utils/formatters';



const formatReadyTime = (dateString) => {
  if (!dateString) return 'Just now';
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

function useAutoScroll(items, maxVisible = 4, intervalMs = 3000) {
  const [displayItems, setDisplayItems] = useState(items);


  const itemsKey = items.map(i => i.id).join(',');

  useEffect(() => {
    setDisplayItems(items);
  }, [itemsKey]);

  useEffect(() => {
    if (items.length <= maxVisible) return;

    const interval = setInterval(() => {
      setDisplayItems(prev => {
        if (prev.length <= 1) return prev;
        const next = [...prev];
        const first = next.shift();
        next.push(first);
        return next;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [items.length, maxVisible, intervalMs]);

  return displayItems;
}

function DisplaySection({ title, icon: Icon, items, statusClass }) {
  const [parent] = useAutoAnimate({ duration: 800, easing: 'ease-in-out' });
  const animatedItems = useAutoScroll(items, 4, 3500);

  return (
    <div className={`${styles.section} ${statusClass}`}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>
          <Icon size={24} /> {title}
        </div>
        <span className={styles.countBadge}>{items.length}</span>
      </div>
      <div className={styles.list} ref={parent}>
        {animatedItems.map((item) => (
          <div key={item.id} className={styles.listItem}>
            <div className={styles.cardHeader}>
              <span className={styles.jobId}><ClipboardList size={14} /> {item.id}</span>
              <span className={styles.timeBadge}><Clock size={14} /> {item.waitTime || item.time}</span>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.licensePlate}>
                <div className={styles.plateInd}>
                  <div className={styles.indFlag}>
                    <span></span><span></span><span></span>
                  </div>
                  IND
                </div>
                <span className={styles.plateText}>{item.vehicle}</span>
              </div>

              <div className={styles.bottomRow}>
                <div className={styles.customerDetails}>
                  <div className={styles.userAvatar}>
                    <User size={18} />
                  </div>
                  <h3 className={styles.customerName}>{item.customerName}</h3>
                </div>
                <div className={styles.carBadge}>
                  <Car size={20} />
                </div>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className={styles.empty}>No vehicles in queue</div>}
      </div>
    </div>
  );
}

export default function KioskDisplay() {
  const navigate = useNavigate();
  const { menus, isAuthenticated } = useAuthStore();
  const [time, setTime] = useState(new Date());
  const [readyParent] = useAutoAnimate({ duration: 800, easing: 'ease-in-out' });

  const [searchParams] = useSearchParams();
  const kioskKey = searchParams.get('kioskKey') || undefined;
  const { data: rawJobs, refetch, isError, error } = useTvKioskDashboard({ kioskKey });
  const jobs = Array.isArray(rawJobs?.data || rawJobs) ? (rawJobs?.data || rawJobs || []) : [];

  useSocket({
    jobCardStatusChanged: (data) => {
      console.log('Live update received:', data);
      refetch();
    }
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
      refetch(); // Polling backup every minute to update wait times
    }, 60000);
    return () => clearInterval(timer);
  }, [refetch]);

  const mechanical = jobs.filter(j => j.column === 'MECHANICAL').map(j => ({
    id: j.id, vehicle: j.vehicleNumber, model: j.vehicleInfo, waitTime: formatWaitTime(j.waitMinutes), customerName: j.customerName
  }));
  const bodyShop = jobs.filter(j => j.column === 'BODY_SHOP').map(j => ({
    id: j.id, vehicle: j.vehicleNumber, model: j.vehicleInfo, waitTime: formatWaitTime(j.waitMinutes), customerName: j.customerName
  }));
  const waterWash = jobs.filter(j => j.column === 'WATER_WASH').map(j => ({
    id: j.id, vehicle: j.vehicleNumber, model: j.vehicleInfo, waitTime: formatWaitTime(j.waitMinutes), customerName: j.customerName
  }));
  const ready = jobs.filter(j => j.column === 'READY_FOR_DELIVERY').map(j => ({
    id: j.id, vehicle: j.vehicleNumber, model: j.vehicleInfo, time: formatReadyTime(j.updatedAt), customerName: j.customerName
  }));

  const animatedReady = useAutoScroll(ready, 4, 3500);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.log(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const exitKiosk = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => { });
    }
    navigate(isAuthenticated ? getFirstReadablePath(menus, ROUTES.PROFILE) : ROUTES.LOGIN);
  };

  if (isError && (error?.response?.status === 401 || error?.response?.status === 403 || !kioskKey)) {
    return (
      <div className={styles.container} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#0f172a' }}>
        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#1e293b', borderRadius: '24px', maxWidth: '600px', color: '#fff', border: '1px solid #334155' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#ef4444', fontWeight: 800 }}>⚠️ TV Display Unauthorized</h1>
          <p style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#e2e8f0' }}>
            {error?.response?.data?.message || 'TV Kiosk API Key is missing, expired, or revoked.'}
          </p>
          <p style={{ fontSize: '1rem', opacity: 0.7 }}>
            Please contact the IT Admin team for the updated Location URL bookmark (e.g. <code>?kioskKey=...</code>).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.logo}><Car size={28} /></div>
          <div>
            <h1 className={styles.brandName}>DVSOS Live Status</h1>
            <p className={styles.brandSub}>Vehicle Service Operations Center</p>
          </div>
        </div>

        <div className={styles.controlsGroup}>
          <div className={styles.clockRight}>
            <div className={styles.clockDate}>{time.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            <div className={styles.clockTime}>{time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</div>
          </div>
          <button className={styles.fsBtn} onClick={toggleFullscreen} title="Toggle Fullscreen">
            <Maximize size={22} />
          </button>
          <button className={styles.exitBtn} onClick={exitKiosk} title="Exit Kiosk">
            <LogOut size={20} />
            <span>Exit</span>
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className={styles.grid}>
        <Grid container spacing={{ xs: 1.5, md: 2, lg: 3 }} sx={{ height: { xs: 'auto', lg: '100%' } }}>
          <Grid item xs={12} sm={6} lg={3} sx={{ height: { xs: 'auto', lg: '100%' }, minHeight: { xs: '450px', lg: 'auto' } }}>
            <DisplaySection title="Mechanical" icon={Wrench} items={mechanical} statusClass={styles.mechSection} />
          </Grid>
          <Grid item xs={12} sm={6} lg={3} sx={{ height: { xs: 'auto', lg: '100%' }, minHeight: { xs: '450px', lg: 'auto' } }}>
            <DisplaySection title="Body Shop" icon={Wrench} items={bodyShop} statusClass={styles.bodySection} />
          </Grid>
          <Grid item xs={12} sm={6} lg={3} sx={{ height: { xs: 'auto', lg: '100%' }, minHeight: { xs: '450px', lg: 'auto' } }}>
            <DisplaySection title="Water Wash" icon={Wrench} items={waterWash} statusClass={styles.washSection} />
          </Grid>
          <Grid item xs={12} sm={6} lg={3} sx={{ height: { xs: 'auto', lg: '100%' }, minHeight: { xs: '450px', lg: 'auto' } }}>
            <div className={`${styles.section} ${styles.readySection}`}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}><CheckCircle2 size={24} /> Ready to Delivery</div>
                <span className={styles.countBadge}>{ready.length}</span>
              </div>
              <div className={styles.list} ref={readyParent}>
                {animatedReady.map((item) => (
                  <div key={item.id} className={styles.listItem}>
                    <div className={styles.cardHeader}>
                      <span className={styles.jobId}><ClipboardList size={14} /> {item.id}</span>
                      <span className={styles.timeBadge}><Clock size={14} /> Since {item.time}</span>
                    </div>

                    <div className={styles.cardBody}>
                      <div className={styles.licensePlate}>
                        <div className={styles.plateInd}>
                          <div className={styles.indFlag}>
                            <span></span><span></span><span></span>
                          </div>
                          IND
                        </div>
                        <span className={styles.plateText}>{item.vehicle}</span>
                      </div>

                      <div className={styles.bottomRow}>
                        <div className={styles.customerDetails}>
                          <div className={styles.userAvatar}>
                            <User size={18} />
                          </div>
                          <h3 className={styles.customerName}>{item.customerName}</h3>
                        </div>
                        <div className={styles.carBadge}>
                          <Car size={20} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {ready.length === 0 && <div className={styles.empty}>No vehicles ready</div>}
              </div>
            </div>
          </Grid>
        </Grid>
      </div>
    </div>
  );
}
