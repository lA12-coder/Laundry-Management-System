import React from "react";
import { motion } from "framer-motion";
import { assets } from "../../assets/assets"; 

const steps = [
  {
    title: "Place an Order",
    description: "Select your laundry items and pick a time slot.",
    image: assets.OrderImg,
  },
  {
    title: "Pickup at Your Doorstep",
    description: "Our rider collects your clothes on time.",
    image: assets.PickupImg, 
  },
  {
    title: "Cleaned at Our Laundries",
    description: "Your order is processed at our laundries.",
    image: assets.CleaningImg, 
  },
  {
    title: "Delivery to You",
    description: "Clean, fresh clothes delivered to your location.",
    image: assets.DeliveryImg, 
  },
];

const HowItWorks = () => {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[#4081a2] font-['Shrikhand'] text-4xl md:text-5xl"
          >
            How Fua Laundry Works
          </motion.h2>
          <div className="w-20 h-1.5 bg-[#FD9837] mx-auto mt-4 rounded-full" />
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 relative">
          {/* Desktop Connecting Line */}
          <div className="hidden lg:block absolute top-24 left-0 w-full h-[2px] border-t-2 border-dashed border-gray-100 -z-0" />

          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="flex flex-col items-center group relative z-10"
            >
              {/* Image Container */}
              <div className="relative w-50 h-50 mb-8 flex items-center justify-center transition-transform duration-500 group-hover:-translate-y-3">
                {/* Decorative background blob */}
                <div className="absolute inset-0 bg-[#4081a2]/5 rounded-full scale-0 group-hover:scale-100 transition-transform duration-500" />

                <img
                  src={step.image}
                  alt={step.title}
                  className="w-full h-full object-contain relative z-10 drop-shadow-md"
                />

                {/* Number Badge */}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#FD9837] text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                  {index + 1}
                </div>
              </div>

              {/* Text Area */}
              <div className="text-center px-4">
                <h3 className="text-[#4081a2] font-bold text-xl mb-3 font-['inter']">
                  {step.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed font-light font-['inter']">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
