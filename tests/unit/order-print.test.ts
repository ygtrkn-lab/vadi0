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
        notes: 'Kapi zilini çalmayın'
      },
      items: [
        { name: 'Gül Buketi', quantity: 1, unitPrice: 149.9 }
      ],
      subtotal: 149.9,
      total: 149.9,
      note: 'Hızlı teslimat lütfen'
    }

    const el = React.createElement(OrderPrintTemplate as any, { order: sampleOrder })
    const html = ReactDOMServer.renderToStaticMarkup(el)
    expect(html).toContain('Sipariş #')
    expect(html).toContain('Gül Buketi')
  })
})