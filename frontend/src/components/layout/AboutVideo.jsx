import React from "react";
import { motion } from "framer-motion";

const AboutVideo = () => {
  return (
    <section className="py-20 bg-white px-6">
      <div className="max-w-5xl mx-auto text-center">
        {/* Header */}
        <h2 className="text-4xl font-bold mb-4">Watch about us more</h2>
        <p className="text-gray-500 mb-12">
          Watch here how we work at the Fua laundry
        </p>

        {/* Video Placeholder Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative aspect-video bg-[#D9D9D9] rounded-[40px] flex flex-col items-center justify-center shadow-inner overflow-hidden group cursor-pointer"
        >
          {/* Mock YouTube UI */}
          <div className="flex flex-col items-center transition-transform group-hover:scale-110">
            <div className="w-20 h-14 bg-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-white border-b-[10px] border-b-transparent ml-1" />
            </div>
            <span className="mt-4 font-medium text-gray-600">
              Youtube Video
            </span>
          </div>

          {/* Actual Video Tag (Hidden by default, uncomment to use) */}
          {/* <iframe className="absolute inset-0 w-full h-full" src="https://www.youtube.com/embed/your-id" title="About Fua" frameBorder="0" allowFullScreen></iframe> */}
        </motion.div>

        {/* CTA Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mt-16 bg-[#FD9837] text-white px-10 py-4 rounded-xl font-bold text-lg shadow-[0_10px_20px_rgba(253,152,55,0.3)] hover:bg-[#e88a2f] transition-colors"
        >
          Schedule your pickup now
        </motion.button>
      </div>
    </section>
  );
};

export default AboutVideo;
