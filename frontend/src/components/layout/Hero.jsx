import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import heroImg from "../../assets/img/HeroImg.png";

const Hero = () => {
  const navigate = useNavigate();
  // Parallax effect: The background moves slightly slower than the scroll
  const { scrollY } = useScroll();
  const yBg = useTransform(scrollY, [0, 500], [0, 100]);

  // Stagger variants for a professional entrance
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center text-center px-6 pb-5 overflow-hidden">
      <motion.div style={{ y: yBg }} className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110"
          style={{
            backgroundImage: `linear-gradient(to bottom, 
              #4081a2 0%, 
              rgba(64, 129, 162, 0.8) 50%, 
              rgba(64, 129, 162, 0.95) 100%), 
              url(${heroImg})`,
          }}
        />
      </motion.div>

      {/* Decorative Glow - Bridges the gap between the blue and the orange delivery text */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-orange-500/10 blur-[120px] pointer-events-none z-0" />

      {/* Hero Content - pt-20 accounts for the fixed header height */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="relative z-10 max-w-5xl mx-auto flex flex-col items-center pt-20"
      >
        {/* Animated Headline */}
        <motion.h1
          variants={itemVariants}
          className="text-white font-['shrikhand'] text-5xl md:text-6xl lg:text-7xl leading-tight drop-shadow-2xl md:pt-10"
        >
          Pure Laundry With <br />
          <span className="md:tracking-tight">Free & Reliable</span> <br />
          <span className="text-[#FD9837] inline-block mt-2">Delivery</span>
        </motion.h1>

        {/* Animated Subtext */}
        <motion.p
          variants={itemVariants}
          className="text-white/90 mt-8 text-lg md:text-2xl font-light max-w-2xl leading-relaxed font-['Inter']"
        >
          Order online, choose your time slot, and let{" "}
          <span className="font-bold text-white">Fua Laundry</span> handle the
          rest.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          variants={itemVariants}
          className="mt-12 flex flex-col sm:flex-row gap-5 items-center"
        >
          <button
            onClick={() => navigate("/item-list")}
            className="px-10 py-4 bg-[#FD9837] hover:bg-orange-500 text-gray-900 font-black rounded-full transition-all duration-300 transform shadow-xl hover:scale-105 active:scale-95"
          >
            Schedule your pickup
          </button>

          <button
            onClick={() => navigate("/services")}
            className="px-10 py-4 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white hover:text-[#4081a2] text-white font-bold rounded-full transition-all duration-300 hover:scale-105 active:scale-95"
          >
            View Services
          </button>
        </motion.div>

        {/* Visual Scroll Guide */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="hidden md:flex flex-col items-center mt-20 gap-2 opacity-50"
        >
          <div className="w-5 h-8 border-2 border-white rounded-full flex justify-center p-1">
            <div className="w-1 h-2 bg-white rounded-full" />
          </div>
          <span className="text-[10px] text-white uppercase tracking-[0.2em]">
            Scroll
          </span>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;
