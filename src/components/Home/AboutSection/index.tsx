import './AboutSection.css';
import { FaTree, FaTractor, FaClipboardCheck } from 'react-icons/fa';
import { GiOilDrum } from 'react-icons/gi';

const AboutSection = () => {
  const features = [
    {
      icon: <FaTree className="icon" />,
      title: 'Native Sourcing',
      description: 'Highest quality raw material from native regions all over India.',
    },
    {
      icon: <GiOilDrum className="icon" />,
      title: 'Traditional Processing',
      description:
        'Minimally processed using time-tested methods, made better. For maximum nutrition.',
    },
    {
      icon: <FaClipboardCheck className="icon" />,
      title: 'Extensive Quality Checks',
      description:
        'Everything goes through 40+ lab tests, to make sure that you get only what is best.',
    },
    {
      icon: <FaTractor className="icon" />,
      title: 'Better Rural Lives',
      description: '5000+ farmer families are empowered with every Divantraa product you buy.',
    },
  ];

  return (
    <section className="why-choose-divantraa">
      <h2>Why Choose Divantraa?</h2>
      <div className="features-container">
        {features.map((feature, index) => (
          <div className="feature-card" key={index}>
            {feature.icon}
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AboutSection;
