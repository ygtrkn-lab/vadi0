/**
 * Transformation utilities for converting between snake_case (Supabase) 
 * and camelCase (Frontend/TypeScript)
 */

/**
 * Convert snake_case object keys to camelCase recursively
 * @param obj - Object with snake_case keys (from Supabase)
 * @returns Object with camelCase keys (for Frontend)
 */
export function toCamelCase<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item)) as T;
  }

  // Handle plain objects (not Date, not other built-in types)
  if (typeof obj === 'object' && obj.constructor === Object) {
    const converted: any = {};

    for (const [key, value] of Object.entries(obj)) {
      // Convert snake_case to camelCase
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      converted[camelKey] = toCamelCase(value);
    }

    return converted as T;
  }

  // Return primitives as-is
  return obj as T;
}

/**
 * Convert camelCase object keys to snake_case recursively
 * @param obj - Object with camelCase keys (from Frontend)
 * @returns Object with snake_case keys (for Supabase)
 */
export function toSnakeCase<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => toSnakeCase(item)) as T;
  }

  // Handle plain objects (not Date, not other built-in types)
  if (typeof obj === 'object' && obj.constructor === Object) {
    const converted: any = {};

    for (const [key, value] of Object.entries(obj)) {
      // Convert camelCase to snake_case
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      converted[snakeKey] = toSnakeCase(value);
    }

    return converted as T;
  }

  // Return primitives as-is
  return obj as T;
}

/**
 * Transform a single customer object from Supabase to Frontend format
 */
export function transformCustomer(customer: any) {
  if (!customer) return null;
  return toCamelCase(customer);
}

/**
 * Transform an array of customers from Supabase to Frontend format
 */
export function transformCustomers(customers: any[]) {
  if (!customers) return [];
  return customers.map(toCamelCase);
}

/**
 * Transform a single order object from Supabase to Frontend format
 */
export function transformOrder(order: any) {
  if (!order) return null;
  return toCamelCase(order);
}

/**
 * Transform an array of orders from Supabase to Frontend format
 */
export function transformOrders(orders: any[]) {
  if (!orders) return [];
  return orders.map(toCamelCase);
}

/**
 * Transform a single coupon object from Supabase to Frontend format
 */
export function transformCoupon(coupon: any) {
  if (!coupon) return null;
  return toCamelCase(coupon);
}

/**
 * Transform an array of coupons from Supabase to Frontend format
 */
export function transformCoupons(coupons: any[]) {
  if (!coupons) return [];
  return coupons.map(toCamelCase);
}
