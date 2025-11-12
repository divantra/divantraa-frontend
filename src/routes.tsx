import { createBrowserRouter } from 'react-router-dom';
import Home from './Pages/Home';
import Contact from './Pages/Contact';
import AllProducts from './Pages/AllProducts';
import App from './App';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/contact', element: <Contact /> },
      { path: '/products', element: <AllProducts /> },
    ],
  },
]);
