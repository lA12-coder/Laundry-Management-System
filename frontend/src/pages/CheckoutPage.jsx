import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  MapPin,
  Clock,
  ChevronRight,
  Phone,
  Home,
  Building,
  Check,
  PhoneCall,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import LaundryLoader from "../components/common/LaundryLoader";
import api from "../API/axios";
import { toast } from "react-hot-toast";
import { clearCart } from "../redux/cartSlice";
import { formatETB } from "../lib/currency";

const CheckoutPage = () => {
  const { items, totalAmount, totalQuantity } = useSelector(
    (state) => state.cart,
  );
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const phoneNumber = "+251970713018";
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();

  // urgency charge configuration
  const urgency = watch("urgency", "regular");
  const urgencyFee = urgency === "urgent" ? totalQuantity * 10 : 0;
  const finalTotal = totalAmount + urgencyFee;

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const normalizedPhone = data.phone.startsWith("+")
        ? data.phone
        : data.phone.startsWith("0")
          ? `+251${data.phone.slice(1)}`
          : `+251${data.phone}`;
      const delivery_address = `${data.city}, ${data.subcity}, ${data.kebele}`.trim();
      const payload = {
        customer: user?.id,
        customer_name: user?.full_name || "Guest Customer",
        customer_phone: normalizedPhone,
        delivery_address,
        urgency,
        items: items.map((item) => ({
          price_list_entry_id: item.price_list_entry_id || item.id,
          quantity: item.quantity,
        })),
      };
      await api.post("/orders/", payload);
      dispatch(clearCart());
      toast.success("Order placed successfully.");
      setLoading(false);
      navigate("/dashboard");
    } catch (error) {
      setLoading(false);
      toast.error(error?.response?.data?.error || "Unable to place order.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-20 px-6">
      {loading ? (
        <LaundryLoader />
      ) : (
        <div className="max-w-6xl mx-auto">
          <header className="mb-12">
            <h1 className="text-4xl md:text-5xl font-black italic text-gray-900">
              Finalize <span className="text-[#FD9837]">Order</span>
            </h1>
            <p className="text-gray-500 font-medium italic mt-2">
              <Link to="/">Home</Link> &gt; <Link to="/item-list">Items</Link>{" "}
              &gt; Checkout
            </p>
          </header>

          <form
            className="grid grid-cols-1 lg:grid-cols-3 gap-12"
            onSubmit={handleSubmit(onSubmit)}
          >
            {/* Left Column: Delivery & Schedule */}
            <div className="lg:col-span-2 space-y-8">
              {/* Delivery Details Card */}
              <div className="bg-white p-8 rounded-[35px] shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-8 text-[#4c84a4]">
                  <MapPin size={28} />
                  <h2 className="text-2xl font-black italic text-gray-800">
                    Delivery Details
                  </h2>
                </div>

                <div className="space-y-6">
                  {/* User Context */}
                  <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 mb-6">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">
                      Customer
                    </p>
                    <p className="text-xl font-black italic text-[#4c84a4]">
                      {user?.name || "Guest User"}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* City */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 ml-2">
                        City
                      </label>
                      <div className="relative">
                        <Home
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
                          size={18}
                        />
                        <input
                          {...register("city", {
                            required: "City is required",
                          })}
                          type="text"
                          placeholder="Addis Ababa"
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border border-transparent focus:border-[#4c84a4] focus:bg-white outline-none transition-all font-medium"
                        />
                      </div>
                      {errors.city && (
                        <p className="text-red-500 text-xs mt-2 ml-2">
                          {errors.city.message}
                        </p>
                      )}
                    </div>

                    {/* Subcity */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 ml-2">
                        Subcity / Wereda
                      </label>
                      <div className="relative">
                        <Building
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
                          size={18}
                        />
                        <input
                          {...register("subcity", {
                            required: "Subcity is required",
                          })}
                          type="text"
                          placeholder="Bole, Wereda 03"
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border border-transparent focus:border-[#4c84a4] focus:bg-white outline-none transition-all font-medium"
                        />
                      </div>
                      {errors.subcity && (
                        <p className="text-red-500 text-xs mt-2 ml-2">
                          {errors.subcity.message}
                        </p>
                      )}
                    </div>

                    {/* Kebele */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 ml-2">
                        Kebele / House No.
                      </label>
                      <input
                        {...register("kebele", {
                          required: "Kebele details required",
                        })}
                        type="text"
                        placeholder="Kebele 14, House 102"
                        className="w-full px-6 py-4 bg-gray-50 rounded-2xl border border-transparent focus:border-[#4c84a4] focus:bg-white outline-none transition-all font-medium"
                      />
                      {errors.kebele && (
                        <p className="text-red-500 text-xs mt-2 ml-2">
                          {errors.kebele.message}
                        </p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 ml-2">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
                          size={18}
                        />
                        <input
                          {...register("phone", {
                            required: "Phone is required",
                            pattern: {
                              value: /^\d{10}$/,
                              message: "Must be 10 digits",
                            },
                          })}
                          type="tel"
                          placeholder="0911000000"
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border border-transparent focus:border-[#4c84a4] focus:bg-white outline-none transition-all font-medium"
                        />
                      </div>
                      {errors.phone && (
                        <p className="text-red-500 text-xs mt-2 ml-2">
                          {errors.phone.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pickup & Delivery Card */}
              <div className="bg-white p-8 rounded-[35px] shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-8 text-[#4c84a4]">
                  <Clock size={28} />
                  <h2 className="text-2xl font-black italic text-gray-800">
                    Scheduling
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 ml-2">
                      Pickup Date & Time
                    </label>
                    <input
                      {...register("pickupDateTime", {
                        required: "Pickup time required",
                      })}
                      type="datetime-local"
                      className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-[#4c84a4] font-medium text-gray-600"
                    />
                    {errors.pickupDateTime && (
                      <p className="text-red-500 text-xs mt-2 ml-2">
                        {errors.pickupDateTime.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 ml-2">
                      Requested Delivery Time
                    </label>
                    <input
                      {...register("deliveryTime", {
                        required: "Delivery time required",
                      })}
                      type="time"
                      className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-[#4c84a4] font-medium text-gray-600"
                    />
                    {errors.deliveryTime && (
                      <p className="text-red-500 text-xs mt-2 ml-2">
                        {errors.deliveryTime.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {/* Order Type Card */}
              <div className="bg-white p-8 rounded-[35px] shadow-sm border border-gray-100">
                <h3 className="text-xl font-black italic text-gray-900 mb-4">
                  Order Type
                </h3>
                <div className="flex items-center gap-6">
                  <label className="inline-flex items-center">
                    <input
                      {...register("urgency")}
                      type="radio"
                      value="regular"
                      defaultChecked
                      className="form-radio text-[#4c84a4]"
                    />
                    <span className="ml-2">Regular</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      {...register("urgency")}
                      type="radio"
                      value="urgent"
                      className="form-radio text-[#4c84a4]"
                    />
                    <span className="ml-2">
                      Urgent (+10&nbsp;Birr per item)
                    </span>
                  </label>
                </div>
              </div>
              <div className="bg-white p-8 rounded-[35px] shadow-sm border border-gray-100">
                <h3 className="text-xl font-black italic text-gray-900 mb-6 flex items-center gap-2">
                  Service <span className="text-[#4c84a4]">Notes</span>
                </h3>

                <div className="space-y-4">
                  {/* Urgent Price Note */}
                  <div className="flex items-start gap-3">
                    <div className="mt-1 bg-green-100 rounded-full p-1 flex-shrink-0">
                      <Check
                        size={12}
                        className="text-green-600 stroke-[4px]"
                      />
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      For{" "}
                      <span className="font-bold text-gray-800 italic">
                        urgent orders
                      </span>
                      , the price increases by{" "}
                      <span className="text-[#FD9837] font-black">ETB 20</span>{" "}
                      per item.
                    </p>
                  </div>

                  {/* Delivery Time Note */}
                  <div className="flex items-start gap-3">
                    <div className="mt-1 bg-green-100 rounded-full p-1 flex-shrink-0">
                      <Check
                        size={12}
                        className="text-green-600 stroke-[4px]"
                      />
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Regular orders:{" "}
                      <span className="font-bold text-gray-800">48 hrs</span> |
                      Urgent orders:{" "}
                      <span className="font-bold text-[#4c84a4]">24 hrs</span>.
                    </p>
                  </div>

                  {/* Special Service / Call Note */}
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 mt-4">
                    <div className="mt-1 bg-[#4c84a4] rounded-full p-1.5 flex-shrink-0">
                      <PhoneCall size={14} className="text-white" />
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Don't see your item? Or need a{" "}
                      <span className="italic font-bold">special wash?</span>{" "}
                      <a
                        href={`tel:${phoneNumber}`}
                        className="w-full py-3 bg-white border-2 border-[#4c84a4] text-[#4c84a4] font-black italic uppercase rounded-xl flex items-center justify-center gap-2 hover:bg-[#4c84a4] hover:text-white transition-all shadow-sm"
                      >
                        Call Customer Support
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary */}
            <div className="h-fit sticky top-28">
              <div className="bg-white p-8 rounded-[40px] shadow-2xl border border-gray-100">
                <h3 className="text-2xl font-black italic text-gray-900 mb-8 pb-4 border-b border-gray-50">
                  Order Summary
                </h3>

                <div className="space-y-4 mb-10">
                  <div className="flex justify-between text-gray-500 font-bold italic">
                    <span>Subtotal</span>
                    <span>{formatETB(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 font-bold italic">
                    <span>Delivery Fee</span>
                    <span className="text-green-500 uppercase text-sm">
                      Free
                    </span>
                  </div>
                  {urgencyFee > 0 && (
                    <div className="flex justify-between text-gray-500 font-bold italic">
                      <span>Urgency Fee</span>
                      <span>{formatETB(urgencyFee)}</span>
                    </div>
                  )}
                  <div className="pt-6 mt-6 border-t-2 border-dashed border-gray-100 flex justify-between items-center">
                    <span className="text-gray-900 font-black italic uppercase tracking-wider">
                      Total Amount
                    </span>
                    <span className="text-4xl font-black italic text-[#FD9837]">
                      {formatETB(finalTotal)}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-6 bg-[#4c84a4] text-white font-black italic uppercase rounded-2xl shadow-[0_10px_20px_rgba(76,132,164,0.3)] hover:bg-[#3d6a83] hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 tracking-widest"
                >
                  {loading ? "Processing Order..." : "Confirm Order"}{" "}
                  <ChevronRight size={22} />
                </button>

                <p className="text-center text-gray-400 text-[10px] mt-6 font-bold uppercase tracking-tighter">
                  By clicking, you agree to our terms of service
                </p>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
