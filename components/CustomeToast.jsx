import { motion } from "motion/react";
import { toast } from "react-hot-toast";
import { IoCloseCircleOutline } from "react-icons/io5";

export default function CustomToast({ message, id }) {
  return (
    <motion.div
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 50, opacity: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
      className="flex items-center gap-4 bg-surface text-foreground px-6 py-4 rounded-xl shadow-lg border border-border"
    >
      <span className="text-sm font-bold text-green-500">✅ Success</span>
      <p className="capitalize flex-1 text-sm">{message}</p>
      <button
        onClick={() => toast.remove(id)}
        className="text-muted hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <IoCloseCircleOutline size={20} />
      </button>
    </motion.div>
  );
}
