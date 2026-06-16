import React from 'react';

export default function PriorityBadge({ priorite }) {
  const styles = {
    HAUTE: 'bg-red-100 text-red-700 border-red-200',
    MOYENNE: 'bg-orange-100 text-orange-700 border-orange-200',
    BASSE: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    AUCUNE: 'bg-green-100 text-green-700 border-green-200',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[priorite] || ''}`}>
      {priorite}
    </span>
  );
}