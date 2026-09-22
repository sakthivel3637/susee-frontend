import { Search, X } from "lucide-react";
import { useState } from "react";
import styles from "./SearchBar.module.css";

export default function SearchBar({
  placeholder = "Search...",
  value,
  onChange,
  onClear,
  className = "",
}) {
  const [internalValue, setInternalValue] = useState("");
  const isControlled = value !== undefined;
  const displayValue = isControlled ? value : internalValue;

  const handleChange = (e) => {
    const val = e.target.value;
    if (!isControlled) setInternalValue(val);
    if (onChange) onChange(val);
  };

  const handleClear = () => {
    if (!isControlled) setInternalValue("");
    if (onClear) onClear();
    if (onChange) onChange("");
  };

  return (
    <div className={[styles.wrapper, className].join(" ")}>
      <Search size={16} className={styles.icon} />
      <input
        type="text"
        className={styles.input}
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
      />
      {displayValue && (
        <button className={styles.clearBtn} onClick={handleClear} type="button">
          <X size={14} />
        </button>
      )}
    </div>
  );
}
