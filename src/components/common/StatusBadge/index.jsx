import { STATUS_LABELS, STATUS_VARIANTS } from "../../../constants/statuses";
import { snakeToLabel } from "../../../utils/formatters";
import styles from "./StatusBadge.module.css";

export default function StatusBadge({ status, size = "md" }) {
  const label = STATUS_LABELS[status] || (status ? snakeToLabel(status) : status);
  const variant = STATUS_VARIANTS[status] || "secondary";

  return (
    <span className={[styles.badge, styles[variant], styles[size]].join(" ")}>
      <span className={styles.dot} />
      {label}
    </span>
  );
}
