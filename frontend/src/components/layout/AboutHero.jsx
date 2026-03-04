import React from "react";
import { motion } from "framer-motion";
import { FaChevronRight } from "react-icons/fa6";

const AboutHero = () => {
  return (
    <section className="relative w-full">
      {/* The Curved Background Container 
        We use a large negative bottom margin and a massive border radius to create the arc.
      */}
      <div className="relative h-[450px] md:h-[550px] bg-[#4081a2] overflow-hidden flex flex-col items-center justify-center text-center px-6 rounded-b-[50%] scale-x-150 transform">
        {/* Inner content - we must un-scale the X to keep text normal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="scale-x-[0.67] flex flex-col items-center"
        >
          {/* Main Title with Styled 'Us' */}
          <h1 className="text-6xl md:text-8xl font-black text-white tracking-wider mb-4 font-['shrikhand']">
            About <span className="text-[#FD9837]">Us</span>
          </h1>

          {/* Subtitle */}
          <p className="text-white text-lg md:text-2xl font-medium max-w-2xl opacity-90 mb-12">
            Pure laundry, free delivery — built for your everyday life.
          </p>

          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-white/90 font-medium">
            <a href="/" className="hover:text-white transition-colors">
              Home
            </a>
            <FaChevronRight size={12} className="mt-0.5 opacity-70" />
            <span className="text-white">About us</span>
          </nav>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutHero;
