import React from "react";
import { useForm } from "react-hook-form";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import AuthLayout from "../components/auth/AuthLayout";
import { Link, useLocation, useNavigate } from "react-router-dom";
import LaundryLoader from "../components/common/LaundryLoader";
import { useSelector } from "react-redux";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";
  const infoMessage = location.state?.message;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();
  const { login, resendVerificationEmail } = useContext(AuthContext);
  const { loading, error } = useSelector((state) => state.auth);
  const emailValue = watch("email");

  const onLogin = async (data) => {
    try {
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Please enter your details to login."
    >
      {infoMessage && (
        <p className="bg-blue-50 text-blue-700 p-3 rounded-lg mb-4 text-sm font-bold">
          {infoMessage}
        </p>
      )}
      {error && (
        <p className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm font-bold">
          {error}
        </p>
      )}
      {loading ? (
        <LaundryLoader />
      ) : (
        <form onSubmit={handleSubmit(onLogin)} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
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
              className="w-full p-4 border border-gray-100 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-[#4c84a4]"
            />
            {errors.email && (
              <span className="text-red-500 text-xs">
                {errors.email.message}
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
              Password
            </label>
            <input
              type="password"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              })}
              className="w-full p-4 border border-gray-100 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-[#4c84a4]"
            />
            {errors.password && (
              <span className="text-red-500 text-xs">
                {errors.password.message}
              </span>
            )}
          </div>

          <button className="w-full py-4 bg-[#4c84a4] text-white font-black italic rounded-xl shadow-lg hover:bg-[#3d6a83] transition-all">
            LOG IN
          </button>

          <button
            type="button"
            onClick={async () => {
              if (!emailValue) return;
              try {
                await resendVerificationEmail(emailValue);
                navigate("/login", {
                  replace: true,
                  state: { message: "Verification email resent successfully." },
                });
              } catch (resendError) {
                // Global auth error state will display backend message.
              }
            }}
            className="w-full mt-4 text-sm text-[#4c84a4] font-semibold hover:underline"
          >
            Resend verification email
          </button>
          <p className="text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <Link to="/signup" className="text-[#FD9837] font-bold italic">
              Sign Up
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
};

export default LoginPage;
