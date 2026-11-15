import {
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  closeLabel = "Close",
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;

    const previousFocus = document.activeElement as HTMLElement | null;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.classList.add("modal-open");
    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("modal-open");
      previousFocus?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="modal-shell">
      <button
        type="button"
        className="modal-shell__backdrop"
        aria-label={closeLabel}
        onClick={onClose}
      />
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        ref={panelRef}
      >
        <div className="modal__head">
          <h2 id="modal-title">{title}</h2>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label={closeLabel}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="modal__body">{children}</div>
        {footer ? <div className="modal__footer">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
