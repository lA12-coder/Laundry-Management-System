import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import { motion } from "framer-motion";
import {useNavigate} from "react-router-dom";
import {
  FaChevronLeft,
  FaChevronRight,
  FaPlus,
  FaMinus,
} from "react-icons/fa6";
import { items } from "../../assets/assets";
import { useDispatch } from "react-redux";
import { addToCart } from "../../redux/cartSlice";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const ClothSelection = () => {
  const [quantities, setQuantities] = useState({});
    const dispatch = useDispatch();
    const navigate = useNavigate();

  const updateQuantity = (id, delta) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + delta),
    }));
  };

  const handleAddToBasket = (item) => {
    const quantity = quantities[item.id] || 0;
    if (quantity > 0) {
      dispatch(addToCart({ ...item, quantity }));
      alert(`${item.name} added to basket!`);
    } else {
      alert("Please select a quantity first");
    }
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 font-['Inter']">
            Select Cloth items for Pickup
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-sm md:text-base">
            Pick the clothes you want washed, drop them in your basket, and
            we'll swing by your door right away!
          </p>
        </div>

        {/* Carousel Wrapper */}
        <div className="relative px-4 md:px-12">
          {/* Custom Navigation Buttons */}
          <button className="swiper-prev absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center bg-white hover:bg-gray-100 transition-colors shadow-sm">
            <FaChevronLeft className="text-gray-600" />
          </button>

          <button className="swiper-next absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center bg-white hover:bg-gray-100 transition-colors shadow-sm">
            <FaChevronRight className="text-gray-600" />
          </button>

          <Swiper
            modules={[Navigation, Pagination]}
            spaceBetween={30}
            slidesPerView={1}
            grabCursor={true}
            allowTouchMove={true}
            navigation={{
              prevEl: ".swiper-prev",
              nextEl: ".swiper-next",
            }}
            pagination={{ clickable: true, dynamicBullets: true }}
            breakpoints={{
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            className="pb-16"
          >
            {items.map((item) => (
              <SwiperSlide key={item.id} className="py-4">
                <motion.div
                  whileHover={{ y: -8 }}
                  className="bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.05)] border border-gray-100 p-8 flex flex-col items-center text-center h-full"
                >
                  {/* Product Image */}
                  <div className="h-52 w-full flex items-center justify-center mb-6">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  {/* Product Info */}
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {item.name}
                  </h3>
                  <p className="text-gray-500 font-medium mb-6">
                    {item.price} Birr
                  </p>

                  {/* Counter Control */}
                  <div className="flex items-center gap-4 mb-6 mt-auto">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="text-red-500 hover:scale-125 transition-transform p-1"
                    >
                      <FaMinus size={14} />
                    </button>
                    <div className="w-20 py-1.5 border border-gray-200 rounded text-gray-700 font-bold bg-gray-50">
                      {quantities[item.id] || 0}
                    </div>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="text-green-600 hover:scale-125 transition-transform p-1"
                    >
                      <FaPlus size={14} />
                    </button>
                  </div>

                  {/* Add to Basket Button */}
                  <button className="w-full py-3 bg-[#4081a2] hover:bg-[#356d8a] text-white font-bold rounded-lg transition-all shadow-lg shadow-blue-900/10 active:scale-95" onClick={()=>handleAddToBasket(item)}>
                    Add to Basket
                  </button>
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* View All Link */}
        <div className="mt-8 text-right">
          <button className="text-[#4081a2] font-bold hover:underline flex items-center gap-1 ml-auto text-sm uppercase tracking-wider" onClick={()=>navigate("/item-list")}>
            View All Items {">>"}
          </button>
        </div>
      </div>

      {/* Global CSS for Swiper pagination color */}
      <style jsx global>{`
        .swiper-pagination-bullet-active {
          background: #4081a2 !important;
        }
      `}</style>
    </section>
  );
};

export default ClothSelection;
