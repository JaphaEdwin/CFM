import nodemailer from 'nodemailer';

interface OrderRow {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  delivery_address: string | null;
  order_items: string;
  total_amount: number;
  notes: string | null;
  status: string;
  created_at: string;
}

interface OrderItem {
  product: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

// Create transporter - uses environment variables for configuration
function createTransporter() {
  // If SMTP settings are configured, use them
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Fallback: log email to console (for development)
  console.log('[Email Service] No SMTP configured. Emails will be logged to console.');
  return null;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
  }).format(amount);
}

function buildOrderEmailHtml(order: OrderRow): string {
  let items: OrderItem[];
  try {
    items = typeof order.order_items === 'string' ? JSON.parse(order.order_items) : order.order_items;
  } catch {
    items = [];
  }

  const itemRows = items.map(item => `
    <tr>
      <td style="padding: 12px 16px; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #374151;">${item.product}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #374151; text-align: center;">${item.quantity} ${item.unit || ''}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #374151; text-align: right;">${formatCurrency(item.unitPrice || 0)}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #374151; text-align: right; font-weight: 600;">${formatCurrency(item.quantity * (item.unitPrice || 0))}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #d97706, #ea580c); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; color: #ffffff; font-weight: 700;">🐔 Country Farm Matugga</h1>
          <p style="margin: 8px 0 0; color: #fde68a; font-size: 14px;">New Order Received</p>
        </div>
        
        <!-- Order Number Banner -->
        <div style="background-color: #fffbeb; padding: 16px 32px; border-bottom: 2px solid #f59e0b;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <span style="font-size: 12px; color: #92400e; text-transform: uppercase; letter-spacing: 1px;">Order Number</span><br/>
                <span style="font-size: 20px; font-weight: 700; color: #92400e;">${order.order_number}</span>
              </td>
              <td style="text-align: right;">
                <span style="font-size: 12px; color: #92400e; text-transform: uppercase; letter-spacing: 1px;">Date</span><br/>
                <span style="font-size: 14px; color: #92400e;">${new Date(order.created_at).toLocaleDateString('en-UG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </td>
            </tr>
          </table>
        </div>

        <!-- Content -->
        <div style="background-color: #ffffff; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <!-- Customer Info -->
          <h2 style="margin: 0 0 16px; font-size: 16px; color: #374151; border-bottom: 2px solid #f3f4f6; padding-bottom: 8px;">Customer Details</h2>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
            <tr>
              <td style="padding: 6px 0; font-size: 14px; color: #6b7280; width: 130px;">Name:</td>
              <td style="padding: 6px 0; font-size: 14px; color: #111827; font-weight: 600;">${order.customer_name}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">Phone:</td>
              <td style="padding: 6px 0; font-size: 14px; color: #111827; font-weight: 600;">${order.customer_phone}</td>
            </tr>
            ${order.customer_email ? `
            <tr>
              <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">Email:</td>
              <td style="padding: 6px 0; font-size: 14px; color: #111827; font-weight: 600;">${order.customer_email}</td>
            </tr>` : ''}
            ${order.delivery_address ? `
            <tr>
              <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">Delivery Address:</td>
              <td style="padding: 6px 0; font-size: 14px; color: #111827; font-weight: 600;">${order.delivery_address}</td>
            </tr>` : ''}
          </table>

          <!-- Order Items -->
          <h2 style="margin: 0 0 16px; font-size: 16px; color: #374151; border-bottom: 2px solid #f3f4f6; padding-bottom: 8px;">Order Items</h2>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 10px 16px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">Product</th>
                <th style="padding: 10px 16px; text-align: center; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">Qty</th>
                <th style="padding: 10px 16px; text-align: right; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">Unit Price</th>
                <th style="padding: 10px 16px; text-align: right; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>

          <!-- Total -->
          <div style="background-color: #fffbeb; border-radius: 8px; padding: 16px; text-align: right;">
            <span style="font-size: 16px; color: #92400e;">Total Amount: </span>
            <span style="font-size: 24px; font-weight: 700; color: #92400e;">${formatCurrency(order.total_amount)}</span>
          </div>

          ${order.notes ? `
          <!-- Notes -->
          <div style="margin-top: 24px; padding: 16px; background-color: #f3f4f6; border-radius: 8px; border-left: 4px solid #d97706;">
            <h3 style="margin: 0 0 8px; font-size: 14px; color: #374151;">Customer Notes:</h3>
            <p style="margin: 0; font-size: 14px; color: #6b7280;">${order.notes}</p>
          </div>` : ''}
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 24px; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0;">This is an automated notification from Country Farm Matugga</p>
          <p style="margin: 4px 0 0;">Please log in to the dashboard to manage this order.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendOrderEmail(order: OrderRow, companyEmail: string): Promise<void> {
  const transporter = createTransporter();
  const html = buildOrderEmailHtml(order);

  if (!transporter) {
    // Development mode - log to console
    console.log('=== ORDER EMAIL NOTIFICATION ===');
    console.log(`To: ${companyEmail}`);
    console.log(`Subject: New Order #${order.order_number} from ${order.customer_name}`);
    console.log(`Order Total: ${formatCurrency(order.total_amount)}`);
    console.log('================================');
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || `"Country Farm Matugga" <${process.env.SMTP_USER}>`,
    to: companyEmail,
    subject: `🐔 New Order #${order.order_number} from ${order.customer_name}`,
    html,
  });

  console.log(`Order email sent to ${companyEmail} for order #${order.order_number}`);
}
