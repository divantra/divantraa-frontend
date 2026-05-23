import React from 'react';
import { Card, Typography, Button, Badge, Space, Carousel } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const ProductsSection: React.FC = () => {
  const products = [
    {
      image: '/images/Oils/groundnut-oil.png',
      title: 'Wood-Pressed Groundnut Oil (1L)',
      description:
        'Cold-pressed from premium groundnuts. Rich in natural antioxidants and nutrients.',
      price: '450',
      offerPrice: '399',
      isBestSeller: true,
      discount: 10,
    },
    {
      image: '/images/Oils/coconut-oil.png',
      title: 'Wood-Pressed Coconut Oil (1L)',
      description: 'Pure, natural coconut oil — great for cooking, hair, and skincare.',
      price: '500',
      offerPrice: '420',
      tag: 'New Launch',
      discount: 15,
    },
    {
      image: '/images/Oils/sesame-oil.png',
      title: 'Cold-Pressed Sesame Oil (1L)',
      description: 'Extracted from high-quality sesame seeds for a rich, nutty aroma.',
      price: '480',
      offerPrice: '430',
      discount: 10,
    },
    {
      image: '/images/Oils/mustard-oil.png',
      title: 'Wood-Pressed Mustard Oil (1L)',
      description: 'Strong aroma, rich in omega-3. Ideal for Indian cooking and pickles.',
      price: '520',
      offerPrice: '460',
      isBestSeller: true,
    },
    {
      image: '/images/Oils/safflower-oil.png',
      title: 'Cold-Pressed Safflower Oil (1L)',
      description: 'Light, heart-friendly oil perfect for everyday cooking and frying.',
      price: '550',
      offerPrice: '499',
    },
    {
      image: '/images/Oils/flaxseed-oil.png',
      title: 'Cold-Pressed Flaxseed Oil (500ml)',
      description: 'High in omega-3 fatty acids. Great for salads and nutritional use.',
      price: '600',
      offerPrice: '520',
      tag: 'Limited Edition',
    },
    {
      image: '/images/Oils/sunflower-oil.png',
      title: 'Wood-Pressed Sunflower Oil (1L)',
      description: 'Naturally extracted and chemical-free — ideal for light cooking.',
      price: '480',
      offerPrice: '420',
      discount: 12,
    },
    {
      image: '/images/Oils/castor-oil.png',
      title: 'Cold-Pressed Castor Oil (500ml)',
      description: 'Multipurpose oil used for hair care, skin therapy, and wellness.',
      price: '350',
      offerPrice: '299',
    },
    {
      image: '/images/Oils/almond-oil.png',
      title: 'Pure Sweet Almond Oil (250ml)',
      description: 'Rich in vitamin E — perfect for baby massage, skin, and hair.',
      price: '750',
      offerPrice: '650',
      isBestSeller: true,
    },
    {
      image: '/images/Oils/blackseed-oil.png',
      title: 'Cold-Pressed Black Seed (Kalonji) Oil (250ml)',
      description: 'Boosts immunity, improves skin, and supports overall wellness.',
      price: '700',
      offerPrice: '620',
      discount: 8,
    },
  ];

  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 3,
        },
      },
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 576,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  return (
    <section style={{ padding: '40px 20px', background: '#fcfcfc' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>Our Products</Title>
        <Carousel {...carouselSettings} style={{ minHeight: '200px' }}>
          {products.map((p, i) => (
            <Card bodyStyle={{ padding: '0 20px' }} bordered={false} key={i} hoverable>
              <div key={i}>
              <Badge.Ribbon 
                text={p.isBestSeller ? 'Best Seller' : p.tag} 
                color="#4f772d"
                style={{ display: (p.isBestSeller || p.tag) ? 'block' : 'none' }}
              >
                <Card
                  bordered={false}
                  hoverable={false}
                  cover={
                    <img 
                      alt={p.title} 
                      src={p.image} 
                      style={{ height: 280, width: '100%', objectFit: 'cover' }} 
                    />
                  }
                  actions={[
                    <Button 
                      type="primary" 
                      icon={<ShoppingCartOutlined />} 
                      style={{ background: '#4f772d', width: '90%' }}
                    >
                      ADD TO CART
                    </Button>
                  ]}
                  styles={{ body: { padding: '16px', textAlign: 'center' } }}
                >
                  <Paragraph 
                    strong 
                    ellipsis={{ rows: 2, tooltip: p.title }} 
                    style={{ fontSize: '14px', marginBottom: 2, lineHeight: '1.5' }}
                  >
                    {p.title}
                  </Paragraph>

                  <Paragraph 
                    ellipsis={{ rows: 2, tooltip: p.title }} 
                    style={{ fontSize: '12px', marginBottom: 8, minHeight: 42, lineHeight: '1.5' }}
                  >
                    {p.description}
                  </Paragraph>

                  <Space direction="vertical" size={0}>
                    <Text style={{ color: '#4f772d', fontSize: '18px', fontWeight: 'bold' }}>
                      ₹{p.offerPrice}
                    </Text>
                    {p.price !== p.offerPrice && (
                      <Text delete type="secondary" style={{ fontSize: '12px' }}>
                        MRP: ₹{p.price}
                      </Text>
                    )}
                  </Space>
                </Card>
              </Badge.Ribbon>
            </div>
            </Card>
          ))}
        </Carousel>
      </div>
    </section>
  );
};
export default ProductsSection;
