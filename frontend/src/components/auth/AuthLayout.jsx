import React from "react";
import { motion } from "framer-motion";

const AuthLayout = ({ children, title, subtitle }) => (
  <div className="min-h-screen flex items-center justify-center p-6 mt-10 md:mt-15">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[40px] shadow-2xl overflow-hidden flex max-w-5xl w-full border-8 border-white"
    >
      {/* Left side: Form */}
      <div className="w-full lg:w-1/2 p-8 md:p-12">
        <h2 className="text-4xl font-black italic text-gray-900 mb-2">
          {title}
        </h2>
        <p className="text-gray-500 mb-8">{subtitle}</p>
        {children}
      </div>

      {/* Right side: Brand Visual (Matches Contact/Service design) */}
      <div className="hidden lg:flex w-1/2 bg-[#4c84a4] relative items-center justify-center p-12 overflow-hidden">
        {/* Signature "Smiley" Curve influence */}
        <div className="absolute top-[-10%] right-[-10%] w-70 h-70 bg-[#FD9837] rounded-full opacity-90 animate-pulse " />
        <div className="relative text-center z-10">
          <h3 className="text-5xl font-black italic text-white mb-4 leading-tight">
            Freshness <br /> <span className="text-[#FD9837]">Simplified</span>
          </h3>
          <p className="text-white/80 font-medium italic">
            Pure Laundry, Free Delivery
          </p>
        </div>
      </div>
    </motion.div>
  </div>
);

export default AuthLayout;
