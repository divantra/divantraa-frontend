import { Navigate, Outlet, useLocation } from "react-router";
import Header from "./components/Header";
import Footer from "./components/Footer";

// This is a dummy function, replace with your actual auth logic
const useAuth = () => {
  const accessToken = localStorage.getItem("accessToken");
  return accessToken ? { loggedIn: true } : { loggedIn: false };
};

const ProtectedRoute = () => {
  const { loggedIn } = useAuth();
  const location = useLocation();

  if (!loggedIn) {
    // Redirect to login, but save the current location to return to later
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <div style={{ margin: 0, padding: 0 }}>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>;
};

export default ProtectedRoute;
