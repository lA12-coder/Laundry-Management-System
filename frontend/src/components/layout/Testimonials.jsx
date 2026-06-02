import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FaStar } from "react-icons/fa6";
import { ImQuotesLeft, ImQuotesRight } from "react-icons/im"; // Using react-icons for cleaner quote control
import {
  engagementQueryKeys,
  fetchPublicTestimonials,
} from "../../services/engagementApi";

function formatDisplayDate(dateValue) {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function TestimonialCard({ item, index }) {
  const stars = Math.max(1, Math.min(5, Number(item.rating || 0)));
  
  // Center the 3rd card on medium displays and above
  const gridLayoutClass = index === 2 ? "md:col-span-2 md:max-w-2xl md:mx-auto w-full" : "w-full";

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.15, duration: 0.5, ease: "easeOut" }}
      // Hover effects: subtle scale, smooth 3D tilt feeling, and shadow boost
      whileHover={{ 
        scale: 1.03, 
        rotateX: 2, 
        rotateY: -2, 
        z: 10,
        transition: { duration: 0.2, ease: "easeInOut" } 
      }}
      className={`relative p-6 perspective-1000 ${gridLayoutClass}`}
    >
      {/* Outer Orange Accent Border Box */}
      <div className="absolute inset-0 border-2 border-[#ff8c32] rounded-[40px] pointer-events-none" />

      {/* Decorative Top Quote Bracket Gap */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#dbe1e6] px-4 flex justify-center text-[#ff8c32]">
        <ImQuotesLeft size={24} />
      </div>

      {/* Decorative Bottom Quote Bracket Gap */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-[#dbe1e6] px-4 flex justify-center text-[#ff8c32]">
        <ImQuotesRight size={24} />
      </div>

      {/* Main Inner Blue Card Container */}
      <div className="relative rounded-[32px] bg-[#3e7da3] text-white px-8 py-12 shadow-xl h-full flex flex-col justify-between select-none">
        
        {/* Top Right Polaroid Photo Attachment */}
        <div className="absolute -top-8 -right-4 w-18 h-22 bg-white p-1.5 shadow-md border border-gray-200 rotate-12 flex flex-col items-center">
          {/* Paperclip Graphic Overlay */}
          <div className="absolute -top-3 left-1/3 w-3 h-7 border-2 border-slate-400 rounded-full bg-transparent transform -rotate-12 opacity-80" />
          
          <div className="w-full h-14 bg-slate-300 overflow-hidden">
            {item.customer_image ? (
              <img
                src={item.customer_image}
                alt={item.customer_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-500 bg-slate-200">
                {(item.customer_name || "C").charAt(0)}
              </div>
            )}
          </div>
          <div className="w-full h-4 mt-1 bg-white" />
        </div>

        {/* Content Structure */}
        <div className="text-center">
          <h3 className="text-xl font-semibold tracking-wide mb-5 mt-2">{item.customer_name}</h3>
          <p className="text-sm md:text-base font-light leading-relaxed text-slate-100 max-w-md mx-auto">
            "{item.review_text}"
          </p>
        </div>

        <div className="mt-6 text-center">
          {/* Star Rating Rendering */}
          <div className="flex justify-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <FaStar
                key={`${item.id}-star-${i}`}
                size={18}
                className={i < stars ? "text-white" : "text-white/30"}
              />
            ))}
          </div>
          
          {/* Dynamic / Formatted Date */}
          <p className="text-xs font-medium tracking-wider text-slate-200/80">
            {formatDisplayDate(item.created_at)}
          </p>
        </div>
      </div>
    </motion.article>
  );
}

const Testimonials = () => {
  const { data: testimonials = [], isLoading } = useQuery({
    queryKey: engagementQueryKeys.publicTestimonials,
    queryFn: fetchPublicTestimonials,
    staleTime: 60_000,
  });

  return (
    <section className="py-24 bg-[#dbe1e6] overflow-hidden font-sans">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-center text-4xl md:text-5xl font-bold text-slate-900 mb-24 tracking-tight">
          What Our Customers Say
        </h2>

        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <p className="text-center text-slate-500 text-sm animate-pulse">Loading testimonials...</p>
          </div>
        ) : testimonials.length === 0 ? (
          <p className="text-center text-slate-500 text-sm">
            No public testimonials available yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-24 items-stretch">
            {testimonials.slice(0, 3).map((item, index) => (
              <TestimonialCard key={item.id} item={item} index={index} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Testimonials;