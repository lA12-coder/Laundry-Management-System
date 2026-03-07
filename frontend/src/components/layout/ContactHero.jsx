import React from "react";
import { motion } from "framer-motion";

const ContactHero = () => {
  return (
    <section className="relative w-full overflow-hidden">
      <div className="relative h-[400px] bg-[#4081a2] flex flex-col items-center justify-center text-center px-6 rounded-b-[50%] scale-x-150 transform">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="scale-x-[0.67] flex flex-col items-center"
        >
          <h1 className="text-6xl md:text-7xl font-black text-white italic tracking-tighter mb-4">
            Contact <span className="text-[#FD9837]">Us</span>
          </h1>
          <p className="text-white/90 text-lg md:text-xl max-w-xl">
            Have a question? We’re here to help you get your laundry done right.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default ContactHero;