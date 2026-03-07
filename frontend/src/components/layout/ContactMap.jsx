import React from "react";
import { motion } from "framer-motion";
import { FaPhone, FaEnvelope, FaLocationDot } from "react-icons/fa6";

const ContactMap = () => {
  return (
    <section className="px-6 pb-24 bg-white">
      <div className="max-w-7xl mx-auto rounded-[40px] overflow-hidden shadow-2xl h-[400px] md:h-[500px]">
        {/* Replace with your Google Maps Iframe */}
        <iframe 
          src="https://www.google.com/maps/embed?..." 
          className="w-full h-full border-none grayscale hover:grayscale-0 transition-all duration-700"
          allowFullScreen="" 
          loading="lazy"
        ></iframe>
      </div>
    </section>
  );
};

export default ContactMap;