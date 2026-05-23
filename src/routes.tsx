import { createBrowserRouter } from 'react-router-dom';
import Home from './Pages/Home';
import Contact from './Pages/Contact';
import AllProducts from './Pages/AllProducts';
import App from './App';
import About from './Pages/About';
import WoodPressedSection from './Pages/WoodPressedSection';
import NewLaunchedSection from './Pages/NewLaunchedSection';
import Login from './Pages/Auth/Login';
import Register from './Pages/Auth/Register';
import ForgotPassword from './Pages/Auth/Forgot-Password';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/contact', element: <Contact /> },
      { path: '/products', element: <AllProducts /> },
      { path: '/about', element: <About /> },
      { path: '/wood-pressed-section', element: <WoodPressedSection /> },
      { path: '/newly-launched', element: <NewLaunchedSection /> },
      { path: '/oils', element: <AllProducts /> },

      // --- Public/Guest Only Routes ---
      {
        element: <PublicRoute />,
        children: [
          { path: '/login', element: <Login /> },
          { path: '/register', element: <Register /> },
          { path: '/forgot-password', element: <ForgotPassword /> },
        ],
      },
    ],
  },
  // --- Protected Routes ---
  {
    element: <ProtectedRoute />, // All children here are protected
    children: [
      {
        path: "/dashboard",
        element: <AllProducts />,
      },
    ],
  },
]);
