import React from "react";
import { MoveDown } from "lucide-react";

const LaundryLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-10">
      <div className="relative">
        {/* The "Washing Machine" Drum */}
        <div className="w-20 h-20 border-8 border-gray-100 border-t-[#4c84a4] rounded-full animate-spin"></div>

        {/* The "Clothes" Icon in the middle */}
        <div className="absolute inset-0 flex items-center justify-center animate-bounce">
          <div className="w-6 h-6 bg-[#FD9837] rounded-sm rotate-12 shadow-sm"></div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-[#4c84a4] font-black italic uppercase tracking-widest text-sm animate-pulse">
          Cleaning things up...
        </p>
        <p className="text-gray-400 text-[10px] font-bold uppercase mt-1">
          Authenticating your session
        </p>
      </div>
    </div>
  );
};

export default LaundryLoader;
