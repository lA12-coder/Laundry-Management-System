import React from "react";
import { motion } from "framer-motion";

const MissionVision = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 space-y-12">
        {/* Our Mission - Staggered Top Right */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          className="ml-auto max-w-2xl bg-[#E8F1F5] p-10 rounded-tl-[60px] rounded-br-[60px] rounded-tr-lg rounded-bl-lg shadow-sm"
        >
          <h3 className="text-3xl font-black italic mb-4">Our Mission</h3>
          <p className="text-gray-600 leading-relaxed italic">
          To provide an effortless laundry experience by blending pristine cleaning standards with a fast, 
          dependable pickup and delivery service that fits perfectly into the modern routine.
          </p>
        </motion.div>

        {/* Our Vision - Staggered Bottom Left */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          className="mr-auto max-w-2xl bg-[#E8F1F5] p-10 rounded-tl-[60px] rounded-br-[60px] rounded-tr-lg rounded-bl-lg shadow-sm"
        >
          <h3 className="text-3xl font-black italic mb-4">Our Vision</h3>
          <p className="text-gray-600 leading-relaxed italic">
          To become the country’s most trusted laundry service provider, recognized for absolute reliability, 
          flawless presentation, high-quality cleaning service, and an uncompromising commitment to customer satisfaction.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default MissionVision;
