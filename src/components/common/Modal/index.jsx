import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
} from "@mui/material";
import Button from "../Button";

export default function Modal({
  show,
  onHide,
  title,
  children,
  footer,
  size = "md",
  centered = true,
  closeButton = true,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  confirmVariant = "primary",
  isConfirming = false,
}) {
  return (
    <Dialog
      open={show}
      onClose={onHide}
      maxWidth={size === "md" ? "sm" : size === "lg" ? "md" : "xs"}
      fullWidth
      sx={{ "& .MuiDialog-paper": { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>{title}</DialogTitle>
      <DialogContent sx={{ pt: "16px !important" }}>{children}</DialogContent>
      {(footer || onConfirm) && (
        <DialogActions sx={{ p: 2, pt: 0 }}>
          {footer || (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button variant="secondary" onClick={onHide}>
                {cancelLabel}
              </Button>
              <Button
                variant={confirmVariant}
                onClick={onConfirm}
                isLoading={isConfirming}
              >
                {confirmLabel}
              </Button>
            </Box>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
}
