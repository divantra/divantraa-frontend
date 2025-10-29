import HeroSection from './HeroSection';
import AboutSection from './AboutSection';
import ProductsSection from './ProductsSection';
import TestimonialsSection from './TestimonialsSection';
import NewsletterSection from './NewsletterSection';
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
