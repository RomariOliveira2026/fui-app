/**
 * Dados fictícios para screenshots da tela Nova Entrega em ambiente demo.
 * Somente exibição — não persiste em banco.
 */

export const DELIVERY_PORTFOLIO_DEMO = {
  pickupAddress: "Rua Laranjeiras, 210 – Centro, Aracaju/SE",
  pickupContactName: "Restaurante Sabor & Arte",
  pickupContactPhone: "(79) 99999-1111",
  pickupLat: "-10.9472",
  pickupLng: "-37.0731",
  deliveryAddress: "Av. Ministro Geraldo Barreto Sobral, 215 – Jardins, Aracaju/SE",
  recipientName: "Carlos Henrique",
  recipientPhone: "(79) 99999-2222",
  deliveryLat: "-10.9009",
  deliveryLng: "-37.0719",
  /** metros */
  distanceM: 8400,
  /** segundos */
  durationS: 1080,
  /** centavos */
  estimatedPriceCents: 2490,
} as const;

export function formatDeliveryPortfolioPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
