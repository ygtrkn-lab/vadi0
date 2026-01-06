import React from 'react'
import { describe, it, expect } from 'vitest'
import ReactDOMServer from 'react-dom/server'
import OrderPrintTemplate from '@/components/OrderPrintTemplate'

describe('OrderPrintTemplate', () => {
  it('renders minimal order without crashing', () => {
    const sampleOrder = {
      orderNumber: 12345,
      createdAt: new Date().toISOString(),
      customerName: 'Ali Veli',
      customerPhone: '+905551112233',
      customerEmail: 'ali@example.com',
      delivery: {
        fullAddress: 'Acısu Mah. Örnek Cad. No:1, Istanbul',
        deliveryDate: '2026-01-08',
        deliveryTimeSlot: '13:00-15:00',
        deliveryNotes: 'Zil yerine kapıya bırakın'
      },
      items: [
        { name: 'Gül Buketi', quantity: 1, unitPrice: 149.9 }
      ],
      subtotal: 149.9,
      total: 149.9,
      note: 'Hızlı teslimat lütfen',
      message: {
        content: 'Bugün senin için biraz daha güzel olsun istedik. İyi ki varsın.',
        senderName: 'Seni çok seven çocukların💖'
      }
    }

    const el = React.createElement(OrderPrintTemplate as any, { order: sampleOrder })
    const html = ReactDOMServer.renderToStaticMarkup(el)
    expect(html).toContain('Sipariş #')
    expect(html).toContain('Gül Buketi')
    expect(html).toContain('Bugün senin için biraz daha güzel olsun istedik')
    expect(html).toContain('Seni çok seven çocukların')
    expect(html).not.toContain('HEDİYE')
    expect(html).toContain('✂')
    expect(html).toContain('Teslimat:')
    expect(html).toContain('Teslimat Notu:')
  })
})