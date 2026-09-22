import { Loader2 } from "lucide-react";
import styles from "./Loader.module.css";

export default function Loader({
  size = "md",
  text = "Loading...",
  fullPage = false,
}) {
  const inner = (
    <div className={styles.wrapper}>
      <Loader2 className={[styles.spinner, styles[size]].join(" ")} />
      {text && <p className={styles.text}>{text}</p>}
    </div>
  );

  if (fullPage) {
    return <div className={styles.fullPage}>{inner}</div>;
  }

  return inner;
}
