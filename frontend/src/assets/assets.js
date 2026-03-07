import Logo from "../assets/img/logo.png";
import HeroImg from "../assets/img/HeroImg.png";
import LogoBlue from "../assets/img/LogoBlue.png";
import OrderImg from "../assets/img/OrderImg.png";
import PickupImg from "../assets/img/PickupImg.png";
import CleaningImg from "../assets/img/CleaningImg.png";
import DeliveryImg from "../assets/img/DeliveryImg.png";
import WhyChooseUsMain from "../assets/img/WhyChooseUsMain.png";
import TrustedIcon from "../assets/img/TrustedIcon.png";
import PriceIcon from "../assets/img/PriceIcon.png";
import TrackingIcon from "../assets/img/TrackingIcon.png";
import FastDeliveryIcon from "../assets/img/FastDeliveryIcon.png";
import TshirtImg from "../assets/img/TshirtImg.png";
import TrouserImg from "../assets/img/TrouserImg.png";
import SuitImg from "../assets/img/SuitImg.png";
import BorderImg from "../assets/img/BorderImg.png";
import User1 from "../assets/img/User1.jpg";
import User2 from "../assets/img/User1.jpg";
import User3 from "../assets/img/User1.jpg";
import OurStoryImg from "../assets/img/OurStoryImg.png";
import Bubbles from "../assets/img/Bubbles.png";
import ContactImg from "../assets/img/ContactImg.png";

export const assets = {
  Logo,
  HeroImg,
  LogoBlue,
  OrderImg,
  PickupImg,
  CleaningImg,
  DeliveryImg,
  WhyChooseUsMain,
  PriceIcon,
  FastDeliveryIcon,
  TrustedIcon,
  TrackingIcon,
  OurStoryImg,
  Bubbles,
  ContactImg,
};

export const items = [
  { id: 1, name: "T-shirt", price: 30, image: TshirtImg },
  { id: 2, name: "Trouser", price: 50, image: TrouserImg },
  { id: 3, name: "Suit", price: 250, image: SuitImg },
  { id: 1, name: "T-shirt", price: 30, image: TshirtImg },
  { id: 2, name: "Trouser", price: 50, image: TrouserImg },
  { id: 3, name: "Suit", price: 250, image: SuitImg },
];

export const plans = [
  {
    name: "Weekly Plan",
    price: "999",
    period: "week",
    features: [
      "Full access to all standard services",
      "Easy weekly billing",
      "Cancel or upgrade anytime",
      "Lorem ipsum loredo toredo kosum",
    ],
    buttonText: "Choose Weekly",
    isFeatured: false,
  },
  {
    name: "Monthly Plan",
    price: "3999",
    period: "month",
    features: [
      "Full service access",
      "Priority support",
      "Predictable monthly billing",
      "Cancel or upgrade anytime",
      "Better value than weekly",
      "Cancel or upgrade anytime",
    ],
    buttonText: "Choose Monthly",
    isFeatured: true, // This highlights the center card
  },
  {
    name: "3-Month Plan",
    price: "9,999",
    period: "3-month",
    features: [
      "Full service access",
      "Dedicated support",
      "Locked pricing for 3 months",
      "Best overall discount",
    ],
    buttonText: "Choose Quarterly",
    isFeatured: false,
  },
];

export const testimonials = [
  {
    name: "Samuel A.",
    text: "FuaLaundry has completely simplified my week. The pickup and delivery are always on time, and everything comes back perfectly clean. Highly recommended!",
    stars: 5,
    date: "Dec 21, 2025",
    image: User1,
    border: BorderImg,
  },
  {
    name: "Marta K.",
    text: "I love how easy it is to order. The prices are fair, the service is fast, and the tracking feature gives me peace of mind. Truly a game-changer.",
    stars: 4,
    date: "Nov 1, 2025",
    image: User2,
    border: BorderImg,
  },
  {
    name: "Lidiya D.",
    text: "The best laundry experience I've ever had. Their customer service is great, and the free delivery makes it so convenient. I never worry about laundry anymore.",
    stars: 4,
    date: "September 15, 2025",
    image: User3,
    border: BorderImg,
  },
];

export const teamMembers = [
  {
    name: "Eyob Abdisa",
    role: "Founder and CEO",
    bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec placerat odio quis enim semper.",
    image: "/path-to-eyob.png",
  },
  {
    name: "Lidet Admassu",
    role: "Co-Founder & COO",
    bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec placerat odio quis enim semper.",
    image: "/path-to-lidet.png",
  },
  {
    name: "Kidist Wubshet",
    role: "Co-Founder & Marketing Lead",
    bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec placerat odio quis enim semper.",
    image: "/path-to-member3.png",
  },
];

export const servicesData = [
  {
    title: "Wash and Fold",
    description:
      "Our Wash & Fold service is more than just laundry, it's a complete refresh for your wardrobe. Using high-quality, eco-friendly detergents, we remove tough stains while preserving the softness and longevity of your fabrics...",
    image:
      "https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?q=80&w=800", // Replace with FoldImage
    reverse: false,
  },
  {
    title: "Dry Cleaning",
    description:
      "Entrust your most valued garments to our expert Dry Cleaning services. Our experienced professionals are trained to handle a wide range of fabrics and delicate details with precision and care...",
    image:
      "https://images.unsplash.com/photo-1582735689141-b65b64eb8066?q=80&w=800",
    reverse: true,
  },
  {
    title: "Pressing and Ironing",
    description:
      "Our Pressing and Ironing service ensures your garments always look sharp and well-presented. From crisp creases in trousers to perfectly smooth dresses and shirts, our experienced team pays attention to every detail...",
    image:
      "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?q=80&w=800",
    reverse: false,
  },
  {
    title: "Special Request",
    description:
      "Have a special laundry request? We're here to help. From treating stubborn stains to providing specialized care for delicate fabrics, our team is ready to customize the service according to your exact requirements...",
    image:
      "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?q=80&w=800",
    reverse: true,
  },
];

export const differentiators = [
  {
    icon: "/assets/icons/eco.png", // Update paths to your real icons
    title: "Eco-Friendly",
    desc: "We use detergents that are tough on stains but gentle on the planet.",
  },
  {
    icon: "/assets/icons/clock.png",
    title: "Fast Turnaround",
    desc: "72-hour standard turnaround with same-day express options available.",
  },
  {
    icon: "/assets/icons/truck.png",
    title: "Free Pickup & Delivery",
    desc: "Convenient doorstep service to fit your busy schedule.",
  },
  {
    icon: "/assets/icons/badge.png",
    title: "Quality Guarantee",
    desc: "100% satisfaction or we'll redo the service at no extra cost.",
  },
];
