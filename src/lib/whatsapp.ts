export function buildWaUrl(phone: string, message: string): string {
  const cleaned = phone.replace(/\D/g, "");
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

export function formatPrice(n: number): string {
  return `S/ ${n.toFixed(2)}`;
}
