import HeroSection from '../../components/Home/AdvSection';
import AboutSection from '../../components/Home/AboutSection';
import ProductsSection from '../../components/Home/ProductsSection';
import TestimonialsSection from '../../components/Home/TestimonialsSection';
import NewsletterSection from '../../components/Home/NewsletterSection';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      <HeroSection />
      <AboutSection />
      <ProductsSection />
      <TestimonialsSection />
      <NewsletterSection />
    </div>
  );
};

export default Home;
