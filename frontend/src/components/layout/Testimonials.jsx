import React from "react";
import { motion } from "framer-motion";
import { FaStar, FaPaperclip } from "react-icons/fa6";
import { testimonials } from "../../assets/assets";

const Testimonials = () => {
  return (
    <section className="py-24 bg-[#E8F1F5] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Title */}
        <h2 className="text-center text-4xl md:text-5xl font-bold text-black mb-20 font-['Inter']">
          Testimonial
        </h2>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-16 gap-x-12 relative">
          {testimonials.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              className={`relative max-w-lg mx-auto w-full ${
                index === 2 ? "md:col-span-2 md:mt-8" : ""
              }`}
            >
              {/* The Polaroid Image with Paperclip */}
              <div className="absolute -right-10 z-20 rotate-340">
                <FaPaperclip
                  className="absolute -top-3 left-1/2 -translate-x-1/2 text-gray-400 rotate-12 z-30"
                  size={24}
                />
                <div className="bg-white p-1 pb-4 shadow-xl border border-gray-100">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 md:w-20 md:h-20 object-cover"
                  />
                </div>
              </div>

              {/* The Content Card */}
              <div className="relative pt-6">
                {/* Orange Border Frame */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-100 h-75 mt-6">
                  <img
                    src={item.border}
                    alt="border quote"
                    className="w-105 h-110 object-contain"
                    style={{ zIndex: 1 }}
                  />
                </div>
                {/* Blue Background Card */}
                <div className="relative z-10 bg-[#4081a2] text-white p-8 rounded-3xl text-center min-h-[250px] flex flex-col items-center justify-center">
                  <h3 className="text-xl font-bold mb-4">{item.name}</h3>

                  <p className="text-sm md:text-base leading-relaxed mb-6 italic font-light px-4">
                    {item.text}
                  </p>

                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        size={16}
                        className={
                          i < item.stars ? "text-white" : "text-white/30"
                        }
                      />
                    ))}
                  </div>

                  <span className="text-xs opacity-80">{item.date}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
