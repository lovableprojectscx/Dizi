export function buildWaUrl(phone: string, message: string): string {
  const cleaned = phone.replace(/\D/g, "");
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

export function formatPrice(n?: number | null): string {
  if (n === undefined || n === null || n === 0) {
    return "A consultar";
  }
  return `S/ ${n.toFixed(2)}`;
}
