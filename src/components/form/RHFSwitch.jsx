import { useFormContext, Controller } from "react-hook-form";
import {
  FormControlLabel,
  FormControl,
  FormHelperText,
  Switch,
} from "@mui/material";
export default function RHFSwitch({
  name,
  label,
  hint,
  disabled = false,
  className = "",
  sx = {},
  value,
  onChange,
  ...props
}) {
  const context = useFormContext();
  if (!context || !name) {
    const isStringStatus =
      typeof value === "string" && (value === "ACTIVE" || value === "INACTIVE");
    const checked = isStringStatus ? value === "ACTIVE" : !!value;

    const handleChange = (event) => {
      if (onChange) {
        const checkedValue = event.target.checked;
        if (isStringStatus) {
          onChange(checkedValue ? "ACTIVE" : "INACTIVE");
        } else {
          onChange(checkedValue);
        }
      }
    };

    return (
      <FormControl component="fieldset" className={className} sx={{ ...sx }}>
        {label ? (
          <FormControlLabel
            control={
              <Switch
                checked={checked}
                onChange={handleChange}
                disabled={disabled}
                color="primary"
                size="small"
                {...props}
              />
            }
            label={label}
            sx={{
              "& .MuiFormControlLabel-label": {
                minWidth: "65px",
                display: "inline-block",
              },
              margin: 0,
            }}
          />
        ) : (
          <Switch
            checked={checked}
            onChange={handleChange}
            disabled={disabled}
            color="primary"
            size="small"
            {...props}
          />
        )}
        {hint && <FormHelperText>{hint}</FormHelperText>}
      </FormControl>
    );
  }

  const { control } = context;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const fieldValue = field.value;
        const isStringStatus =
          typeof fieldValue === "string" &&
          (fieldValue === "ACTIVE" || fieldValue === "INACTIVE");
        const checked = isStringStatus ? fieldValue === "ACTIVE" : !!fieldValue;

        const handleChange = (event) => {
          const checkedValue = event.target.checked;
          if (isStringStatus) {
            field.onChange(checkedValue ? "ACTIVE" : "INACTIVE");
          } else {
            field.onChange(checkedValue);
          }
          if (onChange) {
            onChange(checkedValue ? "ACTIVE" : "INACTIVE");
          }
        };

        return (
          <FormControl
            error={!!error}
            component="fieldset"
            className={className}
            sx={{ mb: 2, ...sx }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={checked}
                  onChange={handleChange}
                  disabled={disabled}
                  color="primary"
                  {...props}
                />
              }
              label={label}
            />
            {(error || hint) && (
              <FormHelperText>{error ? error.message : hint}</FormHelperText>
            )}
          </FormControl>
        );
      }}
    />
  );
}
