import { useEffect, useState, useContext } from "react";
import { Link, useParams } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";
import LaundryLoader from "../components/common/LaundryLoader";
import { AuthContext } from "../context/AuthContext";

const VerifyEmailPage = () => {
  const { uid, token } = useParams();
  const { verifyEmail } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState({ type: "success", message: "" });

  useEffect(() => {
    let active = true;

    const verify = async () => {
      try {
        const res = await verifyEmail(uid, token);
        if (!active) return;
        setResult({
          type: "success",
          message: res.data?.message || "Email verified successfully.",
        });
      } catch (error) {
        if (!active) return;
        setResult({
          type: "error",
          message:
            error.response?.data?.message ||
            "Verification link is invalid or has expired.",
        });
      } finally {
        if (active) setLoading(false);
      }
    };

    verify();
    return () => {
      active = false;
    };
  }, [uid, token, verifyEmail]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LaundryLoader />
      </div>
    );
  }

  return (
    <AuthLayout
      title={result.type === "success" ? "Email Verified" : "Verification Failed"}
      subtitle={result.message}
    >
      <div className="mt-3 text-center">
        <Link to="/login" className="text-[#4c84a4] font-semibold hover:underline">
          Go to Login
        </Link>
      </div>
    </AuthLayout>
  );
};

export default VerifyEmailPage;
