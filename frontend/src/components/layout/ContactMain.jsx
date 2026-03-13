import React from "react";
import { motion } from "framer-motion";
import { assets } from "../../assets/assets";
import { FaPhoneAlt, FaEnvelope, FaTelegramPlane } from "react-icons/fa"; // Using react-icons for a modern look

const formFields = [
  { label: "Name", placeholder: "John Doe", type: "text", name: "name" },
  {
    label: "Phone number",
    placeholder: "+251-970713018",
    type: "tel",
    name: "phone",
  },
  {
    label: "Email",
    placeholder: "john.doe@example.com",
    type: "email",
    name: "email",
  },
];

const handleSubmit = (e) => {
  e.preventDefault(); // Prevent page reload
  alert("Form submitted!");
};

const ContactMain = () => {
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
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
          <form className="space-y-6 max-w-xl" onSubmit={handleSubmit}>
            {formFields.map(({ label, placeholder, type, name }) => (
              <div key={name}>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  {label}
                </label>
                <input
                  type={type}
                  name={name}
                  placeholder={placeholder}
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
                placeholder="Enter your message here..."
                className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4c84a4] outline-none transition-all resize-none shadow-sm"
              />
            </div>
            <button className="w-full py-4 bg-[#4c84a4] text-white font-black uppercase tracking-widest rounded-lg shadow-md hover:bg-[#3d6a83] transition-colors">
              Submit
            </button>
          </form>
        </motion.div>

        {/* Right Section: Image + Contact Info */}
        <div className="order-1 lg:order-2 flex flex-col items-center lg:items-end">
          {/* Brand Image Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative w-72 h-72 md:w-[500px] md:h-[500px] rounded-full overflow-hidden shadow-2xl border-8 border-white mb-12"
          >
            <div className="absolute inset-0 bg-[#FD9837]" />
            <img
              src={assets.ContactImg}
              alt="Support Team"
              className="absolute bottom-0 w-full h-auto object-cover transform translate-y-4"
            />
          </motion.div>

          {/* Quick Contact Info Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full  text-wrap items-start justify-center"
          >
            <ContactDetail
              icon={<FaPhoneAlt className="text-[#4c84a4]" />}
              label="Phone"
              value="+251-970713018"
            />
            <ContactDetail
              icon={<FaEnvelope className="text-[#FD9837]" />}
              label="Email"
              value="fualaundry16@gmail.com"
            />
            <ContactDetail
              icon={<FaTelegramPlane className="text-[#4c84a4]" />}
              label="Telegram"
              value="@Fualaundrysupport"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const ContactDetail = ({ icon, label, value }) => (
  <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
    <div className="mb-2 text-xl">{icon}</div>
    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
      {label}
    </span>
    <p className="text-sm font-black italic text-gray-800">{value}</p>
  </div>
);

export default ContactMain;
