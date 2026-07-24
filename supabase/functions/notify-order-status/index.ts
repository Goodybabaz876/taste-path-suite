// supabase/functions/notify-order-status/index.ts
// Deno / Supabase Edge Function
// Deploy: supabase functions deploy notify-order-status

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ── Types ──────────────────────────────────────────────────
interface Payload {
  order_id: string;
  user_id: string;
  old_status: string;
  new_status: string;
  total: number;
  fulfillment: "delivery" | "pickup";
}

interface OrderRow {
  id: string;
  status: string;
  total: number;
  fulfillment: string;
  subtotal: number;
  delivery_fee: number;
  tax: number;
  estimated_ready_at: string | null;
  created_at: string;
}

interface OrderItem {
  name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

// ── Email templates ────────────────────────────────────────
function formatNaira(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);
}

function itemRows(items: OrderItem[]): string {
  return items
    .map(
      (i) =>
        `<tr>
          <td style="padding:6px 0;font-size:14px;color:#1A2B4C;">${i.quantity} × ${i.name}</td>
          <td style="padding:6px 0;font-size:14px;color:#DC2626;text-align:right;font-weight:700;">${formatNaira(Number(i.line_total))}</td>
        </tr>`
    )
    .join("");
}

function baseTemplate({
  subject,
  heroColor,
  heroEmoji,
  heroTitle,
  heroSub,
  bodyHtml,
  order,
  items,
}: {
  subject: string;
  heroColor: string;
  heroEmoji: string;
  heroTitle: string;
  heroSub: string;
  bodyHtml: string;
  order: OrderRow;
  items: OrderItem[];
}): { subject: string; html: string } {
  const shortId = order.id.slice(0, 8).toUpperCase();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#F3F2DF;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F2DF;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

        <!-- Header -->
        <tr>
          <td style="background:${heroColor};padding:32px 40px;text-align:center;">
            <div style="font-size:48px;line-height:1;">${heroEmoji}</div>
            <h1 style="margin:12px 0 4px;font-size:26px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">${heroTitle}</h1>
            <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.85);">${heroSub}</p>
          </td>
        </tr>

        <!-- Brand bar -->
        <tr>
          <td style="background:#0E1B31;padding:12px 40px;text-align:center;">
            <span style="font-size:18px;font-weight:900;color:#F2A900;letter-spacing:1px;">🔥 ELIZADE FOODS</span>
            <span style="font-size:12px;color:#94a3b8;margin-left:8px;">Order · Track · Enjoy</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 40px;">
            ${bodyHtml}

            <!-- Order summary -->
            <div style="margin-top:28px;border-radius:12px;border:1px solid #E2E1D0;overflow:hidden;">
              <div style="background:#0E1B31;padding:12px 20px;">
                <span style="font-size:13px;font-weight:700;color:#F2A900;">ORDER #${shortId}</span>
              </div>
              <div style="padding:16px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  ${itemRows(items)}
                  <tr><td colspan="2" style="padding-top:12px;border-top:1px solid #E2E1D0;"></td></tr>
                  <tr>
                    <td style="font-size:12px;color:#4A5568;">Subtotal</td>
                    <td style="font-size:12px;color:#1A2B4C;text-align:right;">${formatNaira(Number(order.subtotal))}</td>
                  </tr>
                  <tr>
                    <td style="font-size:12px;color:#4A5568;">Delivery</td>
                    <td style="font-size:12px;color:#1A2B4C;text-align:right;">${formatNaira(Number(order.delivery_fee))}</td>
                  </tr>
                  <tr>
                    <td style="font-size:12px;color:#4A5568;">VAT (7.5%)</td>
                    <td style="font-size:12px;color:#1A2B4C;text-align:right;">${formatNaira(Number(order.tax))}</td>
                  </tr>
                  <tr>
                    <td style="font-size:15px;font-weight:900;color:#1A2B4C;padding-top:8px;">Total</td>
                    <td style="font-size:15px;font-weight:900;color:#DC2626;text-align:right;padding-top:8px;">${formatNaira(Number(order.total))}</td>
                  </tr>
                </table>
              </div>
            </div>

            <!-- CTA -->
            <div style="margin-top:28px;text-align:center;">
              <a href="https://bdwsmguhaiptmfozrsol.supabase.co/orders" style="display:inline-block;background:#F2A900;color:#1A2B4C;font-weight:900;font-size:14px;padding:14px 32px;border-radius:12px;text-decoration:none;">
                Track My Order
              </a>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F3F2DF;padding:24px 40px;text-align:center;border-top:1px solid #E2E1D0;">
            <p style="margin:0;font-size:12px;color:#4A5568;">
              ELIZADE FOODS · Campus Fresh Delivery · Available 8am–11pm daily
            </p>
            <p style="margin:4px 0 0;font-size:12px;color:#4A5568;">
              Questions? Call <a href="tel:+2348000000000" style="color:#F2A900;">+234 800 000 0000</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html };
}

// ── Per-status templates ───────────────────────────────────
function preparingTemplate(order: OrderRow, items: OrderItem[]) {
  return baseTemplate({
    subject: "Your ELIZADE FOODS order is being prepared 👨‍🍳",
    heroColor: "#1A2B4C",
    heroEmoji: "👨‍🍳",
    heroTitle: "We're cooking your order!",
    heroSub: "Our kitchen has started preparing your meal.",
    bodyHtml: `
      <p style="font-size:15px;color:#1A2B4C;margin:0 0 8px;">Your order is now in the kitchen.</p>
      <p style="font-size:14px;color:#4A5568;margin:0;">
        Sit tight — your food will be ready soon. You'll get another email when it's on its way.
      </p>
    `,
    order,
    items,
  });
}

