import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { assets } from "../../assets/assets";

const OurStory = () => {
  const [stats, setStats] = useState({
    orders: 20,
    partners: 0,
    customers: 500,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => {
        const next = {
          orders: prev.orders < 100 ? prev.orders + 1 : prev.orders,
          partners: prev.partners < 20 ? prev.partners + 1 : prev.partners,
          customers:
            prev.customers < 1000 ? prev.customers + 10 : prev.customers,
        };
        // stop when nothing changes
        if (
          next.orders === prev.orders &&
          next.partners === prev.partners &&
          next.customers === prev.customers
        ) {
          clearInterval(interval);
        }
        return next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className=" py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col-reverse lg:flex-row items-center gap-12">
          {/* text */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex-1 space-y-8"
          >
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900">
              Our Story
            </h2>
            <div className="text-gray-600 space-y-6 leading-relaxed text-base lg:text-lg">
              <p>
                Laundry is a routine task that often steals time from what truly
                matters. FuaLaundry was created to change that. We started as a
                student-led startup with a simple idea: customers deserve clean
                clothes without stress, delays, or hidden costs.
              </p>
              <p>
                By partnering with professional local laundries, we built a
                system that combines quality cleaning with modern technology.
                Our platform manages orders, logistics, and communication so
                customers enjoy a smooth, reliable experience every time.
              </p>
            </div>
            {/* stats */}
            <div className="mt-12 bg-[#4081a2] rounded-3xl p-8 text-white shadow-xl">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-4xl font-bold">{stats.orders}+</div>
                  <div className="uppercase text-sm tracking-wide opacity-90">
                    Orders
                  </div>
                </div>
                <div>
                  <div className="text-4xl font-bold">{stats.partners}+</div>
                  <div className="uppercase text-sm tracking-wide opacity-90">
                    Partners
                  </div>
                </div>
                <div>
                  <div className="text-4xl font-bold">{stats.customers}+</div>
                  <div className="uppercase text-sm tracking-wide opacity-90">
                    Loyal Customers
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* image */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex-1 flex justify-center"
          >
            <div className="relative w-full max-w-md">
              <div className="rounded-3xl overflow-hidden">
                <img
                  src={assets.OurStoryImg}
                  alt="Team working on laundry app"
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className="absolute -inset-3 bg-[#4081a2] -z-10 rounded-3xl blur-md opacity-40"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default OurStory;
