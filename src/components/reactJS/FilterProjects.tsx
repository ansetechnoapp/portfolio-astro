import React, { useState } from 'react';

type FilterType = 'all' | 'web' | 'mobile' | 'desktop';

interface FilterProjectsProps {
    onFilterChange?: (filter: FilterType) => void;
    initialFilter?: FilterType;
    className?: string;
}

export default function FilterProjects({
    onFilterChange,
    initialFilter = 'all',
    className = ''
}: FilterProjectsProps) {
    const [activeFilter, setActiveFilter] = useState<FilterType>(initialFilter);

    const handleFilterClick = (filter: FilterType) => {
        setActiveFilter(filter);
        const event = new CustomEvent('filterChange', {
            detail: filter,
            bubbles: true
        });
        document.getElementById('portfolio-section')?.dispatchEvent(event);
        onFilterChange?.(filter);
    };

    return (
        <div
            className={`flex flex-wrap items-center justify-center gap-4 mb-8 ${className}`.trim()}
            role="group" 
            aria-label="Project filters"
        >
            {(['all', 'web', 'mobile', 'desktop'] as const).map((filter) => (
                <button
                    key={filter}
                    onClick={() => handleFilterClick(filter)}
                    className={`
                        px-4 py-2 text-sm font-medium rounded-full transition-all duration-300
                        ${activeFilter === filter
                            ? 'bg-primary text-primary-foreground shadow-lg transform scale-105'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }
                    `}
                    aria-pressed={activeFilter === filter}
                    type="button"
                >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)} Projects
                </button>
            ))}
        </div>
    );
}
