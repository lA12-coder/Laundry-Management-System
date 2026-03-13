import React from "react";
import { useForm } from "react-hook-form";
import { GoogleLogin } from "@react-oauth/google";
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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const { login, googleLogin } = useContext(AuthContext);
  const { loading } = useSelector((state) => state.auth);

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await googleLogin(credentialResponse.credential);
      navigate(from, { replace: true });
    } catch (error) {
      console.error("Google Login Error:", error);
    }
  };

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

          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-100"></div>
            <span className="px-4 text-xs font-bold text-gray-400 uppercase">
              OR
            </span>
            <div className="flex-1 border-t border-gray-100"></div>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => console.error("Google Auth Failed")}
              useOneTap
              shape="circle"
            />
          </div>
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
