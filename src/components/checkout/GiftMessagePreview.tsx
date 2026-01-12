'use client';

import React from 'react';
import Image from 'next/image';

interface GiftMessagePreviewProps {
  message: string;
  senderName: string;
}

export default function GiftMessagePreview({ message, senderName }: GiftMessagePreviewProps) {
  if (!message && !senderName) return null;

  return (
    <div className="mt-6 mb-4">
      {/* Certificate-style gift card preview (matches print template) */}
      <div className="relative mx-auto max-w-md">
        <div className="relative border-[3px] border-gray-900 bg-white p-2 rounded-sm shadow-xl">
          {/* Inner content */}
          <div className="relative border border-gray-900 p-4 flex flex-col min-h-[280px]">
            {/* Logo */}
            <div className="flex justify-center mb-3">
              <div className="relative h-7 w-auto">
                <Image 
                  src="/logo.webp" 
                  alt="Vadiler" 
                  width={100} 
                  height={28}
                  className="h-7 w-auto grayscale"
                  style={{ objectFit: 'contain' }}
                />
              </div>
            </div>
            
            <div className="h-1" />
            
            {/* Message content */}
            <div className="border-t border-gray-200 pt-[16px] mt-2 flex-1">
              <div 
                className="text-sm leading-relaxed text-gray-900 font-semibold whitespace-pre-wrap break-words line-clamp-6"
                style={{ 
                  fontFamily: "'TheMunday','Geraldine','Roboto','Montserrat', sans-serif",
                  letterSpacing: '0.3px',
                  minHeight: '80px',
                  maxHeight: '150px',
                  overflow: 'hidden'
                }}
              >
                {message || 'Mesajınız burada görünecek...'}
              </div>
            </div>
            
            {/* Sender name */}
            {senderName && (
              <div className="flex justify-end mt-3">
                <div 
                  className="text-sm font-bold italic text-gray-900"
                  style={{ letterSpacing: '0.3px' }}
                >
                  — {senderName}
                </div>
              </div>
            )}
            
            {/* Footer */}
            <div className="text-center mt-4">
              <div 
                className="text-[10px] text-gray-900 font-medium"
                style={{ fontFamily: "'Montserrat', 'Inter', system-ui, sans-serif" }}
              >
                Mutlu anlar için vadiler.com
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <p className="text-[10px] text-gray-400 text-center mt-2">
        Bu kart ürünle birlikte gönderilecektir
      </p>
    </div>
  );
}
