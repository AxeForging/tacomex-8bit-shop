import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, X } from 'lucide-react';
import { ProductCard, LoadingSpinner, SpiceMeter, PixelButton } from '../components';
import { useProducts, useCategories } from '../hooks';
import './Menu.css';

const Menu: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedSpiceLevel, setSelectedSpiceLevel] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { products, isLoading, error } = useProducts();
  const { categories } = useCategories();

  // Filter products based on search, category, and spice level
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        searchTerm === '' ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === '' ||
        product.categoryId === selectedCategory ||
        product.category?.name.toLowerCase() === selectedCategory.toLowerCase();

      const matchesSpice =
        selectedSpiceLevel === null ||
        product.spiceLevel === selectedSpiceLevel;

      return matchesSearch && matchesCategory && matchesSpice;
    });
  }, [products, searchTerm, selectedCategory, selectedSpiceLevel]);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    if (categoryId) {
      setSearchParams({ category: categoryId });
    } else {
      setSearchParams({});
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedSpiceLevel(null);
    setSearchParams({});
  };

  const hasActiveFilters = searchTerm || selectedCategory || selectedSpiceLevel !== null;

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
    <div className="menu">
      {/* Header */}
      <div className="menu__header">
        <div className="menu__header-content">
          <h1 className="menu__title">
            <span className="menu__title-icon">🌮</span>
            Our Menu
          </h1>
          <p className="menu__subtitle">
            Select your power-ups! Fresh ingredients, authentic flavors.
          </p>
        </div>
      </div>

      <div className="menu__container">
        {/* Search and Filters Bar */}
        <div className="menu__controls">
          {/* Search */}
          <div className="menu__search">
            <Search size={18} className="menu__search-icon" />
            <input
              type="text"
              placeholder="Search menu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="menu__search-input"
            />
            {searchTerm && (
              <button
                className="menu__search-clear"
                onClick={() => setSearchTerm('')}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filter toggle (mobile) */}
          <button
            className="menu__filter-toggle"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            Filters
            {hasActiveFilters && <span className="menu__filter-badge">!</span>}
          </button>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button className="menu__clear-filters" onClick={clearFilters}>
              <X size={14} />
              Clear All
            </button>
          )}
        </div>

        {/* Filters Panel */}
        <div className={`menu__filters ${showFilters ? 'menu__filters--open' : ''}`}>
          {/* Category filters */}
          <div className="menu__filter-section">
            <h3 className="menu__filter-title">Category</h3>
            <div className="menu__category-filters">
              <button
                className={`menu__category-btn ${selectedCategory === '' ? 'menu__category-btn--active' : ''}`}
                onClick={() => handleCategoryChange('')}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={`menu__category-btn ${selectedCategory === category.id ? 'menu__category-btn--active' : ''}`}
                  onClick={() => handleCategoryChange(category.id)}
                >
                  <span className="menu__category-emoji">
                    {categoryEmojis[category.name.toLowerCase()] || '🌮'}
                  </span>
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Spice level filter */}
          <div className="menu__filter-section">
            <h3 className="menu__filter-title">Spice Level</h3>
            <div className="menu__spice-filters">
              <button
                className={`menu__spice-btn ${selectedSpiceLevel === null ? 'menu__spice-btn--active' : ''}`}
                onClick={() => setSelectedSpiceLevel(null)}
              >
                All
              </button>
              {[0, 1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  className={`menu__spice-btn ${selectedSpiceLevel === level ? 'menu__spice-btn--active' : ''}`}
                  onClick={() => setSelectedSpiceLevel(level)}
                >
                  <SpiceMeter level={level as 0 | 1 | 2 | 3 | 4 | 5} size="sm" />
                  <span className="menu__spice-label">
                    {level === 0 ? 'None' : level === 5 ? 'Max!' : `${level}`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results info */}
        <div className="menu__results-info">
          <span className="menu__results-count">
            {filteredProducts.length} item{filteredProducts.length !== 1 ? 's' : ''} found
          </span>
          {hasActiveFilters && (
            <span className="menu__results-filtered">(filtered)</span>
          )}
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="menu__loading">
            <LoadingSpinner size="lg" text="Loading menu..." />
          </div>
        ) : error ? (
          <div className="menu__error">
            <span className="menu__error-icon">⚠️</span>
            <p className="menu__error-text">{error}</p>
            <PixelButton variant="primary" onClick={() => window.location.reload()}>
              Retry
            </PixelButton>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="menu__empty">
            <span className="menu__empty-icon">🔍</span>
            <p className="menu__empty-text">No items found</p>
            <p className="menu__empty-subtext">
              Try adjusting your filters or search term
            </p>
            <PixelButton variant="secondary" onClick={clearFilters}>
              Clear Filters
            </PixelButton>
          </div>
        ) : (
          <div className="menu__grid">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Menu;
