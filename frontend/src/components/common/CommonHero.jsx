import React from "react";
import { motion } from "framer-motion";
import Bubbles from "../common/Bubbles";
import { Link } from "react-router-dom";

const CommonHero = ({
  titlePrefix,
  titleHighlight,
  description,
  breadcrumb,
}) => {
  return (
    <section className="relative w-full h-[500px] overflow-hidden bg-white">
      <div className="absolute top-0 left-0 w-full h-full bg-[#4081a2] rounded-b-[50%] scale-x-[1.5] translate-x-0 transform flex flex-col items-center justify-center shadow-md overflow-hidden">
        <Bubbles />

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative scale-x-[0.66] max-w-4xl px-6 text-center z-10 relative mt-16"
        >
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 font-['shrikhand'] tracking-widest">
            {titlePrefix}{" "}
            <span className="text-[#FD9837] font-['shrikhand']">
              {titleHighlight}
            </span>
          </h1>
          <p className="text-white/90 text-lg md:text-2xl leading-relaxed max-w-3xl mx-auto mb-8 font-light font-['Inter']">
            {description}
          </p>
          <p className="text-white/70 font-light uppercase tracking-widest text-sm absolute top-60 left-1/2 -translate-x-1/2">
            <Link to="/">Home</Link> &gt; {breadcrumb}
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default CommonHero;
