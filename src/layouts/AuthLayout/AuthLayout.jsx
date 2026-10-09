import { Outlet } from "react-router-dom";
import styles from "../../pages/Auth/Auth.module.css";
import bgImage from "../../assets/img/login-page-image.png";

export default function AuthLayout() {
  return (
    <div
      className={styles.authContainer}
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className={styles.formContainer}>
        <div className={styles.formCard}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
