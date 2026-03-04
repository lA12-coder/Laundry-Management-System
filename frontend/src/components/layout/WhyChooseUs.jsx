import React from "react";
import { motion } from "framer-motion";
import { assets } from "../../assets/assets";
import { FaStar } from "react-icons/fa";

const features = [
  {
    title: "Fast & Reliable Delivery",
    description:
      "We pick up and deliver your laundry right on time every time. Our trusted riders ensure your clothes reach you quickly, safely, and exactly when you expect them.",
    icon: assets.FastDeliveryIcon,
  },
  {
    title: "Affordable Price",
    description:
      "Enjoy top-quality laundry services without overpaying. Our pricing is transparent, fair, and designed to give you premium cleaning at a budget-friendly rate.",
    icon: assets.PriceIcon,
  },
  {
    title: "Real-Time Order Tracking",
    description:
      "Stay informed every step of the way. Our real-time tracking system lets you monitor your order from pickup to delivery for total peace of mind.",
    icon: assets.TrackingIcon,
  },
  {
    title: "Trusted Laundries",
    description:
      "Your clothes are handled only by professional, carefully selected laundry staffs. We deliver consistent quality, care, and hygiene.",
    icon: assets.TrustedIcon,
  },
];

const WhyChooseUs = () => {
  return (
    <section className="py-24 bg-[#f8fafc] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Title */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 font-['Inter'] inline-block relative">
            Why{" "}
            <span className="underline decoration-[#FD9837] decoration-4 underline-offset-8">
              Choose Us?
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Side: Feature Cards */}
          <div className="space-y-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.2 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-6 bg-white p-6 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_40px_rgba(0,0,0,0.08)] transition-all group cursor-default"
              >
                <div className="flex-shrink-0 w-16 h-16 rounded-full overflow-hidden flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <img
                    src={feature.icon}
                    alt=""
                    className="w-15object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-[#4081a2] transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed font-['inter']">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right Side: Visual Image & Testimonial */}
          {/* wrapper defines width/ratio for both layers */}
          <div className="relative w-[90%] max-w-md mx-auto inline-block">
            {/* 1. Background Orange Div - Slides from Right */}
            <motion.div
              initial={{ x: 150, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{
                duration: 0.8,
                ease: "easeOut",
                delay: 0.1,
              }}
              className="absolute bottom-3 left-2 w-full h-full bg-[#FD9837] rounded-tl-[100px] rounded-br-[100px] rounded-tr-3xl rounded-bl-3xl z-0 "
            />

            {/* 2. Main Image Container - Slides from Left */}
            <motion.div
              initial={{ x: -150, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{
                duration: 0.8,
                ease: "easeOut",
                delay: 0.2,
              }}
              className="relative z-10 w-full h-full rounded-tl-[100px] rounded-br-[100px] rounded-tr-3xl rounded-bl-3xl overflow-hidden shadow-2xl bg-white"
            >
              <img
                src={assets.WhyChooseUsMain}
                alt="Fua Laundry Delivery"
                className="w-full h-auto object-cover"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
