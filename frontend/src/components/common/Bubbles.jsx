import React from "react";
import { motion } from "framer-motion";

const Bubbles = () => {
  const bubbles = Array.from({ length: 15 }).map((_, i) => {
    const size = Math.random() * 40 + 10;
    const left = Math.random() * 100;
    const delay = Math.random() * 5;
    const duration = Math.random() * 5 + 5;

    return (
      <motion.div
        key={i}
        className="absolute bottom-0 rounded-full bg-white/20 backdrop-blur-sm pointer-events-none"
        style={{
          width: size,
          height: size,
          left: `${left}%`,
        }}
        animate={{
          y: [100, -500],
          opacity: [0, 0.6, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: duration,
          repeat: Infinity,
          delay: delay,
          ease: "linear",
        }}
      />
    );
  });

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {bubbles}
    </div>
  );
};

export default Bubbles;
