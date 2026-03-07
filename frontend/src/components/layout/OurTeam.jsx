import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { teamMembers } from "../../assets/assets";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const OurTeams = () => {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Our Teams
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            Our experienced leadership team brings decades of industry expertise
            and a shared commitment to excellence.
          </p>
        </div>

        {/* Swiper Container */}
        <div className="relative px-4 overflow-hidden">
          {/* navigation arrows */}
          <div className="custom-prev absolute left-2 top-1/2 -translate-y-1/2 z-20 cursor-pointer p-2 bg-white rounded-full shadow-lg">
            <svg
              className="w-5 h-5 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </div>
          <div className="custom-next absolute right-2 top-1/2 -translate-y-1/2 z-20 cursor-pointer p-2 bg-white rounded-full shadow-lg">
            <svg
              className="w-5 h-5 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
          {/* left/right masks to simulate cards hiding behind wall */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white" />
          <Swiper
            modules={[Autoplay, Navigation, Pagination]}
            spaceBetween={30}
            slidesPerView={1}
            loop={true}
            autoplay={{
              delay: 2000,
              disableOnInteraction: false,
            }}
            navigation={{
              prevEl: ".custom-prev",
              nextEl: ".custom-next",
            }}
            breakpoints={{
              640: { slidesPerView: 1.5 },
              768: { slidesPerView: 2 },
              1024: { slidesPerView: 2.5 },
            }}
            pagination={{ clickable: true }}
            className="pb-18 team-swiper"
          >
            {teamMembers.map((member, index) => (
              <SwiperSlide key={index}>
                <div className="bg-white border border-gray-100 p-10 rounded-[45px] shadow-[0_10px_40px_rgba(0,0,0,0.04)] text-center h-full transition-all duration-300 hover:shadow-xl border-b-4 hover:border-b-[#4081a2]">
                  {/* Avatar with Design-Specific Gradient Border */}
                  <div className="relative w-32 h-32 mx-auto mb-8 p-[3px] bg-gradient-to-tr from-[#FFD700] via-[#FF8C00] to-[#4B0082] rounded-full">
                    <div className="w-full h-full bg-white rounded-full p-1">
                      <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                        {/* Placeholder icon if image is missing */}
                        <img
                          src={member.image}
                          alt={member.name}
                          className="w-full h-full object-cover opacity-80"
                          onError={(e) =>
                            (e.target.src =
                              "https://cdn-icons-png.flaticon.com/512/149/149071.png")
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-1">
                    {member.name}
                  </h3>
                  <p className="text-[#4081a2] font-semibold mb-6 uppercase tracking-wider text-sm">
                    {member.role}
                  </p>
                  <p className="text-gray-500 leading-relaxed">{member.bio}</p>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          {/* pagination dots container (swiper inserts automatically) */}
          <div className="swiper-pagination flex justify-center mt-6" />
        </div>
      </div>
    </section>
  );
};

export default OurTeams;
