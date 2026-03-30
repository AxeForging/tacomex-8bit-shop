import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Flame, Clock, Truck } from 'lucide-react';
import { PixelButton, ProductCard, LoadingSpinner } from '@/components';
import { useFeaturedProducts, useCategories, useScrollReveal, useStaggerReveal, useTypewriter } from '@/hooks';
import './Landing.css';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { products: featuredProducts, isLoading: productsLoading } = useFeaturedProducts();
  const { categories } = useCategories();

  // Scroll reveal hooks
  const heroReveal = useScrollReveal<HTMLElement>({ threshold: 0.1 });
  const promoReveal = useScrollReveal<HTMLElement>({ threshold: 0.3 });
  const featuresReveal = useScrollReveal<HTMLElement>({ threshold: 0.15 });
  const categoriesReveal = useScrollReveal<HTMLElement>({ threshold: 0.15 });
  const featuredReveal = useScrollReveal<HTMLElement>({ threshold: 0.1 });
  const stepsReveal = useScrollReveal<HTMLElement>({ threshold: 0.15 });
  const ctaReveal = useScrollReveal<HTMLElement>({ threshold: 0.2 });

  // Stagger reveal for features and categories
  const featureStagger = useStaggerReveal(3, 150);
  const categoryStagger = useStaggerReveal(6, 80);
  const stepStagger = useStaggerReveal(4, 120);

  // Typewriter effect for hero
  const typewriter = useTypewriter('Level up your hunger with authentic Mexican flavors!', 40);

  // Start typewriter when hero is visible
  useEffect(() => {
    if (heroReveal.isVisible) typewriter.start();
  }, [heroReveal.isVisible]);

  // Particle effect on hero
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; emoji: string }>>([]);
  const particleId = useRef(0);

  const spawnParticle = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const emojis = ['⭐', '✨', '🌟', '💫'];
    const newParticle = {
      id: particleId.current++,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    };
    setParticles((prev) => [...prev, newParticle]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== newParticle.id));
    }, 600);
  };

  // Category emoji map
  const categoryEmojis: Record<string, string> = {
    tacos: '🌮',
    burritos: '🌯',
    quesadillas: '🧀',
    nachos: '🔺',
    sides: '🍟',
    drinks: '🥤',
    desserts: '🍮',
    combos: '🎁',
  };

  const displayCategories = categories.length > 0
    ? categories.slice(0, 6)
    : ['Tacos', 'Burritos', 'Quesadillas', 'Nachos', 'Drinks', 'Combos'].map((name, i) => ({
        id: name.toLowerCase(),
        name,
      }));

  return (
    <div className="landing">
      {/* Hero Section */}
      <section
        className={`landing__hero ${heroReveal.isVisible ? 'landing__hero--active' : ''}`}
        ref={heroReveal.ref}
        onClick={spawnParticle}
      >
        <div className="landing__hero-bg">
          <div className="landing__hero-pattern"></div>
          <div className="landing__hero-grid-overlay"></div>
          <div className="landing__floating-item landing__floating-item--1">🌮</div>
          <div className="landing__floating-item landing__floating-item--2">🌯</div>
          <div className="landing__floating-item landing__floating-item--3">🌶️</div>
          <div className="landing__floating-item landing__floating-item--4">🧀</div>
          <div className="landing__floating-item landing__floating-item--5">⭐</div>
          <div className="landing__floating-item landing__floating-item--6">🎮</div>
        </div>

        {/* Click particles */}
        {particles.map((p) => (
          <span
            key={p.id}
            className="landing__particle"
            style={{ left: p.x, top: p.y }}
          >
            {p.emoji}
          </span>
        ))}

        <div className="landing__hero-content">
          <div className="landing__hero-badge">
            <span className="landing__hero-badge-dot"></span>
            NEW GAME!
          </div>
          <h1 className="landing__hero-title">
            <span className="landing__hero-title-line">Welcome to</span>
            <span className="landing__hero-title-main">
              <span className="landing__hero-taco glitch-text" data-text="Taco">Taco</span>
              <span className="landing__hero-mex glitch-text" data-text="Mex">Mex</span>
            </span>
            <span className="landing__hero-title-sub">8-BIT SHOP</span>
          </h1>
          <p className="landing__hero-description">
            {typewriter.displayText}
            {!typewriter.isComplete && <span className="typewriter-cursor"></span>}
            {typewriter.isComplete && (
              <>
                <br />
                Press START to begin your delicious adventure.
              </>
            )}
          </p>
          <div className="landing__hero-actions">
            <PixelButton
              variant="accent"
              size="lg"
              onClick={() => navigate('/menu')}
              className="landing__hero-cta"
            >
              Start Order
              <ChevronRight size={20} />
            </PixelButton>
            <PixelButton
              variant="ghost"
              size="lg"
              onClick={() => navigate('/menu')}
            >
              View Menu
            </PixelButton>
          </div>
          <div className="landing__hero-stats">
            <div className="landing__hero-stat">
              <span className="landing__hero-stat-icon">🌮</span>
              <span className="landing__hero-stat-value">50+</span>
              <span className="landing__hero-stat-label">Menu Items</span>
            </div>
            <div className="landing__hero-stat">
              <span className="landing__hero-stat-icon">⭐</span>
              <span className="landing__hero-stat-value">4.9</span>
              <span className="landing__hero-stat-label">Rating</span>
            </div>
            <div className="landing__hero-stat">
              <span className="landing__hero-stat-icon">🚀</span>
              <span className="landing__hero-stat-value">30m</span>
              <span className="landing__hero-stat-label">Delivery</span>
            </div>
          </div>
        </div>

        <div className="landing__hero-decoration">
          <div className="landing__pixel-taco">
            <div className="landing__pixel-taco-inner">
              <span className="landing__giant-emoji">🌮</span>
            </div>
            <div className="landing__pixel-taco-shadow"></div>
          </div>
        </div>
      </section>

      {/* Promo Banner */}
      <section
        className={`landing__promo ${promoReveal.isVisible ? 'landing__promo--active' : ''}`}
        ref={promoReveal.ref}
      >
        <div className="landing__promo-container">
          <div className="landing__promo-icon">🎮</div>
          <div className="landing__promo-content">
            <p className="landing__promo-title">BONUS ROUND!</p>
            <p className="landing__promo-text">
              Use code <span className="landing__promo-code">TACO8BIT</span> for 20% off your first order!
            </p>
          </div>
          <div className="landing__promo-icon">🎮</div>
        </div>
        <div className="landing__promo-scanline"></div>
      </section>

      {/* Features */}
      <section
        className="landing__features"
        ref={featuresReveal.ref}
      >
        <div className="landing__features-container" ref={featureStagger.containerRef}>
          {[
            { icon: <Flame size={32} />, title: 'Fresh & Hot', text: 'Made to order with authentic recipes' },
            { icon: <Clock size={32} />, title: 'Fast Prep', text: 'Ready in 15 minutes or less' },
            { icon: <Truck size={32} />, title: 'Quick Delivery', text: 'Free delivery over $25' },
          ].map((feature, i) => (
            <div
              key={i}
              className={`landing__feature ${featureStagger.visibleItems.has(i) ? 'landing__feature--visible' : ''}`}
            >
              <div className="landing__feature-icon">
                {feature.icon}
              </div>
              <h3 className="landing__feature-title">{feature.title}</h3>
              <p className="landing__feature-text">{feature.text}</p>
              <div className="landing__feature-pixel-corners">
                <span></span><span></span><span></span><span></span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="landing__categories" ref={categoriesReveal.ref}>
        <div className="landing__categories-container">
          <div className={`landing__section-header reveal ${categoriesReveal.isVisible ? 'reveal--visible' : ''}`}>
            <h2 className="landing__section-title">Select Your Class</h2>
            <p className="landing__section-subtitle">Choose your food category</p>
          </div>
          <div className="landing__categories-grid" ref={categoryStagger.containerRef}>
            {displayCategories.map((category, i) => {
              const name = typeof category === 'object' && 'name' in category ? category.name : '';
              const id = typeof category === 'object' && 'id' in category ? category.id : '';
              return (
                <Link
                  key={id}
                  to={`/menu?category=${id}`}
                  className={`landing__category ${categoryStagger.visibleItems.has(i) ? 'landing__category--visible' : ''}`}
                >
                  <span className="landing__category-icon">
                    {categoryEmojis[name.toLowerCase()] || '🌮'}
                  </span>
                  <span className="landing__category-name">{name}</span>
                  <span className="landing__category-arrow">→</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="landing__featured" ref={featuredReveal.ref}>
        <div className="landing__featured-container">
          <div className={`landing__section-header reveal ${featuredReveal.isVisible ? 'reveal--visible' : ''}`}>
            <h2 className="landing__section-title">Featured Items</h2>
            <p className="landing__section-subtitle">Today's special power-ups!</p>
          </div>

          {productsLoading ? (
            <div className="landing__featured-loading">
              <LoadingSpinner size="lg" text="Loading specials..." />
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className={`landing__featured-grid ${featuredReveal.isVisible ? 'landing__featured-grid--visible' : ''}`}>
              {featuredProducts.slice(0, 4).map((product, i) => (
                <div key={product.id} className="landing__featured-item" style={{ transitionDelay: `${i * 100}ms` }}>
                  <ProductCard product={product} featured />
                </div>
              ))}
            </div>
          ) : (
            <div className="landing__featured-empty">
              <p>Check back soon for featured items!</p>
            </div>
          )}

          <div className="landing__featured-action">
            <PixelButton variant="primary" onClick={() => navigate('/menu')}>
              View Full Menu
              <ChevronRight size={16} />
            </PixelButton>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="landing__how-it-works" ref={stepsReveal.ref}>
        <div className="landing__how-container">
          <div className={`landing__section-header reveal ${stepsReveal.isVisible ? 'reveal--visible' : ''}`}>
            <h2 className="landing__section-title">How to Play</h2>
            <p className="landing__section-subtitle">Simple steps to deliciousness</p>
          </div>
          <div className="landing__steps" ref={stepStagger.containerRef}>
            {[
              { icon: '📱', title: 'Browse Menu', text: 'Explore our delicious Mexican food options' },
              { icon: '🛒', title: 'Add to Cart', text: 'Select your favorites and customize them' },
              { icon: '💳', title: 'Checkout', text: 'Enter delivery info and place your order' },
              { icon: '🌮', title: 'Enjoy!', text: 'Get your food delivered fresh and hot' },
            ].map((step, i) => (
              <React.Fragment key={i}>
                {i > 0 && <div className={`landing__step-arrow ${stepStagger.visibleItems.has(i) ? 'landing__step-arrow--visible' : ''}`}>→</div>}
                <div className={`landing__step ${stepStagger.visibleItems.has(i) ? 'landing__step--visible' : ''}`}>
                  <div className="landing__step-number">{i + 1}</div>
                  <div className="landing__step-icon">{step.icon}</div>
                  <h3 className="landing__step-title">{step.title}</h3>
                  <p className="landing__step-text">{step.text}</p>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className={`landing__cta ${ctaReveal.isVisible ? 'landing__cta--active' : ''}`}
        ref={ctaReveal.ref}
      >
        <div className="landing__cta-container">
          <div className="landing__cta-content">
            <h2 className="landing__cta-title">Ready to Level Up?</h2>
            <p className="landing__cta-text">
              Join thousands of satisfied customers and experience
              the best Mexican food in 8-bit style!
            </p>
            <PixelButton
              variant="accent"
              size="lg"
              onClick={() => navigate('/register')}
            >
              Create Account
            </PixelButton>
          </div>
          <div className="landing__cta-decoration">
            <div className="landing__cta-pixel-art">
              <span>🎮</span>
              <span>🌮</span>
              <span>⭐</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
