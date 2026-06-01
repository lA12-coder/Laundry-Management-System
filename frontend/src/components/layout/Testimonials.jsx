import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FaStar } from "react-icons/fa6";
import {
  engagementQueryKeys,
  fetchPublicTestimonials,
} from "../../services/engagementApi";

const Testimonials = () => {
  const { data: testimonials = [], isLoading } = useQuery({
    queryKey: engagementQueryKeys.publicTestimonials,
    queryFn: fetchPublicTestimonials,
    staleTime: 60_000,
  });

  return (
    <section className="py-24 bg-[#E8F1F5] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-center text-4xl md:text-5xl font-bold text-black mb-20 font-['Inter']">
          What Our Customers Say
        </h2>

        {isLoading ? (
          <p className="text-center text-gray-500 text-sm">Loading testimonials...</p>
        ) : testimonials.length === 0 ? (
          <p className="text-center text-gray-500 text-sm">
            No public testimonials available yet.
          </p>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-8 relative">
          {testimonials.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              className="relative max-w-lg mx-auto w-full"
            >
              <div className="bg-[#4081a2] text-white p-8 rounded-3xl text-center min-h-[230px] flex flex-col items-center justify-center shadow-lg">
                <h3 className="text-xl font-bold mb-4">{item.customer_name}</h3>
                <p className="text-sm md:text-base leading-relaxed mb-6 italic font-light px-4">
                  {item.review_text}
                </p>
                <div className="flex gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      size={16}
                      className={i < item.rating ? "text-white" : "text-white/30"}
                    />
                  ))}
                </div>
                <span className="text-xs opacity-80">
                  {item.created_at
                    ? new Date(item.created_at).toLocaleDateString()
                    : ""}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
        )}
      </div>
    </section>
  );
};

export default Testimonials;
