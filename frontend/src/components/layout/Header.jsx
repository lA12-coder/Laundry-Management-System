import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { assets } from "../../assets/assets";
import { useSelector } from "react-redux";

const Header = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const totalQuantity = useSelector((state) => state.cart.totalQuantity);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => {
    setOpen(false);
  }, [location]);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About us", path: "/about-us" },
    { name: "Services", path: "/services" },
    { name: "Contact us", path: "/contact-us" },
  ];

  return (
    <nav
      className={`overflow-hidden fixed top-0 left-0 w-full z-150 transition-all duration-500 ease-in-out ${
        scrolled
          ? "bg-white/90 backdrop-blur-md py-3 shadow-md"
          : "bg-[#4081a2] py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-12 lg:px-16">
        {/* Logo Section */}
        <Link
          to="/"
          className="flex items-center gap-2 group transition-transform duration-300 active:scale-95"
        >
          <img
            src={scrolled ? assets.LogoBlue : assets.Logo}
            alt="Fua Laundry Logo"
            className={`object-contain transition-all duration-300 ${scrolled ? "w-8 h-8" : "w-10 h-10"}`}
          />
          <p
            className={`font-['Shrikhand'] text-lg tracking-wider transition-colors duration-300 ${
              scrolled ? "text-[#4081a2]" : "text-white"
            }`}
          >
            Fua Laundry
          </p>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`text-sm font-semibold transition-all duration-300 relative group ${
                scrolled
                  ? "text-gray-700 hover:text-[#4081a2]"
                  : "text-white/90 hover:text-white"
              }`}
            >
              {link.name}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#FD9837] transition-all duration-300 group-hover:w-full"></span>
            </Link>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          {/* Cart Icon */}
          <div
            className="relative cursor-pointer p-2 group mt-2"
            onClick={() => navigate("/cart")}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M.583.583h2.333l1.564 7.81a1.17 1.17 0 0 0 1.166.94h5.67a1.17 1.17 0 0 0 1.167-.94l.933-4.893H3.5"
                stroke={scrolled ? "#4081a2" : "#FD9837"}
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="absolute top-0 right-0 text-[10px] font-bold flex items-center justify-center text-white bg-[#FD9837] w-4 h-4 rounded-full shadow-sm group-hover:scale-110 transition-transform ">
              {totalQuantity}
            </span>
          </div>

          <button
            onClick={() => navigate("/signup")}
            className={`hidden md:block px-4 py-1.5 mb-0 rounded-full font-bold text-sm transition-all duration-300 active:scale-95 shadow-sm ${
              scrolled
                ? "bg-[#4081a2] text-white hover:bg-[#356d8a]"
                : "bg-[#FD9837] text-white hover:bg-white hover:text-[#4081a2]"
            }`}
          >
            Sign Up
          </button>

          {/* Mobile Toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-lg transition-colors relative z-50 text-[#FD9837]"
          >
            <div className="w-6 flex flex-col items-end gap-1.5">
              <span
                className={`h-0.5 rounded-full transition-all duration-300 ${open ? "w-6 rotate-45 translate-y-2 bg-gray-800" : "w-6 bg-current"}`}
              ></span>
              <span
                className={`h-0.5 rounded-full transition-all duration-300 ${open ? "opacity-0" : "w-4 bg-current"}`}
              ></span>
              <span
                className={`h-0.5 rounded-full transition-all duration-300 ${open ? "w-6 -rotate-45 -translate-y-2 bg-gray-800" : "w-5 bg-current"}`}
              ></span>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      />

      {/* Mobile Menu Content */}
      <div
        className={`fixed top-0 right-0 h-screen w-[75%] max-w-sm bg-white shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden z-50 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="absolute top-4 right-4 font-['inter'] text-gray-500">
          <button
            onClick={() => setOpen(false)}
            className="px-2 py-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
          >
            X
          </button>
        </div>
        <div className="flex flex-col h-full p-8 pt-20">
          <div className="space-y-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="block text-xl font-semibold text-gray-800 hover:text-[#4081a2] transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="mt-auto space-y-4">
            <button
              onClick={() => navigate("/signup")}
              className="w-full py-4 bg-[#4081a2] text-white font-bold rounded-xl shadow-lg active:scale-105 hover:bg-[#69bde7]"
            >
              Get Started
            </button>
            <p className="text-center text-sm text-gray-500">
              Fast & Clean Laundry Services
            </p>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
