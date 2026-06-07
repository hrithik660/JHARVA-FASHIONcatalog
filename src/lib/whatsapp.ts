// Full international format without + or spaces.
export const WHATSAPP_NUMBER = "917304417295";
export const WHATSAPP_DISPLAY = "+91 73044 17295";
export const INSTAGRAM_HANDLE = "jharva_fashion";
export const INSTAGRAM_URL = "https://instagram.com/jharva_fashion";
export const CONTACT_EMAIL = "jharvafashion@gmail.com";
export const LOCATION = "Mumbai, India";

export function buildWhatsAppLink(styleCode: string): string | null {
  if (!WHATSAPP_NUMBER) return null;
  const message = `Hello Jharva! I'm interested in Style Code ${styleCode} (₹99). Please share availability and how to order.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
