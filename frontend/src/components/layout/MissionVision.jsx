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
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec
            placerat odio quis enim semper malesuada. Nulla ornare viverra
            dolor. Vestibulum ante ipsum primis in faucibus orci luctus et
            ultrices posuere cubilia curae;
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
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec
            placerat odio quis enim semper malesuada. Nulla ornare viverra
            dolor. Vestibulum ante ipsum primis in faucibus orci luctus et
            ultrices posuere cubilia curae;
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default MissionVision;
