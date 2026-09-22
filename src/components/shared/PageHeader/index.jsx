import React from "react";
import styles from "./PageHeader.module.css";
export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className={styles.header}>
      <div className={styles.row}>
        <div className={styles.titleContainer}>
          <div className={styles.accentBar} />
          <div className={styles.titleBox}>
            <h1 className={styles.title}>{title}</h1>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
        </div>

        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </div>
  );
}
