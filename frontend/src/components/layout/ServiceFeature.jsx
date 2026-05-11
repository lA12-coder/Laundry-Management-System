import React from "react";
import { motion } from "framer-motion";

const ServiceFeature = ({
  title,
  description,
  image,
  reverse = false,
  bgGray = false,
}) => {
  return (
    <section className={`py-20 px-6 ${bgGray ? "bg-gray-50" : "bg-white"}`}>
      <div className="max-w-6xl mx-auto">
        <div
          className={`flex flex-col md:flex-row items-center gap-12 lg:gap-20 ${reverse ? "md:flex-row-reverse" : ""}`}
        >
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: reverse ? 50 : -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex-1 text-center md:text-left"
          >
            <h2 className="text-3xl md:text-4xl font-black italic text-gray-900 mb-6 font-['Inter']">
              {title}
            </h2>
            <p className="text-gray-600 leading-relaxed text-lg">
              {description}
            </p>
          </motion.div>

          {/* Circular Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="flex-1 flex justify-center"
          >
            <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full bg-gray-200 shadow-2xl p-2 border-4 border-white overflow-hidden group">
              <img
                src={image}
                alt={title}
                className="w-full h-full object-cover rounded-full transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 rounded-full bg-black/5 pointer-events-none" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ServiceFeature;
