import React from "react";
import { motion } from "framer-motion";
import { FaPhone, FaEnvelope, FaLocationDot } from "react-icons/fa6";

const ContactMap = () => {
  return (
    <section className="px-6 pb-24 bg-white">
      <div className="max-w-7xl mx-auto rounded-[40px] overflow-hidden shadow-2xl h-[400px] md:h-[500px]">
        {/* Replace with your Google Maps Iframe */}
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14281.168404052954!2d39.28948355000001!3d8.567009400000002!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x164b21eaaaaaaaab%3A0x51e1d46f04051fe9!2sAdama%20University!5e1!3m2!1sen!2set!4v1772910055560!5m2!1sen!2set"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
    </section>
  );
};

export default ContactMap;
