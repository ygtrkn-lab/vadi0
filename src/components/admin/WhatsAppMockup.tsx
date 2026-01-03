'use client';

import React, { forwardRef } from 'react';
import { Check } from 'lucide-react';

export interface Message {
  id: string;
  type: 'text' | 'file';
  content: string;
  timestamp: string;
  isSent: boolean;
  isRead?: boolean;
  file?: {
    name: string;
    size: string;
    format: string;
  };
}

interface WhatsAppMockupProps {
  contactName: string;
  contactSubtitle?: string;
  messages: Message[];
  dateLabel?: string;
}

const WhatsAppMockup = forwardRef<HTMLDivElement, WhatsAppMockupProps>(
  ({ contactName, contactSubtitle = 'tap here for contact info', messages, dateLabel = 'Fri, Jul 26' }, ref) => {
    return (
      <div
        ref={ref}
        className="relative overflow-hidden"
        style={{
          width: '375px',
          height: '812px',
          background: '#EFEFF4',
          fontFamily: "'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        {/* Status Bar */}
        <div
          className="absolute left-0 right-0 flex items-center justify-between px-4"
          style={{ top: 0, height: '44px' }}
        >
          {/* Time */}
          <div
            style={{
              fontSize: '15px',
              fontWeight: 600,
              lineHeight: '18px',
              letterSpacing: '-0.3px',
              color: '#171717',
            }}
          >
            9:41
          </div>

          {/* Signal, Wifi, Battery Icons */}
          <div className="flex items-center gap-1.5">
            {/* Mobile Signal */}
            <svg width="17" height="11" viewBox="0 0 17 11" fill="none">
              <rect x="0" y="6" width="3" height="5" rx="0.5" fill="#060606" />
              <rect x="4.5" y="4" width="3" height="7" rx="0.5" fill="#060606" />
              <rect x="9" y="2" width="3" height="9" rx="0.5" fill="#060606" />
              <rect x="13.5" y="0" width="3" height="11" rx="0.5" fill="#060606" />
            </svg>

            {/* Wifi */}
            <svg width="15" height="11" viewBox="0 0 15 11" fill="none">
              <path
                d="M7.5 11C6.67 11 6 10.33 6 9.5C6 8.67 6.67 8 7.5 8C8.33 8 9 8.67 9 9.5C9 10.33 8.33 11 7.5 11ZM7.5 6C5.57 6 3.86 6.82 2.69 8.13L1.28 6.72C2.85 5.15 5.04 4.25 7.5 4.25C9.96 4.25 12.15 5.15 13.72 6.72L12.31 8.13C11.14 6.82 9.43 6 7.5 6ZM7.5 1.5C4.19 1.5 1.23 2.84 0 5L1.41 6.41C2.39 4.72 4.78 3.5 7.5 3.5C10.22 3.5 12.61 4.72 13.59 6.41L15 5C13.77 2.84 10.81 1.5 7.5 1.5Z"
                fill="#060606"
              />
            </svg>

            {/* Battery */}
            <svg width="25" height="11" viewBox="0 0 25 11" fill="none">
              <rect x="0" y="0" width="22" height="10.5" rx="2.5" stroke="#ABABAB" strokeWidth="0.5" fill="none" />
              <rect x="1" y="1" width="20" height="8.5" rx="2" fill="#060606" />
              <path d="M23.5 3.5 L23.5 7.5 Q24.5 7 24.5 5.5 Q24.5 4 23.5 3.5" fill="#ABABAB" />
            </svg>
          </div>
        </div>

        {/* Contact Header */}
        <div
          className="absolute left-0 right-0 flex items-center justify-between px-4"
          style={{
            top: '44px',
            height: '44px',
            background: '#F6F6F6',
            borderBottom: '1px solid #000000',
            boxShadow: '0px 0.33px 0px #A6A6AA',
          }}
        >
          {/* Back Button */}
          <button className="flex items-center justify-center w-8 h-8 -ml-2">
            <svg width="12" height="21" viewBox="0 0 12 21" fill="none">
              <path d="M10 19L2 10.5L10 2" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {/* Profile & Name */}
          <div className="flex-1 flex items-center gap-2.5 ml-2">
            <div
              className="rounded-full overflow-hidden"
              style={{ width: '36px', height: '36px', background: '#DDD' }}
            >
              {/* Profile placeholder */}
              <div className="w-full h-full flex items-center justify-center text-white text-sm font-semibold">
                {contactName.charAt(0)}
              </div>
            </div>
            <div className="flex-1">
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  lineHeight: '19px',
                  letterSpacing: '-0.3px',
                  color: '#000000',
                }}
              >
                {contactName}
              </div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 400,
                  lineHeight: '16px',
                  letterSpacing: '-0.01px',
                  color: '#8E8E93',
                }}
              >
                {contactSubtitle}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-6">
            {/* Video Call */}
            <button>
              <svg width="25" height="16" viewBox="0 0 25 16" fill="none">
                <path
                  d="M15 2H3C1.9 2 1 2.9 1 4V12C1 13.1 1.9 14 3 14H15C16.1 14 17 13.1 17 12V4C17 2.9 16.1 2 15 2Z"
                  stroke="#007AFF"
                  strokeWidth="1.5"
                  fill="none"
                />
                <path d="M17 5.5L22 2.5V13.5L17 10.5V5.5Z" fill="#007AFF" />
              </svg>
            </button>

            {/* Call */}
            <button>
              <svg width="21" height="21" viewBox="0 0 21 21" fill="none">
                <path
                  d="M19.5 15.5V18.5C19.5 19.6 18.6 20.5 17.5 20.5C8.66 20.5 1.5 13.34 1.5 4.5C1.5 3.4 2.4 2.5 3.5 2.5H6.5C7.6 2.5 8.5 3.4 8.5 4.5C8.5 6.1 8.9 7.6 9.6 8.9L7.9 10.6C9.3 13.4 11.6 15.7 14.4 17.1L16.1 15.4C17.4 16.1 18.9 16.5 20.5 16.5C20.5 16.5 19.5 15.5 19.5 15.5Z"
                  fill="#007AFF"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Message Area */}
        <div
          className="absolute left-0 right-0 overflow-y-auto"
          style={{
            top: '88px',
            height: '644px',
            backgroundImage: 'url(/whatsapp-bg-pattern.svg)',
            backgroundSize: '100px 100px',
            backgroundRepeat: 'repeat',
          }}
        >
          <div className="p-2">
            {/* Date Separator */}
            {dateLabel && (
              <div className="flex justify-center my-3">
                <div
                  style={{
                    background: '#DDDDE9',
                    boxShadow: '0px 0.4px 0px rgba(98, 98, 98, 0.2), 0px -0.4px 0px #EEEEF4',
                    borderRadius: '8px',
                    padding: '3.5px 16px',
                    fontSize: '12px',
                    fontWeight: 600,
                    lineHeight: '14px',
                    color: '#3C3C43',
                  }}
                >
                  {dateLabel}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>
        </div>

        {/* Send Message Bar */}
        <div
          className="absolute left-0 right-0 flex items-center px-3 gap-2"
          style={{
            top: '732px',
            height: '48px',
            background: '#F6F6F6',
            boxShadow: '0px -0.33px 0px #A6A6AA',
          }}
        >
          {/* Add Button */}
          <button>
            <svg width="19" height="19" viewBox="0 0 19 19" fill="none">
              <circle cx="9.5" cy="9.5" r="9" stroke="#007AFF" strokeWidth="1.5" />
              <path d="M9.5 5V14M5 9.5H14" stroke="#007AFF" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          {/* Message Input */}
          <div
            className="flex-1 flex items-center px-3 gap-2"
            style={{
              height: '32px',
              background: '#FFFFFF',
              opacity: 0.45,
              border: '0.5px solid #8E8E93',
              borderRadius: '16px',
            }}
          >
            <span style={{ fontSize: '16px', color: '#8E8E93' }}>iMessage</span>
            <button>
              <svg width="18" height="19" viewBox="0 0 18 19" fill="none">
                <circle cx="9" cy="9.5" r="8.5" stroke="#007AFF" strokeWidth="1" fill="none" />
                <circle cx="6" cy="7.5" r="1.5" fill="#007AFF" />
                <circle cx="12" cy="7.5" r="1.5" fill="#007AFF" />
                <path d="M5 12C5.5 13 7 14 9 14C11 14 12.5 13 13 12" stroke="#007AFF" strokeWidth="1" />
              </svg>
            </button>
          </div>

          {/* Camera */}
          <button>
            <svg width="22" height="19" viewBox="0 0 22 19" fill="none">
              <rect x="1" y="4" width="20" height="14" rx="2" stroke="#007AFF" strokeWidth="1.5" fill="none" />
              <circle cx="11" cy="11" r="3.5" stroke="#007AFF" strokeWidth="1.5" fill="none" />
              <circle cx="17" cy="7" r="1" fill="#007AFF" />
            </svg>
          </button>

          {/* Mic */}
          <button>
            <svg width="16" height="24" viewBox="0 0 16 24" fill="none">
              <rect x="4" y="2" width="8" height="12" rx="4" stroke="#007AFF" strokeWidth="1.5" fill="none" />
              <path d="M1 11C1 15 4 18 8 18C12 18 15 15 15 11" stroke="#007AFF" strokeWidth="1.5" />
              <path d="M8 18V22M5 22H11" stroke="#007AFF" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Home Indicator */}
        <div
          className="absolute left-0 right-0 flex justify-center items-end"
          style={{ top: '778px', height: '34px' }}
        >
          <div
            style={{
              width: '134px',
              height: '5px',
              background: '#060606',
              borderRadius: '100px',
              marginBottom: '9px',
            }}
          />
        </div>
      </div>
    );
  }
);

