import { Inbox } from "lucide-react";
import styles from "./EmptyState.module.css";
import Button from "../Button";

export default function EmptyState({
  icon: Icon = Inbox,
  title = "No Data",
  message = "No records found.",
  actionLabel,
  onAction,
}) {
  return (
    <div className={styles.container}>
      {/* <div className={styles.iconWrapper}>
        <Icon size={40} className={styles.icon} />
      </div> */}
      {/* <h5 className={styles.title}>{title}</h5> */}
      <p className={styles.message}>{message}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
