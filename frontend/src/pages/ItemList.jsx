import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Search, RotateCcw, Plus, Minus, ShoppingBag, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { addToCart, removeFromCart } from "../redux/cartSlice";
import CommonHero from "../components/common/CommonHero";
import { useNavigate } from "react-router-dom";
import api from "../API/axios";
import { formatETB } from "../lib/currency";

const ItemListPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, totalAmount } = useSelector((state) => state.cart);
  const [searchTerm, setSearchTerm] = useState("");
  const [localQuantities, setLocalQuantities] = useState({});
  const { data: products = [] } = useQuery({
    queryKey: ["priceList"],
    queryFn: async () => {
      const res = await api.get("/admin/price-list/");
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 60_000,
  });

  // Updates the number on the card without affecting Redux
  const handleUpdateLocalQty = (id, delta) => {
    setLocalQuantities((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + delta),
    }));
  };

  // Only this function sends data to your Redux Store
  const handleAddToBasket = (product) => {
    const qty = localQuantities[product.id] || 0;
    if (qty > 0) {
      dispatch(
        addToCart({
          id: product.id,
          price_list_entry_id: product.id,
          cloth_name: product.cloth_name,
          size: product.size,
          price: Number(product.fua_price),
          image: product.image,
          quantity: qty,
        }),
      );
      setLocalQuantities((prev) => ({ ...prev, [product.id]: 0 }));
    }
  };

  const handleReset = () => {
    setSearchTerm("");
    setLocalQuantities({});
    const input = document.querySelector("#searchInput");
    if (input) input.value = "";
  };

  const filteredProducts = products.filter((p) =>
    p.cloth_name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleRemoveFromBasket = (id) => {
    dispatch(removeFromCart(id));
  };

  return (
    <div className="min-h-screen bg-white">
      <CommonHero
        titlePrefix="Items"
        titleHighlight="List"
        description="Choose from the list of clothes and add to your basket"
        breadcrumb="Items"
      />

      <div className="max-w-7xl mx-auto px-6 pb-20 mt-10">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left Side: Product Search & Grid */}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-10">
              <div className="relative flex-1">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  id="searchInput"
                  placeholder="Search for clothes..."
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-[#4c84a4] outline-none font-medium text-gray-700"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                className="flex items-center gap-2 text-[#4c84a4] font-bold italic uppercase tracking-wider hover:opacity-70 transition-opacity"
                onClick={handleReset}
              >
                <RotateCcw size={18} /> Reset
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredProducts.map((product) => {
                const currentLocalQty = localQuantities[product.id] || 0;

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-[35px] p-6 shadow-xl border border-gray-100 hover:scale-[1.02] transition-transform"
                  >
                    <div className="h-48 bg-gray-50 rounded-2xl mb-6 flex items-center justify-center p-4">
                      <img
                        src={product.image}
                        alt={product.cloth_name}
                        className="max-h-full object-contain"
                      />
                    </div>

                    <h3 className="text-2xl font-black italic text-gray-900 text-center mb-1 uppercase tracking-tight">
                      {product.cloth_name}
                    </h3>
                    <p className="text-[#4c84a4] font-bold text-center mb-6">
                      {formatETB(product.fua_price)}
                    </p>

                    {/* Local Quantity Control */}
                    <div className="flex items-center justify-center gap-6 mb-6">
                      <button
                        onClick={() => handleUpdateLocalQty(product.id, -1)}
                        className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors shadow-sm"
                      >
                        <Minus size={20} />
                      </button>

                      <span className="text-2xl font-black italic text-gray-800 min-w-[30px] text-center">
                        {currentLocalQty}
                      </span>

                      <button
                        onClick={() => handleUpdateLocalQty(product.id, 1)}
                        className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-[#4c84a4] hover:bg-blue-50 transition-colors shadow-sm"
                      >
                        <Plus size={20} />
                      </button>
                    </div>

                    <button
                      onClick={() => handleAddToBasket(product)}
                      disabled={currentLocalQty === 0}
                      className={`w-full py-4 font-black italic uppercase rounded-2xl shadow-lg transition-all transform active:scale-95 ${
                        currentLocalQty === 0
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                          : "bg-[#4c84a4] text-white hover:bg-[#3d6a83]"
                      }`}
                    >
                      Add to Basket
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Side: Sticky Checkout Summary */}
          <div className="w-full lg:w-96">
            <div className="sticky top-10 bg-gray-50 rounded-[40px] p-8 border border-gray-100 shadow-inner">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-black italic text-gray-900">
                  Your Cart
                </h2>
                <div className="relative">
                  <ShoppingBag size={28} className="text-[#4c84a4]" />
                  {items.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {items.length}
                    </span>
                  )}
                </div>
              </div>

              {/* Cart Items List */}
              <div className="space-y-4 mb-10 min-h-[100px] max-h-[400px] overflow-y-auto pr-2">
                {items.length === 0 ? (
                  <p className="text-gray-400 font-medium italic text-center py-10">
                    Basket is empty
                  </p>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between font-bold text-gray-600 border-b border-gray-200/50 pb-2"
                    >
                      <span>
                        {item.cloth_name || item.name}{" "}
                        <span className="text-[#4c84a4] ml-1">
                          x{item.quantity}
                        </span>
                      </span>
                      <div className="flex items-center justify-center space-x-1">
                        <span className="text-gray-900">
                          {formatETB(item.price * item.quantity)}
                        </span>
                        <button
                          onClick={() => handleRemoveFromBasket(item.id)}
                          className="font-bold text-red-400 hover:text-red-600 transition-colors uppercase tracking-tighter self-end"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t-2 border-dashed border-gray-200 pt-8">
                <div className="flex justify-between items-center mb-8">
                  <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">
                    Total Amount
                  </span>
                  <span className="text-4xl font-black italic text-[#FD9837]">
                    {formatETB(totalAmount)}
                  </span>
                </div>

                <button
                  disabled={items.length === 0}
                  className={`w-full py-5 text-white font-black italic uppercase rounded-2xl shadow-xl transition-all text-lg tracking-widest ${
                    items.length === 0
                      ? "bg-gray-300 cursor-not-allowed shadow-none"
                      : "bg-[#FD9837] hover:bg-[#e88a2f]"
                  }`}
                  onClick={() => navigate("/checkout")}
                >
                  Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemListPage;
