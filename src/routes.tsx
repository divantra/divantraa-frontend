import { createBrowserRouter } from 'react-router-dom';
import Home from './Pages/Home';
import Contact from './Pages/Contact';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/contact',
    element: <Contact />,
  },
]);
