import React, { useEffect, useRef } from 'react';
import '../../styles/ProjectModal.css';

interface ProjectData {
  title: string;
  description: string;
  tech: string[];
  publishDate: Date;
  tags: string[];
  img: string;
  img_alt?: string;
  github?: string;
  liveDemo?: string;
  device?: string | undefined;
  isBeta?: boolean;
  additionalImages?: Array<{
    url: string;
    alt?: string;
  }>;
}

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectData: ProjectData;
  slug: string;
}

const ProjectModal: React.FC<ProjectModalProps> = ({ 
  isOpen, 
  onClose, 
  projectData,
  slug 
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      // Focus management for accessibility
      modalRef.current?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (event: React.MouseEvent) => {
    // Only close if clicking directly on the backdrop, not on modal content
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleModalContentClick = (event: React.MouseEvent) => {
    // Prevent event bubbling to backdrop
    event.stopPropagation();
  };

  if (!isOpen) return null;
  const isBetaProject = Boolean(
    projectData.isBeta || projectData.tags.some((tag) => /beta/i.test(tag)),
  );

  // Format the device type for display
  const formatDeviceType = (device?: string) => {
    if (!device) return 'PROJECT';
    return device.toUpperCase();
  };

  // Get theme colors based on device type
  const getThemeColors = (device?: string) => {
    switch (device?.toLowerCase()) {
      case 'web':
        return {
          primary: 'var(--accent-secondary, #33a6a0)',
          light: 'var(--accent-secondary-light, #4ecdc4)',
          gradient: 'linear-gradient(135deg, var(--accent-secondary, #33a6a0), var(--accent-secondary-light, #4ecdc4))'
        };
      case 'mobile':
        return {
          primary: 'var(--accent-tertiary, #ff9800)',
          light: 'var(--accent-tertiary-light, #ffb74d)',
          gradient: 'linear-gradient(135deg, var(--accent-tertiary, #ff9800), var(--accent-tertiary-light, #ffb74d))'
        };
      default:
        return {
          primary: 'var(--accent-regular, #7611a6)',
          light: 'var(--accent-light, #9d4eff)',
          gradient: 'linear-gradient(135deg, var(--accent-regular, #7611a6), var(--accent-light, #9d4eff))'
        };
    }
  };

  const themeColors = getThemeColors(projectData.device);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 project-modal-backdrop animate-backdrop-enter"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      style={{
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        onClick={handleModalContentClick}
        className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden animate-modal-enter project-modal-container project-modal-shadow"
        style={{
          background: 'var(--gray-900, #0f172a)',
          borderRadius: '1.5rem',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 p-2 rounded-full transition-colors duration-200 project-modal-close"
          style={{
            color: 'var(--gray-400, #9ca3af)',
            background: 'rgba(0, 0, 0, 0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--gray-200, #e5e7eb)';
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--gray-400, #9ca3af)';
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)';
          }}
          aria-label="Close modal"
        >
          <svg 
            className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M6 18L18 6M6 6l12 12" 
            />
          </svg>
        </button>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 h-full min-h-[600px] project-modal-grid">
          {/* Left Column: Project Image */}
          <div className="relative overflow-hidden lg:rounded-l-3xl project-modal-image">
            <div
              className="absolute inset-0 bg-gradient-to-br opacity-20 project-image-overlay"
              style={{
                background: themeColors.gradient,
              }}
            />
            <img
              src={projectData.img}
              alt={projectData.img_alt || projectData.title}
              className="w-full h-full object-cover"
              style={{ minHeight: '600px' }}
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent project-image-overlay"
            />
          </div>

          {/* Right Column: Project Details */}
          <div className="flex flex-col justify-start p-8 lg:p-12 space-y-6 project-modal-content overflow-y-auto">
            {/* Category Tag */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="text-sm font-medium uppercase tracking-wider px-3 py-1 rounded-full"
                style={{
                  color: themeColors.light,
                  background: `${themeColors.primary}20`,
                  border: `1px solid ${themeColors.primary}40`,
                }}
              >
                {formatDeviceType(projectData.device)}
              </span>
              {isBetaProject && (
                <span
                  className="text-xs font-semibold uppercase tracking-[0.2em] px-3 py-1 rounded-full"
                  style={{
                    color: '#fbbf24',
                    background: 'rgba(251, 191, 36, 0.12)',
                    border: '1px solid rgba(251, 191, 36, 0.28)',
                  }}
                >
                  Beta
                </span>
              )}
              <span 
                className="text-xs px-2 py-1 rounded"
                style={{
                  color: 'var(--gray-400, #9ca3af)',
                  background: 'rgba(156, 163, 175, 0.1)',
                }}
              >
                Featured
              </span>
            </div>

            {/* Project Title */}
            <h2
              id="modal-title"
              className="text-4xl lg:text-5xl font-bold leading-tight project-modal-title gradient-text"
            >
              {projectData.title}
            </h2>

            {/* Project Description */}
            <p 
              className="text-lg leading-relaxed"
              style={{ color: 'var(--gray-300, #d1d5db)' }}
            >
              {projectData.description}
            </p>

            {/* Technology Stack */}
            {projectData.tech && projectData.tech.length > 0 && (
              <div className="space-y-3">
                <h3 
                  className="text-sm font-medium uppercase tracking-wider"
                  style={{ color: 'var(--gray-400, #9ca3af)' }}
                >
                  Technologies Used
                </h3>
                <div className="flex flex-wrap gap-2">
                  {projectData.tech.map((tech, index) => (
                    <span
                      key={index}
                      className="text-sm px-3 py-1 rounded-full tech-tag"
                      style={{
                        color: 'var(--gray-200, #e5e7eb)',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                      }}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 project-modal-buttons">
              {projectData.liveDemo && (
                <a
                  href={projectData.liveDemo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-xl transition-all duration-300 transform hover:scale-105 project-modal-button"
                  style={{
                    background: themeColors.gradient,
                    color: 'white',
                    boxShadow: `0 10px 25px ${themeColors.primary}50`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = `0 20px 40px ${themeColors.primary}70`;
                    e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = `0 10px 25px ${themeColors.primary}50`;
                    e.currentTarget.style.transform = 'scale(1) translateY(0)';
                  }}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View Project
                </a>
              )}
              
              {projectData.github && (
                <a
                  href={projectData.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-xl transition-all duration-300 project-modal-button"
                  style={{
                    color: 'var(--gray-200, #e5e7eb)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(20, 184, 166, 0.15)';
                    e.currentTarget.style.borderColor = 'rgba(20, 184, 166, 0.4)';
                    e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(20, 184, 166, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.transform = 'scale(1) translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  Source Code
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;
