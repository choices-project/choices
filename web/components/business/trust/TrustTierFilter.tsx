'use client';

import React from 'react';

type TrustTierFilterProps = {
  selectedTiers: number[];
  onTierChange: (tiers: number[]) => void;
}

export function TrustTierFilter({ selectedTiers, onTierChange }: TrustTierFilterProps) {
  const tiers = [
    { value: 1, label: 'Verified', color: 'green', icon: '✓' },
    { value: 2, label: 'Established', color: 'blue', icon: '★' },
    { value: 3, label: 'New Users', color: 'yellow', icon: '●' },
    { value: 0, label: 'Anonymous', color: 'gray', icon: '○' }
  ];

  const handleTierToggle = (tierValue: number) => {
    if (selectedTiers.includes(tierValue)) {
      // Remove tier
      onTierChange(selectedTiers.filter(t => t !== tierValue));
    } else {
      // Add tier
      onTierChange([...selectedTiers, tierValue]);
    }
  };

  const handleSelectAll = () => {
    if (selectedTiers.length === tiers.length) {
      // Deselect all
      onTierChange([]);
    } else {
      // Select all
      onTierChange(tiers.map(t => t.value));
    }
  };

  const isAllSelected = selectedTiers.length === tiers.length;
  const isNoneSelected = selectedTiers.length === 0;

  return (
    <div className="space-y-3">
      {/* Select All/None Button */}
      <div className="flex justify-between items-center">
        <button
          onClick={handleSelectAll}
          className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            isAllSelected
              ? 'bg-purple-500 text-white'
              : isNoneSelected
              ? 'bg-gray-500 text-white'
              : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
          }`}
        >
          <span>{isAllSelected ? '✓' : isNoneSelected ? '○' : '👥'}</span>
          <span>{isAllSelected ? 'All Selected' : isNoneSelected ? 'None Selected' : 'Select All'}</span>
        </button>
        
        {selectedTiers.length > 0 && (
          <span className="text-sm text-gray-600">
            {selectedTiers.length} tier{selectedTiers.length !== 1 ? 's' : ''} selected
          </span>
        )}
      </div>

      {/* Individual Tier Buttons */}
      <div className="flex flex-wrap gap-2">
        {tiers.map((tier) => {
          const isSelected = selectedTiers.includes(tier.value);
          return (
            <button
              key={tier.value}
              onClick={() => handleTierToggle(tier.value)}
              className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                isSelected
                  ? `bg-${tier.color}-500 text-white`
                  : `bg-${tier.color}-100 text-${tier.color}-800 hover:bg-${tier.color}-200`
              }`}
            >
              <span>{isSelected ? '✓' : tier.icon}</span>
              <span>{tier.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Summary */}
      {selectedTiers.length > 0 && (
        <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
          Showing results from: {selectedTiers.map(tier => {
            const tierInfo = tiers.find(t => t.value === tier);
            return tierInfo?.label;
          }).join(', ')}
        </div>
      )}
    </div>
  );
}


export default TrustTierFilter;
