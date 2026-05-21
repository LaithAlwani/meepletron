import { motion } from "motion/react";
import { toast } from "react-hot-toast";
import {
  IoClose,
  IoCheckmarkCircle,
  IoInformationCircle,
  IoWarning,
} from "react-icons/io5";

// Status icon + accent colour for each visual flavour. The accent stays
// readable in both light and dark mode because the icon sits on top of the
// surface colour, not a tinted background.
const VARIANTS = {
  success: { Icon: IoCheckmarkCircle, accent: "text-emerald-500" },
  info: { Icon: IoInformationCircle, accent: "text-primary" },
  warning: { Icon: IoWarning, accent: "text-amber-500" },
};

export default function CustomToast({ message, id, variant = "success" }) {
  const { Icon, accent } = VARIANTS[variant] || VARIANTS.success;

  return (
    <motion.div
      initial={{ y: -16, opacity: 0, scale: 0.96 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -16, opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="flex items-center gap-3 bg-surface text-foreground px-4 py-3 rounded-xl shadow-lg border border-border min-w-[260px] max-w-[400px]"
    >
      <Icon size={20} className={`shrink-0 ${accent}`} />
      <p className="flex-1 text-sm leading-snug capitalize">{message}</p>
      <button
        type="button"
        onClick={() => toast.remove(id)}
        className="shrink-0 p-1 -mr-1 rounded-md text-subtle hover:text-foreground hover:bg-surface-muted transition-colors"
        aria-label="Dismiss"
      >
        <IoClose size={16} />
      </button>
    </motion.div>
  );
}