WhatsAppMockup.displayName = 'WhatsAppMockup';

// Message Bubble Component
function MessageBubble({ message }: { message: Message }) {
  if (message.type === 'file') {
    return <FileMessage message={message} />;
  }

  const bubbleStyle = message.isSent
    ? {
        background: '#DCF7C5',
        marginLeft: 'auto',
        marginRight: '8px',
      }
    : {
        background: '#FAFAFA',
        marginLeft: '8px',
        marginRight: 'auto',
      };

  return (
    <div className="mb-2 flex" style={{ maxWidth: '80%', ...(message.isSent ? { marginLeft: 'auto' } : {}) }}>
      <div className="relative">
        {/* Shadow */}
        <div
          className="absolute inset-0"
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            filter: 'blur(0.815485px)',
            borderRadius: '8px',
            transform: 'translate(1px, 1px)',
          }}
        />

        {/* Bubble */}
        <div
          className="relative px-3 py-2"
          style={{
            ...bubbleStyle,
            borderRadius: '8px',
            minWidth: '60px',
          }}
        >
          <div
            style={{
              fontSize: '16px',
              fontWeight: 400,
              lineHeight: '19px',
              letterSpacing: '-0.3px',
              color: '#000000',
              marginBottom: '4px',
            }}
          >
            {message.content}
          </div>

          <div className="flex items-center justify-end gap-1">
            <span
              style={{
                fontSize: '11px',
                fontWeight: 400,
                lineHeight: '13px',
                letterSpacing: '0.5px',
                color: 'rgba(0, 0, 0, 0.25)',
              }}
            >
              {message.timestamp}
            </span>

            {message.isSent && message.isRead && (
              <div className="flex" style={{ width: '13.5px', height: '8px' }}>
                <Check size={12} strokeWidth={2} color="#3497F9" />
                <Check size={12} strokeWidth={2} color="#3497F9" style={{ marginLeft: '-6px' }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// File Message Component
function FileMessage({ message }: { message: Message }) {
  const file = message.file!;
  const containerStyle = message.isSent
    ? { marginLeft: 'auto', marginRight: '8px' }
    : { marginLeft: '8px', marginRight: 'auto' };

  return (
    <div className="mb-2 flex" style={{ maxWidth: '165px', ...containerStyle }}>
      <div className="relative w-full">
        {/* Shadow */}
        <div
          className="absolute inset-0"
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            filter: 'blur(0.815485px)',
            borderRadius: '8px',
            transform: 'translate(1px, 1px)',
          }}
        />

        {/* Bubble */}
        <div
          className="relative"
          style={{
            background: message.isSent ? '#DCF7C5' : '#FAFAFA',
            borderRadius: '8px',
            padding: '8px',
          }}
        >
          {/* File Container */}
          <div
            className="flex items-center gap-2 p-2 mb-2"
            style={{
              background: 'rgba(118, 118, 128, 0.12)',
              borderRadius: '6px',
            }}
          >
            {/* File Icon */}
            <div className="flex-shrink-0">
              <svg width="22" height="27" viewBox="0 0 22 27" fill="none">
                <rect x="1" y="1" width="14" height="22" rx="1.5" stroke="#D1D1D6" strokeWidth="0.4" fill="#FFFFFF" />
                <path d="M15 1L15 6L20 6L15 1Z" fill="#EFEFEF" stroke="#D1D1D6" strokeWidth="0.4" />
                <line x1="4" y1="10" x2="12" y2="10" stroke="#007AFF" strokeWidth="1" />
                <line x1="4" y1="13" x2="12" y2="13" stroke="#007AFF" strokeWidth="1" />
                <line x1="4" y1="16" x2="12" y2="16" stroke="#007AFF" strokeWidth="1" />
                <line x1="4" y1="19" x2="12" y2="19" stroke="#007AFF" strokeWidth="1" />
              </svg>
            </div>

            {/* File Name */}
            <div className="flex-1 min-w-0">
              <div
                className="truncate"
                style={{
                  fontSize: '16px',
                  fontWeight: 400,
                  lineHeight: '19px',
                  letterSpacing: '-0.3px',
                  color: 'rgba(0, 0, 0, 0.7)',
                }}
              >
                {file.name}
              </div>
            </div>
          </div>

          {/* File Info & Timestamp */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-1.5">
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 400,
                  lineHeight: '13px',
                  letterSpacing: '0.1px',
                  color: 'rgba(0, 0, 0, 0.4)',
                }}
              >
                {file.size}
              </span>
              <div
                style={{
                  width: '3px',
                  height: '3px',
                  borderRadius: '50%',
                  background: 'rgba(0, 0, 0, 0.2)',
                }}
              />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 400,
                  lineHeight: '13px',
                  letterSpacing: '0.1px',
                  color: 'rgba(0, 0, 0, 0.4)',
                }}
              >
                {file.format}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 400,
                  lineHeight: '13px',
                  letterSpacing: '0.5px',
                  color: 'rgba(0, 0, 0, 0.25)',
                }}
              >
                {message.timestamp}
              </span>

              {message.isSent && message.isRead && (
                <div className="flex" style={{ width: '13.5px', height: '8px' }}>
                  <Check size={12} strokeWidth={2} color="#3497F9" />
                  <Check size={12} strokeWidth={2} color="#3497F9" style={{ marginLeft: '-6px' }} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WhatsAppMockup;
