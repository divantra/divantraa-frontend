import { Navigate, Outlet } from "react-router-dom";

// Reusing your logic from ProtectedRoute
const useAuth = () => {
    const accessToken = localStorage.getItem("accessToken");
    return accessToken ? { loggedIn: true } : { loggedIn: false };
};

const PublicRoute = () => {
    const { loggedIn } = useAuth();

    if (loggedIn) {
        // If already logged in, redirect to dashboard or home
        return <Navigate to="/dashboard" replace />;
    }

    // If not logged in, render the login/register pages
    return <Outlet />;
};

export default PublicRoute;