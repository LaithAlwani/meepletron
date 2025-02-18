import { IoCloseCircleOutline } from "react-icons/io5";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";

export default function CustomToast({ message, id }) {
  return (
    <motion.div
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 50, opacity: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
      className="flex items-center gap-4 bg-white dark:bg-gray-900 text-gray-800 dark:text-white px-6 py-4 rounded-xl shadow-lg border border-gray-300 dark:border-gray-700 transform"
    >
      <span className="text-xl font-bold text-green-600 dark:text-green-400">✅ Success</span>
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={() => toast.remove(id)}
        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        <IoCloseCircleOutline size={20} />
      </button>
    </motion.div>
  );
}
