import React from "react";
import { Link } from "react-router-dom";
import { assets } from "../../assets/assets";
import {
  FaXTwitter,
  FaInstagram,
  FaYoutube,
  FaLinkedinIn,
} from "react-icons/fa6";

const Footer = () => {
  return (
    <footer className="w-full bg-[#4081a2] text-white px-6 md:px-16 lg:px-24 xl:px-32 pt-16 pb-8">
      {/* Main Footer Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-16">
        {/* Left Section: Logo & Socials */}
        <div className="flex flex-col space-y-6">
          <Link to="/" className="flex items-center gap-2 group transition-all">
            <img
              src={assets.Logo}
              alt="Logo"
              className="w-12 h-12 object-contain brightness-0 invert"
            />
            <span className="font-['Shrikhand'] text-2xl tracking-wider">
              Fua Laundry
            </span>
          </Link>
          <p className="text-white/70 max-w-xs leading-relaxed font-light">
            Bringing professional care to your wardrobe with eco-friendly
            solutions and free pickup & delivery.
          </p>
          <div className="flex space-x-4">
            {[FaXTwitter, FaInstagram, FaYoutube, FaLinkedinIn].map(
              (Icon, index) => (
                <Link
                  key={index}
                  to="#"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-[#FD9837] hover:scale-110 transition-all duration-300"
                >
                  <Icon className="text-lg" />
                </Link>
              ),
            )}
          </div>
        </div>

        {/* Middle Section: Links */}
        <div className="lg:flex lg:justify-center">
          <div className="space-y-4">
            <h2 className="font-bold text-xl mb-6 relative inline-block">
              Quick Links
              <span className="absolute -bottom-1 left-0 w-1/2 h-0.5 bg-[#FD9837]"></span>
            </h2>
            <nav className="flex flex-col space-y-3 text-white/80">
              {[
                "Home",
                "About Us",
                "Services",
                "Contact us",
              ].map((item) => (
                <Link
                  key={item}
                  className="hover:text-[#FD9837] hover:translate-x-1 transition-all duration-200 w-fit"
                  to={
                    item === "Home"
                      ? "/"
                      : `/${item.toLowerCase().replace(/\s+/g, "-")}`
                  }
                >
                  {item}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Right Section: Newsletter */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="font-bold text-xl mb-4 relative inline-block">
              Stay in the Loop
              <span className="absolute -bottom-1 left-0 w-1/2 h-0.5 bg-[#FD9837]"></span>
            </h2>
            <p className="text-white/70 text-sm font-light">
              Subscribe for laundry tips and exclusive discounts.
            </p>
          </div>

          <div className="relative group">
            <input
              className="w-full bg-white/10 border border-white/20 focus:border-[#FD9837] text-white rounded-full py-3.5 px-6 outline-none placeholder:text-white/40 transition-all"
              type="email"
              placeholder="Your email address"
            />
            <button className="absolute right-1.5 top-1.5 bottom-1.5 px-5 bg-[#FD9837] hover:bg-white hover:text-[#4081a2] text-gray-900 font-bold rounded-full text-sm transition-all active:scale-95 shadow-lg">
              Join
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-white/50">
        <p className="text-xs uppercase tracking-[0.2em]">
          © 2026 Fua Laundry. All Rights Reserved.
        </p>
        <div className="flex gap-6 text-xs uppercase tracking-widest">
          <Link to="#" className="hover:text-white transition">
            Privacy Policy
          </Link>
          <Link to="#" className="hover:text-white transition">
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
