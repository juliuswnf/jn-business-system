import { useState, useEffect } from 'react';
import { X, Heart, Eye, Filter, ChevronLeft, ChevronRight, Star, Upload } from 'lucide-react';
import api from '../../utils/api';
import { captureError } from '../../utils/errorTracking';

const CATEGORIES = [
  'All',
  'Traditional',
  'Realism',
  'Watercolor',
  'Tribal',
  'Japanese',
  'Geometric',
  'Blackwork',
  'Minimalist',
  'Portrait',
  'Custom'
];

export default function PortfolioGallery({ salonId, artistId, isArtistView = false }) {
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [lightboxImage, setLightboxImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    fetchPortfolio();
  }, [salonId, artistId]);

  useEffect(() => {
    filterItems();
  }, [selectedCategory, portfolioItems]);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const endpoint = artistId 
        ? `/api/portfolio/artist/${artistId}`
        : `/api/portfolio/salon/${salonId}`;
      
      const response = await api.get(endpoint);
      setPortfolioItems(response.data.portfolio || []);
    } catch (error) {
      captureError(error, { context: 'fetchPortfolio' });
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    if (selectedCategory === 'All') {
      setFilteredItems(portfolioItems);
    } else {
      setFilteredItems(
        portfolioItems.filter(item => item.category === selectedCategory.toLowerCase())
      );
    }
  };

  const handleLike = async (itemId) => {
    try {
      await api.post(`/api/portfolio/${itemId}/like`);
      // Update local state
      setPortfolioItems(prev => 
        prev.map(item => 
          item._id === itemId 
            ? { ...item, likes: item.likes + 1 }
            : item
        )
      );
    } catch (error) {
      captureError(error, { context: 'likePortfolioItem' });
    }
  };

  const incrementView = async (itemId) => {
    try {
      await api.post(`/api/portfolio/${itemId}/view`);
    } catch (error) {
      captureError(error, { context: 'incrementPortfolioView' });
    }
  };

  const openLightbox = (item) => {
    setLightboxImage(item);
    incrementView(item._id);
  };

  const closeLightbox = () => {
    setLightboxImage(null);
  };

  const navigateLightbox = (direction) => {
    const currentIndex = filteredItems.findIndex(item => item._id === lightboxImage._id);
    let newIndex;

    if (direction === 'next') {
      newIndex = (currentIndex + 1) % filteredItems.length;
    } else {
      newIndex = (currentIndex - 1 + filteredItems.length) % filteredItems.length;
    }

    setLightboxImage(filteredItems[newIndex]);
    incrementView(filteredItems[newIndex]._id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Portfolio Gallery
          </h1>
          <p className="text-gray-600">
            {filteredItems.length} {filteredItems.length === 1 ? 'piece' : 'pieces'} of art
          </p>
        </div>

        {isArtistView && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-500 text-zinc-900 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Upload className="w-5 h-5" />
            <span>Upload New Work</span>
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="mb-8 flex items-center space-x-4 overflow-x-auto pb-4">
        <Filter className="w-5 h-5 text-zinc-400 flex-shrink-0" />
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`
              px-4 py-2 rounded-full whitespace-nowrap transition-all
              ${selectedCategory === category
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Portfolio Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-zinc-500 mb-4">
            <svg className="w-24 h-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No portfolio items yet</h3>
          <p className="text-zinc-400">
            {selectedCategory !== 'All' 
              ? `No ${selectedCategory} pieces available`
              : 'Start building your portfolio by uploading your work'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <PortfolioCard
              key={item._id}
              item={item}
              onOpen={openLightbox}
              onLike={handleLike}
            />
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <Lightbox
          item={lightboxImage}
          onClose={closeLightbox}
          onNavigate={navigateLightbox}
          onLike={handleLike}
        />
      )}
    </div>
  );
}

// Portfolio Card Component
function PortfolioCard({ item, onOpen, onLike }) {
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = (e) => {
    e.stopPropagation();
    if (!isLiked) {
      onLike(item._id);
      setIsLiked(true);
    }
  };

  return (
    <div
      onClick={() => onOpen(item)}
      className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-none transition-all duration-300 cursor-pointer"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={item.imageUrl}
          alt={item.title}
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
        />

        {/* Overlay on Hover */}
        <div className="absolute inset-0 bg-white bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white text-center">
            <p className="text-lg font-semibold mb-2">{item.title}</p>
            <p className="text-sm text-zinc-700">{item.category}</p>
          </div>
        </div>

        {/* Featured Badge */}
        {item.isFeatured && (
          <div className="absolute top-3 left-3">
            <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
              <Star className="w-3 h-3 fill-current" />
              <span>Featured</span>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 truncate">{item.title}</h3>
        
        {item.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-zinc-400">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 transition-colors ${
                isLiked ? 'text-red-500' : 'hover:text-red-500'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{item.likes || 0}</span>
            </button>
            
            <div className="flex items-center space-x-1">
              <Eye className="w-4 h-4" />
              <span>{item.views || 0}</span>
            </div>
          </div>

          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.tags.slice(0, 2).map((tag, idx) => (
                <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Lightbox Component
function Lightbox({ item, onClose, onNavigate, onLike }) {
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = () => {
    if (!isLiked) {
      onLike(item._id);
      setIsLiked(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white bg-opacity-95 flex items-center justify-center">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-zinc-600 transition-colors z-10"
      >
        <X className="w-8 h-8" />
      </button>

      {/* Navigation Buttons */}
      <button
        onClick={() => onNavigate('prev')}
        className="absolute left-4 text-white hover:text-zinc-600 transition-colors z-10"
      >
        <ChevronLeft className="w-12 h-12" />
      </button>

      <button
        onClick={() => onNavigate('next')}
        className="absolute right-4 text-white hover:text-zinc-600 transition-colors z-10"
      >
        <ChevronRight className="w-12 h-12" />
      </button>

      {/* Content */}
      <div className="max-w-6xl max-h-[90vh] mx-4 flex flex-col lg:flex-row gap-6">
        {/* Image */}
        <div className="flex-1 flex items-center justify-center">
          <img
            src={item.imageUrl}
            alt={item.title}
            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-none"
          />
        </div>

        {/* Details */}
        <div className="lg:w-96 bg-white rounded-lg p-6 overflow-y-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{item.title}</h2>

          {item.description && (
            <p className="text-gray-600 mb-6">{item.description}</p>
          )}

          {/* Artist Info */}
          {item.artistId && (
            <div className="mb-6 pb-6 border-b">
              <p className="text-sm text-zinc-400 mb-1">Artist</p>
              <p className="font-semibold text-gray-900">{item.artistId.name || 'Unknown Artist'}</p>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center space-x-6 mb-6">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 transition-colors ${
                isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
              }`}
            >
              <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
              <span className="font-semibold">{item.likes || 0}</span>
            </button>

            <div className="flex items-center space-x-2 text-gray-600">
              <Eye className="w-6 h-6" />
              <span className="font-semibold">{item.views || 0}</span>
            </div>
          </div>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="mb-6">
              <p className="text-sm text-zinc-400 mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag, idx) => (
                  <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Category */}
          <div className="mb-6">
            <p className="text-sm text-zinc-400 mb-2">Category</p>
            <span className="inline-block bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-medium">
              {item.category}
            </span>
          </div>

          {/* Consent Status */}
          {item.customerConsent && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-green-700">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Customer consent obtained</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
