'use client'
import { motion } from "motion/react";
import Image from "next/image";

export default function BackgroundImage({ image, title }) {
  
  return (
    image && (
      <motion.div
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.2 }}
        transition={{ duration: 0.4 }}
        className=" fixed top-0 left-0 w-full h-screen -z-10">
        <Image
          src={image}
          alt={`${title} board game`}
          title={`${title} board game`}
          quality={10}
          style={{ objectFit: "cover", objectPosition:"top" }}
          fill
          priority
        />
      </motion.div>
    )
  );
}
