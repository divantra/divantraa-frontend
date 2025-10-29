import { Outlet } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';

function App() {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>

      {/* <footer>
        <p>© 2025 My React Vite App</p>
      </footer> */}
      <Footer />
    </>
  );
}

export default App;
