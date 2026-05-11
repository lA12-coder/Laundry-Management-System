import React from "react";
import { motion } from "framer-motion";
import { FaCircleCheck } from "react-icons/fa6";
import { plans } from "../../assets/assets";

const PricingPlans = () => {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Choose Your Plan
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Register for our thoughtfully designed pickup and cleaning plans,
            offered at special discounts to keep your clothes fresh and your
            routine effortless.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className={`relative p-8 rounded-3xl transition-all duration-300 shadow-xl ${
                plan.isFeatured
                  ? "bg-[#4081a2] text-white scale-105 z-10 py-12"
                  : "bg-white text-gray-800 border border-gray-100"
              }`}
            >
              <div className="text-center mb-8">
                <h3
                  className={`text-2xl font-bold mb-4 ${plan.isFeatured ? "text-white" : "text-gray-900"}`}
                >
                  {plan.name}
                </h3>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-3xl font-bold">{plan.price} ETB</span>
                  <span
                    className={`text-sm ${plan.isFeatured ? "text-white/80" : "text-gray-500"}`}
                  >
                    /{plan.period}
                  </span>
                </div>
              </div>

              <div className="space-y-4 mb-10">
                <p
                  className={`font-bold text-lg ${plan.isFeatured ? "text-white" : "text-gray-900"}`}
                >
                  Features
                </p>
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 text-sm leading-tight"
                    >
                      <FaCircleCheck
                        className={`mt-0.5 flex-shrink-0 ${plan.isFeatured ? "text-white" : "text-[#4081a2]"}`}
                      />
                      <span
                        className={
                          plan.isFeatured ? "text-white/90" : "text-gray-600"
                        }
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                className={`w-full py-4 rounded-xl font-bold transition-all active:scale-95 shadow-lg ${
                  plan.isFeatured
                    ? "bg-white text-[#4081a2] hover:bg-gray-100"
                    : "bg-[#4081a2] text-white hover:bg-[#356d8a]"
                }`}
              >
                {plan.buttonText}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingPlans;
