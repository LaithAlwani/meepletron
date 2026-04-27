import { motion } from "motion/react";

export default function TypingIndicator() {
  return (
    <div className="flex items-center space-x-1 pb-2">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 bg-muted rounded-full"
          animate={{ opacity: [1, 0, 1] }}
          transition={{
            repeat: Infinity,
            duration: 1.2,
            ease: "easeInOut",
            delay: i * 0.3,
          }}
        />
      ))}
    </div>
  );
}