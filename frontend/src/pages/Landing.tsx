import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Flame, Clock, Truck } from 'lucide-react';
import { PixelButton, ProductCard, LoadingSpinner } from '../components';
import { useFeaturedProducts, useCategories } from '../hooks';
import './Landing.css';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { products: featuredProducts, isLoading: productsLoading } = useFeaturedProducts();
  const { categories } = useCategories();

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

  return (
    <div className="landing">
      {/* Hero Section */}
      <section className="landing__hero">
        <div className="landing__hero-bg">
          {/* Pixel art background pattern */}
          <div className="landing__hero-pattern"></div>
          {/* Floating pixel tacos */}
          <div className="landing__floating-item landing__floating-item--1">🌮</div>
          <div className="landing__floating-item landing__floating-item--2">🌯</div>
          <div className="landing__floating-item landing__floating-item--3">🌶️</div>
          <div className="landing__floating-item landing__floating-item--4">🧀</div>
        </div>

        <div className="landing__hero-content">
          <div className="landing__hero-badge">NEW GAME!</div>
          <h1 className="landing__hero-title">
            <span className="landing__hero-title-line">Welcome to</span>
            <span className="landing__hero-title-main">
              <span className="landing__hero-taco">Taco</span>
              <span className="landing__hero-mex">Mex</span>
            </span>
            <span className="landing__hero-title-sub">8-BIT SHOP</span>
          </h1>
          <p className="landing__hero-description">
            Level up your hunger with authentic Mexican flavors!
            <br />
            Press START to begin your delicious adventure.
          </p>
          <div className="landing__hero-actions">
            <PixelButton
              variant="accent"
              size="lg"
              onClick={() => navigate('/menu')}
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

        {/* Pixel art taco decoration */}
        <div className="landing__hero-decoration">
          <div className="landing__pixel-taco">
            {/* Large pixel art taco */}
            <div className="landing__pixel-taco-inner">
              <span className="landing__giant-emoji">🌮</span>
            </div>
          </div>
        </div>
      </section>

      {/* Promo Banner */}
      <section className="landing__promo">
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
      </section>

      {/* Features */}
      <section className="landing__features">
        <div className="landing__features-container">
          <div className="landing__feature">
            <div className="landing__feature-icon">
              <Flame size={32} />
            </div>
            <h3 className="landing__feature-title">Fresh & Hot</h3>
            <p className="landing__feature-text">
              Made to order with authentic recipes
            </p>
          </div>
          <div className="landing__feature">
            <div className="landing__feature-icon">
              <Clock size={32} />
            </div>
            <h3 className="landing__feature-title">Fast Prep</h3>
            <p className="landing__feature-text">
              Ready in 15 minutes or less
            </p>
          </div>
          <div className="landing__feature">
            <div className="landing__feature-icon">
              <Truck size={32} />
            </div>
            <h3 className="landing__feature-title">Quick Delivery</h3>
            <p className="landing__feature-text">
              Free delivery over $25
            </p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="landing__categories">
        <div className="landing__categories-container">
          <div className="landing__section-header">
            <h2 className="landing__section-title">Select Your Class</h2>
            <p className="landing__section-subtitle">Choose your food category</p>
          </div>
          <div className="landing__categories-grid">
            {categories.length > 0 ? (
              categories.slice(0, 6).map((category) => (
                <Link
                  key={category.id}
                  to={`/menu?category=${category.id}`}
                  className="landing__category"
                >
                  <span className="landing__category-icon">
                    {categoryEmojis[category.name.toLowerCase()] || '🌮'}
                  </span>
                  <span className="landing__category-name">{category.name}</span>
                </Link>
              ))
            ) : (
              // Placeholder categories
              ['Tacos', 'Burritos', 'Quesadillas', 'Nachos', 'Drinks', 'Combos'].map((name) => (
                <Link
                  key={name}
                  to={`/menu?category=${name.toLowerCase()}`}
                  className="landing__category"
                >
                  <span className="landing__category-icon">
                    {categoryEmojis[name.toLowerCase()] || '🌮'}
                  </span>
                  <span className="landing__category-name">{name}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="landing__featured">
        <div className="landing__featured-container">
          <div className="landing__section-header">
            <h2 className="landing__section-title">Featured Items</h2>
            <p className="landing__section-subtitle">Today's special power-ups!</p>
          </div>

          {productsLoading ? (
            <div className="landing__featured-loading">
              <LoadingSpinner size="lg" text="Loading specials..." />
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="landing__featured-grid">
              {featuredProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} featured />
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
      <section className="landing__how-it-works">
        <div className="landing__how-container">
          <div className="landing__section-header">
            <h2 className="landing__section-title">How to Play</h2>
            <p className="landing__section-subtitle">Simple steps to deliciousness</p>
          </div>
          <div className="landing__steps">
            <div className="landing__step">
              <div className="landing__step-number">1</div>
              <div className="landing__step-icon">📱</div>
              <h3 className="landing__step-title">Browse Menu</h3>
              <p className="landing__step-text">
                Explore our delicious Mexican food options
              </p>
            </div>
            <div className="landing__step-arrow">→</div>
            <div className="landing__step">
              <div className="landing__step-number">2</div>
              <div className="landing__step-icon">🛒</div>
              <h3 className="landing__step-title">Add to Cart</h3>
              <p className="landing__step-text">
                Select your favorites and customize them
              </p>
            </div>
            <div className="landing__step-arrow">→</div>
            <div className="landing__step">
              <div className="landing__step-number">3</div>
              <div className="landing__step-icon">💳</div>
              <h3 className="landing__step-title">Checkout</h3>
              <p className="landing__step-text">
                Enter delivery info and place your order
              </p>
            </div>
            <div className="landing__step-arrow">→</div>
            <div className="landing__step">
              <div className="landing__step-number">4</div>
              <div className="landing__step-icon">🌮</div>
              <h3 className="landing__step-title">Enjoy!</h3>
              <p className="landing__step-text">
                Get your food delivered fresh and hot
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing__cta">
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
