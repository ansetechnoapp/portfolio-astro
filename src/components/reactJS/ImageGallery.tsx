import React, { useState } from 'react';
import Modal from './Modal';

interface GalleryImage {
  url: string;
  alt: string;
  caption?: string;
  fallbackUrl?: string;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  className?: string;
  class?: string;
  columns?: 2 | 3 | 4;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  className = '',
  class: classFromAstro = '',
  columns = 3
}) => {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const openLightbox = (image: GalleryImage, index: number) => {
    setSelectedImage(image);
    setSelectedIndex(index);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' 
      ? (selectedIndex - 1 + images.length) % images.length
      : (selectedIndex + 1) % images.length;
    
    setSelectedIndex(newIndex);
    setSelectedImage(images[newIndex]);
  };

  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };

  const finalClassName = `image-gallery ${className} ${classFromAstro}`.trim();

  const handleImageError = (
    event: React.SyntheticEvent<HTMLImageElement>,
    fallbackUrl?: string,
  ) => {
    const resolvedFallback = fallbackUrl?.trim();
    if (!resolvedFallback || event.currentTarget.src === resolvedFallback) {
      event.currentTarget.onerror = null;
      return;
    }

    event.currentTarget.onerror = null;
    event.currentTarget.src = resolvedFallback;
  };

  return (
    <>
      <div className={finalClassName}>
        <div className={`grid ${gridCols[columns]} gap-4`}>
          {images.map((image, index) => (
            <div
              key={index}
              className="
                gallery-item group cursor-pointer rounded-lg overflow-hidden 
                bg-gray-100 dark:bg-gray-800 aspect-video relative
                hover:shadow-xl transition-all duration-300
              "
              onClick={() => openLightbox(image, index)}
            >
              <img
                src={image.url}
                alt={image.alt}
                className="
                  w-full h-full object-cover transition-transform duration-300 
                  group-hover:scale-105
                "
                loading="lazy"
                decoding="async"
                onError={(event) => handleImageError(event, image.fallbackUrl)}
              />
              
              {/* Overlay */}
              <div className="
                absolute inset-0 bg-black/0 group-hover:bg-black/20 
                transition-colors duration-300 flex items-center justify-center
              ">
                <div className="
                  opacity-0 group-hover:opacity-100 transition-opacity duration-300
                  bg-white/90 dark:bg-gray-800/90 rounded-full p-3
                ">
                  <svg 
                    className="w-6 h-6 text-gray-800 dark:text-white" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" 
                    />
                  </svg>
                </div>
              </div>

              {/* Caption overlay */}
              {image.caption && (
                <div className="
                  absolute bottom-0 left-0 right-0 bg-gradient-to-t 
                  from-black/70 to-transparent p-4 opacity-0 
                  group-hover:opacity-100 transition-opacity duration-300
                ">
                  <p className="text-white text-sm font-medium">
                    {image.caption}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      <Modal
        isOpen={!!selectedImage}
        onClose={closeLightbox}
        title={selectedImage?.alt || 'Image'}
        size="xl"
      >
        {selectedImage && (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={selectedImage.url}
                alt={selectedImage.alt}
                className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                loading="lazy"
                decoding="async"
                onError={(event) => handleImageError(event, selectedImage.fallbackUrl)}
              />
              
              {/* Navigation buttons */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => navigateImage('prev')}
                    className="
                      absolute left-4 top-1/2 -translate-y-1/2 
                      bg-black/50 hover:bg-black/70 text-white 
                      rounded-full p-2 transition-colors
                    "
                    aria-label="Previous image"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={() => navigateImage('next')}
                    className="
                      absolute right-4 top-1/2 -translate-y-1/2 
                      bg-black/50 hover:bg-black/70 text-white 
                      rounded-full p-2 transition-colors
                    "
                    aria-label="Next image"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>
            
            {selectedImage.caption && (
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-300 italic">
                  {selectedImage.caption}
                </p>
              </div>
            )}
            
            {/* Image counter */}
            {images.length > 1 && (
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                {selectedIndex + 1} of {images.length}
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default ImageGallery;
