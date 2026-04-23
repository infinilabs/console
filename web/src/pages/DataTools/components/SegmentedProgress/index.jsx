import React from "react";
import styles from "./index.less";

const normalizePercent = (percent) => {
  const value = Number(percent);
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, value));
};

export default ({
  percent = 0,
  segments = 24,
  color = "#448EF7",
  trackColor = "#F0F2F5",
  height = 8,
  width = "100%",
  showLabel = true,
  label,
}) => {
  const normalizedPercent = normalizePercent(percent);
  const filledSegments = Math.round((normalizedPercent / 100) * segments);

  return (
    <div className={styles.segmentedProgress} style={{ width }}>
      <div className={styles.bar}>
        {Array.from({ length: segments }).map((_, index) => (
          <span
            key={index}
            className={styles.segment}
            style={{
              backgroundColor: index < filledSegments ? color : trackColor,
              height,
            }}
          />
        ))}
      </div>
      {showLabel ? (
        <span className={styles.label}>{label || `${normalizedPercent}%`}</span>
      ) : null}
    </div>
  );
};
