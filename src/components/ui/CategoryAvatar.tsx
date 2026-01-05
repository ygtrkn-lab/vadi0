'use client';

import Image from 'next/image';
import type { LucideIcon } from 'lucide-react';
import React from 'react';

interface CategoryAvatarProps {
  name: string;
  image?: string;
  size?: number;
  className?: string;
  icon?: LucideIcon;
}

const pastelGradients = [
  'from-primary-100 via-secondary-50 to-white',
  'from-secondary-100 via-primary-50 to-white',
  'from-primary-50 via-white to-secondary-50',
];

function pickGradient(name: string) {
  const hash = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return pastelGradients[hash % pastelGradients.length];
}

export default function CategoryAvatar({
  name,
  image,
  size = 36,
  className = '',
  icon: Icon,
}: CategoryAvatarProps) {
  const gradient = pickGradient(name);
  const letter = name?.trim()?.[0]?.toUpperCase() || 'C';
  const dimension = `${size}px`;

  return (
    <div
      className={`relative rounded-full overflow-hidden bg-white shadow-soft ring-1 ring-black/5 flex items-center justify-center transition-transform duration-200 group-hover:scale-105 ${className}`}
      style={{ width: dimension, height: dimension, minWidth: dimension, minHeight: dimension }}
    >
      {image ? (
        <Image
          src={image}
          alt={name}
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${gradient}`}
        >
          {Icon ? (
            <Icon size={Math.max(16, Math.min(22, size - 14))} className="text-primary-600" />
          ) : (
            <span className="text-sm font-semibold text-primary-700">{letter}</span>
          )}
        </div>
      )}
      <div className="absolute inset-0 rounded-full ring-1 ring-white/70 pointer-events-none" />
    </div>
  );
}
