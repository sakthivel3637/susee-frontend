import { Outlet } from 'react-router-dom';
import styles from './KioskLayout.module.css';

export default function KioskLayout() {
  return (
    <div className={styles.kiosk}>
      <Outlet />
    </div>
  );
}
