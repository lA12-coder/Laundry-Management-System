import React from "react";
import { motion } from "framer-motion";

const ContactForm = () => {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16">
        {/* Left: Input Fields */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="w-full lg:w-1/2"
        >
          <h2 className="text-4xl font-black italic text-gray-900 mb-8">
            Get In Touch
          </h2>
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                placeholder="Value"
                className="w-full p-4 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-[#4c84a4] outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Phone number
              </label>
              <input
                type="text"
                placeholder="Value"
                className="w-full p-4 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-[#4c84a4] outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                placeholder="Value"
                className="w-full p-4 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-[#4c84a4] outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Message
              </label>
              <textarea
                rows="4"
                placeholder="Value"
                className="w-full p-4 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-[#4c84a4] outline-none transition-all resize-none"
              ></textarea>
            </div>
            <button className="w-full py-4 bg-[#4c84a4] text-white font-bold rounded-lg shadow-lg hover:bg-[#3d6b85] transition-colors uppercase tracking-widest">
              Submit
            </button>
          </form>
        </motion.div>

        {/* Right: Circular Support Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="w-full lg:w-1/2 flex justify-center lg:justify-end"
        >
          <div className="relative w-[300px] h-[300px] md:w-[450px] md:h-[450px] rounded-full overflow-hidden border-8 border-white shadow-2xl">
            <div className="absolute inset-0 bg-[#FD9837]" />
            <img
              src="path_to_support_representative.png"
              alt="Customer Support"
              className="absolute bottom-0 w-full h-auto object-cover transform translate-y-4"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ContactForm;
