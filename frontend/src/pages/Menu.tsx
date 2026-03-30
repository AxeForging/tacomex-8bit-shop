import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard, LoadingSpinner, SpiceMeter, PixelButton } from '@/components';
import { useProducts, useCategories } from '@/hooks';
import './Menu.css';

const ITEMS_PER_PAGE = 12;

const Menu: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedSpiceLevel, setSelectedSpiceLevel] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedSpiceLevel]);

  // Build API params - server-side search & filtering
  const apiParams = {
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(selectedCategory && { category: selectedCategory }),
    ...(selectedSpiceLevel !== null && { spiceLevel: selectedSpiceLevel }),
    page: currentPage,
    limit: ITEMS_PER_PAGE,
  };

  const { products, pagination, isLoading, error } = useProducts(apiParams);
  const { categories } = useCategories();

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const params: Record<string, string> = {};
    if (categoryId) params.category = categoryId;
    if (searchTerm) params.search = searchTerm;
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSelectedCategory('');
    setSelectedSpiceLevel(null);
    setCurrentPage(1);
    setSearchParams({});
  };

  const hasActiveFilters = searchTerm || selectedCategory || selectedSpiceLevel !== null;

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

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    const pages: (number | string)[] = [];
    const { page, totalPages } = pagination;

    // Build page numbers with ellipsis
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }

    return (
      <div className="menu__pagination">
        <button
          className="menu__pagination-btn menu__pagination-btn--nav"
          onClick={() => goToPage(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft size={16} />
          Prev
        </button>

        <div className="menu__pagination-pages">
          {pages.map((p, i) =>
            typeof p === 'string' ? (
              <span key={`ellipsis-${i}`} className="menu__pagination-ellipsis">...</span>
            ) : (
              <button
                key={p}
                className={`menu__pagination-btn ${p === page ? 'menu__pagination-btn--active' : ''}`}
                onClick={() => goToPage(p)}
              >
                {p}
              </button>
            )
          )}
        </div>

        <button
          className="menu__pagination-btn menu__pagination-btn--nav"
          onClick={() => goToPage(page + 1)}
          disabled={page >= totalPages}
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    );
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

          <button
            className="menu__filter-toggle"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            Filters
            {hasActiveFilters && <span className="menu__filter-badge">!</span>}
          </button>

          {hasActiveFilters && (
            <button className="menu__clear-filters" onClick={clearFilters}>
              <X size={14} />
              Clear All
            </button>
          )}
        </div>

        {/* Filters Panel */}
        <div className={`menu__filters ${showFilters ? 'menu__filters--open' : ''}`}>
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
                  className={`menu__category-btn ${selectedCategory === category.id || selectedCategory === category.name.toLowerCase() ? 'menu__category-btn--active' : ''}`}
                  onClick={() => handleCategoryChange(category.name.toLowerCase())}
                >
                  <span className="menu__category-emoji">
                    {categoryEmojis[category.name.toLowerCase()] || '🌮'}
                  </span>
                  {category.name}
                </button>
              ))}
            </div>
          </div>

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
            {pagination.total} item{pagination.total !== 1 ? 's' : ''} found
          </span>
          {hasActiveFilters && (
            <span className="menu__results-filtered">(filtered)</span>
          )}
          {pagination.totalPages > 1 && (
            <span className="menu__results-page">
              Page {pagination.page} of {pagination.totalPages}
            </span>
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
        ) : products.length === 0 ? (
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
          <>
            <div className="menu__grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {renderPagination()}
          </>
        )}
      </div>
    </div>
  );
};

export default Menu;
