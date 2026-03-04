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
import OurStoryImg from "../assets/img/OurStoryImg.png"

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
};

export const items = [
  { id: 1, name: "T-shirt", price: 30, image:TshirtImg },
  { id: 2, name: "Trouser", price: 50, image: TrouserImg },
  { id: 3, name: "Suit", price: 250, image: SuitImg },
  { id: 1, name: "T-shirt", price: 30, image:TshirtImg },
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