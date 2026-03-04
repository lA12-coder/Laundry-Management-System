import React from "react";
import Hero from "../components/layout/Hero";
import HowItWorks from "../components/layout/HowItWorks";
import WhyChooseUs from "../components/layout/WhyChooseUs";
import ClothSelection from "../components/orders/ClothSelection";
import PricingPlans from "../components/layout/PricingPlans";
import Testimonials from "../components/layout/Testimonials";

const Home = () => {
  return (
    <>
      <Hero />
      <HowItWorks />
      <WhyChooseUs />
      <ClothSelection />
      <PricingPlans />
      <Testimonials />
    </>
  );
};

export default Home;
