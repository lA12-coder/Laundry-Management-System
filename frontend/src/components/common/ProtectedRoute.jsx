import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { useContext } from "react";
import LaundryLoader from "./LaundryLoader";
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LaundryLoader />
      </div>
    );
  }
  return children;
};

export default ProtectedRoute;
