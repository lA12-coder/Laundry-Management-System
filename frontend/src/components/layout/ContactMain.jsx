import React from "react";
import { motion } from "framer-motion";
import { assets } from "../../assets/assets";

const ContactMain = () => {
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Contact Form Container */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="order-2 lg:order-1"
        >
          <h2 className="text-4xl font-black italic text-gray-900 mb-10">
            Get In Touch
          </h2>
          <form className="space-y-6 max-w-xl">
            {["Name", "Phone number", "Email"].map((label) => (
              <div key={label}>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  {label}
                </label>
                <input
                  type="text"
                  placeholder="Value"
                  className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4c84a4] outline-none transition-all shadow-sm"
                />
              </div>
            ))}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                Message
              </label>
              <textarea
                rows="4"
                placeholder="Value"
                className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4c84a4] outline-none transition-all resize-none shadow-sm"
              />
            </div>
            <button className="w-full py-4 bg-[#4c84a4] text-white font-black uppercase tracking-widest rounded-lg shadow-md hover:bg-[#3d6a83] transition-colors">
              Submit
            </button>
          </form>
        </motion.div>

        {/* Brand Image Container with Orange Backdrop */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="order-1 lg:order-2 flex justify-center lg:justify-end"
        >
          <div className="relative w-72 h-72 md:w-[500px] md:h-[500px] rounded-full overflow-hidden shadow-2xl border-8 border-white">
            <div className="absolute inset-0 bg-[#FD9837]" />
            <img
              src={assets.ContactImg}
              alt="Support Team"
              className="absolute bottom-0 w-full h-auto object-cover transform translate-y-4"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ContactMain;
