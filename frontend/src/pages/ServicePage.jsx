import React from "react";
import CommonHero from "../components/common/CommonHero";
import { servicesData, differentiators } from "../assets/assets";
import ServiceFeature from "../components/layout/ServiceFeature";
import DifferentiatorSection from "../components/layout/DifferentiatorSection";

export default function ServicesPage() {
  return (
    <main className="w-full bg-white overflow-hidden">
      <CommonHero
        titlePrefix=" Our"
        titleHighlight="Services"
        description="At Fua Laundry, we don't just clean clothes; we revive, refresh, and rejuvenate your belongings. Trust our expert team to provide meticulous care and personalized service with every order."
        breadcrumb="Services"
      />

      <div className="pt-10">
        {servicesData.map((service, index) => (
          <ServiceFeature
            key={index}
            title={service.title}
            description={service.description}
            image={service.image}
            reverse={service.reverse}
            bgGray={index % 2 !== 0}
          />
        ))}
      </div>

      <DifferentiatorSection
        title="What makes Fua <br class='md:hidden' /> Different ?"
        items={differentiators}
      />
    </main>
  );
}