function outForDeliveryTemplate(order: OrderRow, items: OrderItem[]) {
  return baseTemplate({
    subject: "Your ELIZADE FOODS order is on its way 🛵",
    heroColor: "#D97706",
    heroEmoji: "🛵",
    heroTitle: "It's on its way!",
    heroSub: "Your order has left the kitchen and is heading to you.",
    bodyHtml: `
      <p style="font-size:15px;color:#1A2B4C;margin:0 0 8px;">Your delivery rider is on the move.</p>
      <p style="font-size:14px;color:#4A5568;margin:0;">
        Keep an eye out — your hot meal is nearly there. 
        ${order.fulfillment === "pickup" ? "Head to the kitchen to pick up your order." : ""}
      </p>
    `,
    order,
    items,
  });
}

function deliveredTemplate(order: OrderRow, items: OrderItem[]) {
  return baseTemplate({
    subject: "Your ELIZADE FOODS order has been delivered ✅",
    heroColor: "#16a34a",
    heroEmoji: "✅",
    heroTitle: "Enjoy your meal!",
    heroSub: "Your order has been delivered. Bon appétit!",
    bodyHtml: `
      <p style="font-size:15px;color:#1A2B4C;margin:0 0 8px;">Your order has arrived. Time to dig in!</p>
      <p style="font-size:14px;color:#4A5568;margin:0;">
        We hope you enjoy every bite. Thank you for choosing ELIZADE FOODS — order again whenever you're hungry!
      </p>
    `,
    order,
    items,
  });
}

function pickTemplate(status: string, order: OrderRow, items: OrderItem[]): { subject: string; html: string } | null {
  switch (status) {
    case "preparing":       return preparingTemplate(order, items);
    case "out_for_delivery": return outForDeliveryTemplate(order, items);
    case "delivered":        return deliveredTemplate(order, items);
    default:                 return null;
  }
}

// ── Handler ────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let payload: Payload;
  try {
    payload = await req.json() as Payload;
  } catch {
    return new Response("Bad Request — invalid JSON", { status: 400 });
  }

  const { order_id, new_status } = payload;

  if (!order_id || !new_status) {
    return new Response("Bad Request — missing order_id or new_status", { status: 400 });
  }

  // Admin client (bypasses RLS)
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // Fetch order
  const { data: order, error: orderErr } = await admin
    .from("orders")
    .select("*")
    .eq("id", order_id)
    .maybeSingle();

  if (orderErr || !order) {
    console.error("[notify] order fetch error:", orderErr);
    return new Response("order not found", { status: 404 });
  }

  // Fetch order items
  const { data: items } = await admin
    .from("order_items")
    .select("name, quantity, unit_price, line_total")
    .eq("order_id", order_id);

  // Fetch user email via auth admin API
  const { data: { user }, error: userErr } = await admin.auth.admin.getUserById(order.user_id);

  if (userErr || !user?.email) {
    console.error("[notify] user fetch error:", userErr);
    return new Response("user email not found", { status: 404 });
  }

  const email = user.email;
  const template = pickTemplate(new_status, order as OrderRow, (items ?? []) as OrderItem[]);

  if (!template) {
    // Status we don't send an email for (e.g. 'placed', 'cancelled')
    return new Response("no template for status — skipped", { status: 200 });
  }

  // Send email via Supabase Auth admin (uses your configured SMTP)
  // This calls the /auth/v1/admin/users/{id} PATCH trick to send a magic-link-style
  // email, BUT for transactional content we use the raw SMTP relay approach below.
  // Using fetch to the Supabase SMTP endpoint directly is not public — instead we
  // call pg_net from the trigger and here we use the Resend-compatible approach
  // via the SMTP environment variables if set, or fall back to console.log in dev.

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const FROM_EMAIL     = Deno.env.get("FROM_EMAIL") ?? "orders@elizadefoods.com";
  const APP_URL        = Deno.env.get("APP_URL")    ?? "https://elizadefoods.com";

  // Fix the Track My Order URL to use the actual app URL
  const emailHtml = template.html.replace(
    "https://bdwsmguhaiptmfozrsol.supabase.co/orders",
    `${APP_URL}/order/${order_id}`
  );

  if (RESEND_API_KEY) {
    // Production: send via Resend (free tier: 100 emails/day)
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `ELIZADE FOODS <${FROM_EMAIL}>`,
        to: [email],
        subject: template.subject,
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[notify] Resend error:", err);
      return new Response(`Email send failed: ${err}`, { status: 500 });
    }

    console.log(`[notify] Email sent to ${email} for status=${new_status}`);
    return new Response(JSON.stringify({ ok: true, to: email, status: new_status }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Development fallback — log the email instead of sending
  console.log(`[notify] DEV MODE — would send email to ${email}`);
  console.log(`[notify] Subject: ${template.subject}`);
  return new Response(JSON.stringify({ ok: true, dev: true, to: email, status: new_status }), {
    headers: { "Content-Type": "application/json" },
  });
});
