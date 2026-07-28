interface AlertProps {
  message: string | null;
  variant?: "danger" | "success" | "warning" | "info";
  onClose?: () => void;
}

export function Alert({ message, variant = "danger", onClose }: AlertProps) {
  if (!message) return null;
  return (
    <div className={`alert alert-${variant} alert-dismissible`} role="alert">
      {message}
      {onClose && (
        <button
          type="button"
          className="btn-close"
          aria-label="Закрыть"
          onClick={onClose}
        />
      )}
    </div>
  );
}

