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
    expect(html).toContain('Teslimat Tarihi')
    expect(html).toContain('Teslimat Notu')
  })

  it('renders gift message as gift note at the end and auto-fills fields', () => {
    const giftOrder = {
      orderNumber: 99999,
      createdAt: new Date().toISOString(),
      customerName: 'Veli Ali',
      delivery: { recipientName: 'Alıcı İsim', deliveryDate: '2026-01-08' },
      items: [{ name: 'Orkide', quantity: 1, unitPrice: 199 }],
      subtotal: 199,
      total: 199,
      message: {
        content: 'Sürpriz! Mutlu yıllar!',
        senderName: 'Sevgilerle',
        isGift: true
      }
    }

    const el = React.createElement(OrderPrintTemplate as any, { order: giftOrder })
    const html = ReactDOMServer.renderToStaticMarkup(el)
    expect(html).toContain('🎁 Hediye Notu')
    expect(html).not.toContain('Hediye Sertifikası')
    expect(html).toContain('KİME')
    expect(html).toContain('Alıcı İsim')
    expect(html).toContain('KİMDEN')
    expect(html).toContain('Sevgilerle')
    expect(html).not.toContain('AMOUNT')
    expect(html).not.toContain('EXP')
    expect(html).not.toContain('199')
    expect(html).toContain('/logo.png')
    expect(html).toContain('8.5cm')
    expect(html).toContain('6.5cm')
    expect(html).toContain('justify-content:flex-start')
    expect(html).toContain('✂')
    expect(html).toContain('dashed')
    expect(html).toContain('inset: 14')
    expect(html).toContain('line-height:16px')
    // QR container and size
    expect(html).toContain('data-qr')
    expect(html).toContain('102')
    expect(html).toContain('max-height:60px')
    expect(html).toContain('font-size:10px')
    expect(html).toContain('Mutlu anlar için vadiler.com')
    expect(html).toContain('TheMunday')
    expect(html).toContain('text-transform:uppercase')
    expect(html).toContain('letter-spacing:1px')
    // Turkish support: container lang and Montserrat/Roboto fallback present
    expect(html).toContain('lang="tr"')
    expect(html).toContain('Montserrat')
    expect(html).toContain('Roboto')
    expect(html).toContain('font-display: swap')
    // Slogan smaller
    expect(html).toContain('font-size:9px')
    // Gift message uses TheMunday fallback and Roboto primary
    expect(html).toContain('TheMunday')
    expect(html).toContain('Roboto')
    expect(html).toContain('text-transform:none')
    expect(html).toContain('letter-spacing:0.2px')
    // Certificate markers present
    expect(html).toContain('data-certificate="true"')
    expect(html).toContain('data-gift-message="true"')
    expect(html).toContain('data-recipient-name')
    expect(html).toContain('data-sender-name')

    // ordering: logo -> message -> fields
    const msgPos = html.indexOf('Sürpriz! Mutlu yıllar!')
    const kimePos = html.indexOf('KİME')
    const logoPos = html.indexOf('/logo.png')
    expect(logoPos).toBeLessThan(msgPos)
    expect(msgPos).toBeLessThan(kimePos)

    // Delivery date formatting
    expect(html).toContain('2026')
    expect(html).toContain('11:00-17:00')

    expect(html).not.toContain('💌 Mesaj Kartı')
  })
})