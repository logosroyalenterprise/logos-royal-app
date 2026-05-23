import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface OrderItem {
  product_name: string;
  product_img: string | null;
  quantity: number;
  unit_price: number;
  color: string | null;
  size: string | null;
}

interface ShippingAddress {
  full_name: string;
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  postal_code?: string | null;
  country: string;
}

interface OrderConfirmationParams {
  to: string;
  orderId: string;
  orderRef: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  address: ShippingAddress | null;
  orderUrl: string;
}

function formatCedi(n: number) {
  return `GH₵${n.toFixed(2)}`;
}

function buildHtml(p: OrderConfirmationParams): string {
  const itemRows = p.items
    .map(
      (item) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;vertical-align:top">
        <p style="margin:0;font-size:14px;font-weight:600;color:#111">${item.product_name}</p>
        ${item.color || item.size ? `<p style="margin:2px 0 0;font-size:12px;color:#888">${[item.color, item.size].filter(Boolean).join(" · ")}</p>` : ""}
        <p style="margin:2px 0 0;font-size:12px;color:#888">Qty ${item.quantity}</p>
      </td>
      <td style="padding:12px 0 12px 16px;border-bottom:1px solid #f0f0f0;text-align:right;vertical-align:top;white-space:nowrap">
        <p style="margin:0;font-size:14px;font-weight:600;color:#111">${formatCedi(item.unit_price * item.quantity)}</p>
      </td>
    </tr>`,
    )
    .join("");

  const addressBlock = p.address
    ? `
    <div style="margin-top:24px;background:#f9f9f9;border-radius:12px;padding:16px">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#888">Shipping to</p>
      <p style="margin:0;font-size:14px;font-weight:600;color:#111">${p.address.full_name}</p>
      <p style="margin:2px 0 0;font-size:14px;color:#555">${p.address.line1}${p.address.line2 ? `, ${p.address.line2}` : ""}</p>
      <p style="margin:2px 0 0;font-size:14px;color:#555">${[p.address.city, p.address.state, p.address.postal_code].filter(Boolean).join(", ")}</p>
      ${p.address.country !== "GH" ? `<p style="margin:2px 0 0;font-size:14px;color:#555">${p.address.country}</p>` : ""}
    </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.07)">

        <!-- Header -->
        <tr><td style="background:#0f172a;padding:28px 32px;text-align:center">
          <p style="margin:0;font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.02em">Logos Royal</p>
          <p style="margin:6px 0 0;font-size:13px;color:#94a3b8">Order Confirmed</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px">
          <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#111">Thanks for your order!</p>
          <p style="margin:0 0 24px;font-size:14px;color:#666">Order <strong>#${p.orderRef}</strong> has been confirmed and is being prepared.</p>

          <!-- Items -->
          <table width="100%" cellpadding="0" cellspacing="0">
            ${itemRows}
          </table>

          <!-- Totals -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px">
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#666">Subtotal</td>
              <td style="padding:6px 0;font-size:13px;color:#666;text-align:right">${formatCedi(p.subtotal)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#666">Shipping</td>
              <td style="padding:6px 0;font-size:13px;color:${p.shipping === 0 ? "#059669" : "#666"};text-align:right">${p.shipping === 0 ? "Free" : formatCedi(p.shipping)}</td>
            </tr>
            <tr style="border-top:1px solid #f0f0f0">
              <td style="padding:10px 0 0;font-size:15px;font-weight:700;color:#111">Total</td>
              <td style="padding:10px 0 0;font-size:15px;font-weight:700;color:#111;text-align:right">${formatCedi(p.total)}</td>
            </tr>
          </table>

          ${addressBlock}

          <!-- CTA -->
          <div style="margin-top:28px;text-align:center">
            <a href="${p.orderUrl}" style="display:inline-block;padding:12px 28px;background:#0f172a;color:#fff;font-size:14px;font-weight:600;border-radius:100px;text-decoration:none">View Order</a>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 32px;border-top:1px solid #f0f0f0;text-align:center">
          <p style="margin:0;font-size:12px;color:#aaa">Questions? Reply to this email or contact support.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendOrderConfirmation(params: OrderConfirmationParams): Promise<void> {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!process.env.RESEND_API_KEY || !from) return;

  await resend.emails.send({
    from,
    to: params.to,
    subject: `Order confirmed #${params.orderRef} — Logos Royal`,
    html: buildHtml(params),
  });
}
