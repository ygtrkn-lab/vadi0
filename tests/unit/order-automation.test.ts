import { describe, expect, it, vi } from 'vitest';

// This module has side imports (supabase/email). Mock them so we can unit-test pure scheduling.
vi.mock('@/lib/supabase/admin', () => ({
  default: {},
}));

vi.mock('@/lib/email/emailService', () => ({
  EmailService: class EmailService {},
}));

import { calculateAutomationSchedule, type OrderRow } from '@/lib/orderAutomation';

describe('calculateAutomationSchedule', () => {
  it('creates noon schedule for confirmed orders (11:00/12:00/18:00 Istanbul)', () => {
    const order: OrderRow = {
      id: '1',
      order_number: 1001,
      status: 'confirmed',
      customer_email: null,
      customer_name: null,
      customer_phone: null,
      delivery: { deliveryDate: '2025-12-25' },
      payment: { status: 'paid' },
      order_time_group: null,
      timeline: [],
      created_at: '2025-12-24T14:00:00+03:00', // noon group
      updated_at: '2025-12-24T14:00:00+03:00',
      delivered_at: null,
    };

    const schedule = calculateAutomationSchedule(order);
    expect(schedule.map(s => s.targetStatus)).toEqual(['processing', 'shipped', 'delivered']);

    // 2025-12-25 11:00+03 => 08:00Z
    expect(schedule[0].targetTime.toISOString()).toBe('2025-12-25T08:00:00.000Z');
    // 12:00+03 => 09:00Z
    expect(schedule[1].targetTime.toISOString()).toBe('2025-12-25T09:00:00.000Z');
    // 18:00+03 => 15:00Z
    expect(schedule[2].targetTime.toISOString()).toBe('2025-12-25T15:00:00.000Z');
  });

  it('creates evening schedule for confirmed orders (18:00/19:00/22:30 Istanbul)', () => {
    const order: OrderRow = {
      id: '2',
      order_number: 1002,
      status: 'confirmed',
      customer_email: null,
      customer_name: null,
      customer_phone: null,
      delivery: { deliveryDate: '2025-12-25' },
      payment: { status: 'paid' },
      order_time_group: null,
      timeline: [],
      created_at: '2025-12-24T19:15:00+03:00', // evening group
      updated_at: '2025-12-24T19:15:00+03:00',
      delivered_at: null,
    };

    const schedule = calculateAutomationSchedule(order);
    expect(schedule.map(s => s.targetStatus)).toEqual(['processing', 'shipped', 'delivered']);

    // 18:00+03 => 15:00Z
    expect(schedule[0].targetTime.toISOString()).toBe('2025-12-25T15:00:00.000Z');
    // 19:00+03 => 16:00Z
    expect(schedule[1].targetTime.toISOString()).toBe('2025-12-25T16:00:00.000Z');
    // 22:30+03 => 19:30Z
    expect(schedule[2].targetTime.toISOString()).toBe('2025-12-25T19:30:00.000Z');
  });

  it('treats stored overnight as noon schedule', () => {
    const order: OrderRow = {
      id: '3',
      order_number: 1003,
      status: 'confirmed',
      customer_email: null,
      customer_name: null,
      customer_phone: null,
      delivery: { deliveryDate: '2025-12-25' },
      payment: { status: 'paid' },
      order_time_group: 'overnight',
      timeline: [],
      created_at: '2025-12-24T01:00:00+03:00',
      updated_at: '2025-12-24T01:00:00+03:00',
      delivered_at: null,
    };

    const schedule = calculateAutomationSchedule(order);
    expect(schedule[0].targetTime.toISOString()).toBe('2025-12-25T08:00:00.000Z');
  });
});
