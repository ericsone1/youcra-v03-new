import React from 'react';
import { motion } from 'framer-motion';

const CategoryTabs = ({ categories, selectedCategory, onCategoryChange }) => {
  const getCategoryStyle = (category, isSelected) => {
    const baseClasses = "flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm whitespace-nowrap transition-all duration-300 min-w-fit flex-shrink-0";
    
    if (isSelected) {
      const colorStyles = {
        blue: 'bg-blue-500 text-white shadow-lg',
        green: 'bg-green-500 text-white shadow-lg', 
        purple: 'bg-purple-500 text-white shadow-lg',
        orange: 'bg-orange-500 text-white shadow-lg',
        red: 'bg-red-500 text-white shadow-lg'
      };
      return `${baseClasses} ${colorStyles[category.color] || 'bg-blue-500 text-white shadow-lg'}`;
    }
    return `${baseClasses} bg-gray-100 text-gray-600 hover:bg-gray-200`;
  };

  return (
    <div className="mb-6">
      <div className="bg-white rounded-2xl shadow-lg p-4">
        <div className="w-full overflow-hidden">
          <div 
            className="flex gap-2 pb-2 overflow-x-auto pr-5"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {categories.map((category) => (
              <motion.button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={getCategoryStyle(category, selectedCategory === category.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-lg">{category.icon}</span>
                <span>{category.name}</span>
              </motion.button>
            ))}
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">
              {categories.find(cat => cat.id === selectedCategory)?.icon}
            </span>
            <div>
              <h3 className="font-bold text-gray-800">
                {categories.find(cat => cat.id === selectedCategory)?.name}
              </h3>
              <p className="text-sm text-gray-600">
                {categories.find(cat => cat.id === selectedCategory)?.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryTabs;
