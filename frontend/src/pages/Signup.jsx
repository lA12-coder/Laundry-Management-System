import React from "react";
import { useForm } from "react-hook-form";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";
import LaundryLoader from "../components/common/LaundryLoader";
import { useSelector } from "react-redux";
import { isValidPhoneInput, normalizePhoneInput } from "../lib/phone";

const SignupPage = () => {
  const navigate = useNavigate();
  const {
    register: registerUser,
    error,
  } = useContext(AuthContext);
  const { loading } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  //Watch password to validate "Confirm Password" field
  const password = watch("password");

  const onSignup = async (data) => {
    try {
      await registerUser({
        full_name: data.full_name,
        email: data.email,
        phone_number: normalizePhoneInput(data.phone_number),
        password: data.password,
      });
      navigate("/login", {
        state: { message: "Registration successful. You can log in now." },
      });
    } catch (err) {
      // Error handled in context
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join Fua Laundry for a fresh experience."
    >
      {/* Error Message Display */}
      {error && (
        <p className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm font-bold">
          {error}
        </p>
      )}

      {loading ? (
        <LaundryLoader />
      ) : (
        <div>
          <form onSubmit={handleSubmit(onSignup)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">
                  Full Name
                </label>
                <input
                  {...register("full_name", { required: "Name is required" })}
                  className={`w-full p-4 bg-gray-50 border rounded-xl outline-none transition-all ${
                    errors.full_name
                      ? "border-red-400"
                      : "border-transparent focus:border-[#4c84a4]"
                  }`}
                  placeholder="John Doe"
                />
                {errors.full_name && (
                  <span className="text-red-500 text-[10px] font-bold">
                    {errors.full_name.message}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">
                  Phone
                </label>
                <input
                  {...register("phone_number", {
                    required: "Phone is required",
                    validate: (value) =>
                      isValidPhoneInput(value) || "Use 09XXXXXXXX or +2519XXXXXXXX",
                  })}
                  className={`w-full p-4 bg-gray-50 border rounded-xl outline-none transition-all ${
                    errors.phone_number
                      ? "border-red-400"
                      : "border-transparent focus:border-[#4c84a4]"
                  }`}
                  placeholder="09XXXXXXXX or +2519XXXXXXXX"
                />
                {errors.phone_number && (
                  <span className="text-red-500 text-[10px] font-bold">
                    {errors.phone_number.message}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-1">
                Email
              </label>
              <input
                type="email"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/i,
                    message: "Invalid email address",
                  },
                })}
                className={`w-full p-4 bg-gray-50 border rounded-xl outline-none transition-all ${
                  errors.email
                    ? "border-red-400"
                    : "border-transparent focus:border-[#4c84a4]"
                }`}
                placeholder="email@example.com"
              />
              {errors.email && (
                <span className="text-red-500 text-[10px] font-bold">
                  {errors.email.message}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  {...register("password", {
                    required: "Password required",
                    minLength: { value: 8, message: "Min 8 chars" },
                  })}
                  className={`w-full p-4 bg-gray-50 border rounded-xl outline-none transition-all ${
                    errors.password
                      ? "border-red-400"
                      : "border-transparent focus:border-[#4c84a4]"
                  }`}
                />
                {errors.password && (
                  <span className="text-red-500 text-[10px] font-bold">
                    {errors.password.message}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">
                  Confirm
                </label>
                <input
                  type="password"
                  {...register("confirmPassword", {
                    required: "Confirm password is required",
                    validate: (value) =>
                      value === password || "Passwords don't match",
                  })}
                  className={`w-full p-4 bg-gray-50 border rounded-xl outline-none transition-all ${
                    errors.confirmPassword
                      ? "border-red-400"
                      : "border-transparent focus:border-[#4c84a4]"
                  }`}
                />
                {errors.confirmPassword && (
                  <span className="text-red-500 text-[10px] font-bold">
                    {errors.confirmPassword.message}
                  </span>
                )}
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full py-4 bg-[#4c84a4] text-white font-black italic rounded-xl shadow-lg hover:bg-[#3d6a83] transition-all uppercase tracking-widest disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="text-[#FD9837] font-bold italic">
              Log In
            </Link>
          </p>
        </div>
      )}
    </AuthLayout>
  );
};

export default SignupPage;
