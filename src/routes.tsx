import { createBrowserRouter } from 'react-router-dom';
import Home from './Pages/Home';
import Contact from './Pages/Contact';
import AllProducts from './Pages/AllProducts';
import App from './App';
import About from './Pages/About';
import WoodPressedSection from './Pages/WoodPressedSection';
import NewLaunchedSection from './Pages/NewLaunchedSection';

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
    ],
  },
]);
