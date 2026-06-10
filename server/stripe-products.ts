/**
 * Stripe Products Configuration
 * 
 * This file defines the ride products/prices for Stripe integration.
 * In production, these should match actual Stripe Product/Price IDs.
 */

export const STRIPE_PRODUCTS = {
  // For one-time ride payments, we'll create payment intents dynamically
  // based on the calculated ride price
  
  RIDE_PAYMENT: {
    name: "Corrida Fui!",
    description: "Pagamento de corrida",
  },
} as const;

/**
 * Helper to create a payment description for a ride
 */
export function getRidePaymentDescription(
  origin: string,
  destination: string,
  vehicleType: string
): string {
  return `Corrida de ${origin} para ${destination} (${vehicleType})`;
}
