import { NextResponse } from 'next/server';
import { analyticsDb } from '@/lib/supabase/analytics-client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d';
    
    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const supabase = analyticsDb;

    // Check if analytics is enabled
    if (!supabase) {
      return NextResponse.json({
        funnel: {
          add_to_cart: 0,
          view_cart: 0,
          begin_checkout: 0,
          step_recipient: 0,
          step_message: 0,
          step_payment: 0,
          select_payment_method: 0,
          purchase: 0
        },
        conversionRates: {
          cartToCheckout: '0',
          checkoutToPayment: '0',
          paymentToPurchase: '0',
          overall: '0'
        },
        paymentMethods: [],
        cartActions: { adds: 0, removes: 0, quantityChanges: 0 },
        dropOffAnalysis: { atRecipient: 0, atMessage: 0, atPayment: 0, completed: 0 },
        totalSessions: 0,
        recentEvents: []
      });
    }

    // Get checkout-related events
    const checkoutEventTypes = [
      'checkout_step',
      'select_payment_method',
      'begin_checkout',
      'add_payment_info',
      'purchase',
      'add_to_cart',
      'remove_from_cart',
      'view_cart',
      'cart_quantity_change'
    ];

    const { data: checkoutEvents, error } = await supabase
      .from('visitor_events')
      .select('id, event_type, event_data, created_at, session_id')
      .in('event_type', checkoutEventTypes)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('Checkout events fetch error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    const events = checkoutEvents || [];

    // Funnel analysis
    const funnelSteps = {
      add_to_cart: 0,
      view_cart: 0,
      begin_checkout: 0,
      step_recipient: 0,
      step_message: 0,
      step_payment: 0,
      select_payment_method: 0,
      purchase: 0
    };

    // Payment method breakdown
    const paymentMethods: Record<string, number> = {};

    // Cart actions
    const cartActions = {
      adds: 0,
      removes: 0,
      quantityChanges: 0
    };

    // Process events
    events.forEach((event: any) => {
      const eventType = event.event_type;
      const data = event.event_data || {};

      switch (eventType) {
        case 'add_to_cart':
          funnelSteps.add_to_cart++;
          cartActions.adds++;
          break;
        case 'view_cart':
          funnelSteps.view_cart++;
          break;
        case 'begin_checkout':
          funnelSteps.begin_checkout++;
          break;
        case 'checkout_step':
          const step = data.step;
          if (step === 'recipient') funnelSteps.step_recipient++;
          else if (step === 'message') funnelSteps.step_message++;
          else if (step === 'payment') funnelSteps.step_payment++;
          break;
        case 'select_payment_method':
          funnelSteps.select_payment_method++;
          const method = data.payment_method || data.paymentMethod || 'unknown';
          paymentMethods[method] = (paymentMethods[method] || 0) + 1;
          break;
        case 'purchase':
          funnelSteps.purchase++;
          break;
        case 'remove_from_cart':
          cartActions.removes++;
          break;
        case 'cart_quantity_change':
          cartActions.quantityChanges++;
          break;
      }
    });

    // Calculate conversion rates
    const conversionRates = {
      cartToCheckout: funnelSteps.add_to_cart > 0 
        ? ((funnelSteps.begin_checkout / funnelSteps.add_to_cart) * 100).toFixed(1) 
        : '0',
      checkoutToPayment: funnelSteps.begin_checkout > 0 
        ? ((funnelSteps.step_payment / funnelSteps.begin_checkout) * 100).toFixed(1) 
        : '0',
      paymentToPurchase: funnelSteps.step_payment > 0 
        ? ((funnelSteps.purchase / funnelSteps.step_payment) * 100).toFixed(1) 
        : '0',
      overall: funnelSteps.add_to_cart > 0 
        ? ((funnelSteps.purchase / funnelSteps.add_to_cart) * 100).toFixed(1) 
        : '0'
    };

    // Session journey analysis - track how users progress through checkout
    const sessionJourneys: Record<string, string[]> = {};
    events.forEach((event: any) => {
      const sessionId = event.session_id;
      if (!sessionJourneys[sessionId]) {
        sessionJourneys[sessionId] = [];
      }
      sessionJourneys[sessionId].push(event.event_type);
    });

    // Find drop-off points
    const dropOffAnalysis = {
      atRecipient: 0,
      atMessage: 0,
      atPayment: 0,
      completed: 0
    };

    Object.values(sessionJourneys).forEach((journey) => {
      const hasRecipient = journey.includes('checkout_step');
      const hasPurchase = journey.includes('purchase');
      
      if (hasRecipient && !hasPurchase) {
        // Check last step
        const lastCheckoutStep = [...journey].reverse().find(e => e === 'checkout_step');
        if (lastCheckoutStep) {
          dropOffAnalysis.atPayment++; // Simplified - would need event_data for precise step
        }
      } else if (hasPurchase) {
        dropOffAnalysis.completed++;
      }
    });

    return NextResponse.json({
      funnel: funnelSteps,
      conversionRates,
      paymentMethods: Object.entries(paymentMethods)
        .map(([method, count]) => ({ method, count }))
        .sort((a, b) => b.count - a.count),
      cartActions,
      dropOffAnalysis,
      totalSessions: Object.keys(sessionJourneys).length,
      recentEvents: events.slice(0, 50).map((e: any) => ({
        id: e.id,
        type: e.event_type,
        data: e.event_data,
        timestamp: e.created_at
      }))
    });
  } catch (error) {
    console.error('Checkout flow API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
