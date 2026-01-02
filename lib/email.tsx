interface EmailConfig {
  to: string
  subject: string
  html: string
}

async function sendEmail(config: EmailConfig) {
  // In production, you would integrate with an email service like Resend, SendGrid, etc.
  // For now, we'll log to console
  console.log("[Email] Sending email:", {
    to: config.to,
    subject: config.subject,
  })

  // Simulated email sending
  // In production: await resend.emails.send({ from: 'noreply@company.com', ...config })

  return { success: true }
}

export async function sendOrderConfirmationEmail(data: {
  customerName: string
  customerEmail: string
  orderNumber: string
  orderItems: Array<{ name: string; quantity: number; price: number }>
  total: number
  orderDate: string
}) {
  const itemsHtml = data.orderItems
    .map(
      (item) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.price.toFixed(2)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${(item.quantity * item.price).toFixed(2)}</td>
    </tr>
  `,
    )
    .join("")

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Order Confirmation</h1>
          <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Thank you for your order!</p>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; margin-top: 0;">Hi ${data.customerName},</p>
          <p style="font-size: 14px; color: #666;">We've received your order and are processing it now. Here are the details:</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
            <p style="margin: 0 0 5px; font-size: 14px; color: #666;">Order Number</p>
            <p style="margin: 0; font-size: 20px; font-weight: bold; color: #667eea;">${data.orderNumber}</p>
          </div>
          
          <h2 style="font-size: 18px; margin: 30px 0 15px;">Order Items</h2>
          <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 12px 8px; text-align: left; font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase;">Product</th>
                <th style="padding: 12px 8px; text-align: center; font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase;">Qty</th>
                <th style="padding: 12px 8px; text-align: right; font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase;">Price</th>
                <th style="padding: 12px 8px; text-align: right; font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <tr>
                <td colspan="3" style="padding: 12px 8px; text-align: right; font-weight: 600; font-size: 16px;">Total:</td>
                <td style="padding: 12px 8px; text-align: right; font-weight: 600; font-size: 16px; color: #667eea;">$${data.total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          
          <div style="margin-top: 30px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              <strong>What's next?</strong> We'll send you another email when your order ships.
            </p>
          </div>
          
          <p style="margin-top: 30px; font-size: 14px; color: #666;">
            If you have any questions, please don't hesitate to contact us.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #999;">
            <p style="margin: 5px 0;">Wiyone Charcoal</p>
            <p style="margin: 5px 0;">Freetown, Sierra Leone</p>
          </div>
        </div>
      </body>
    </html>
  `

  return await sendEmail({
    to: data.customerEmail,
    subject: `Order Confirmation - ${data.orderNumber}`,
    html,
  })
}

export async function sendInquiryNotificationEmail(data: {
  name: string
  email: string
  phone?: string
  message: string
  submittedAt: string
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">New Contact Inquiry</h1>
          <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Someone has submitted a contact form</p>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 20px;">
            <h2 style="margin: 0 0 15px; font-size: 16px; color: #666;">Contact Details</h2>
            <p style="margin: 8px 0;"><strong>Name:</strong> ${data.name}</p>
            <p style="margin: 8px 0;"><strong>Email:</strong> <a href="mailto:${data.email}" style="color: #10b981;">${data.email}</a></p>
            ${data.phone ? `<p style="margin: 8px 0;"><strong>Phone:</strong> ${data.phone}</p>` : ""}
            <p style="margin: 8px 0; font-size: 12px; color: #999;">
              <strong>Submitted:</strong> ${new Date(data.submittedAt).toLocaleString()}
            </p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h2 style="margin: 0 0 15px; font-size: 16px; color: #666;">Message</h2>
            <p style="margin: 0; white-space: pre-wrap;">${data.message}</p>
          </div>
          
          <div style="margin-top: 20px; text-align: center;">
            <a href="mailto:${data.email}" style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Reply to ${data.name}
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #999;">
            <p style="margin: 5px 0;">This is an automated notification from your website contact form</p>
          </div>
        </div>
      </body>
    </html>
  `

  // Send to admin email (you would get this from company_settings in production)
  return await sendEmail({
    to: "admin@wiyonecharcoal.com", // Replace with actual admin email from settings
    subject: `New Contact Inquiry from ${data.name}`,
    html,
  })
}

export async function sendLowStockAlert(data: {
  productName: string
  currentStock: number
  minStock: number
  sku: string
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">⚠️ Low Stock Alert</h1>
          <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Immediate attention required</p>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <div style="background: #fef2f2; border: 2px solid #fca5a5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 16px; font-weight: 600; color: #991b1b;">
              Stock level is below minimum threshold!
            </p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h2 style="margin: 0 0 15px; font-size: 18px;">${data.productName}</h2>
            <p style="margin: 8px 0; color: #666;"><strong>SKU:</strong> ${data.sku}</p>
            <div style="margin: 20px 0; padding: 15px; background: #f3f4f6; border-radius: 6px;">
              <p style="margin: 5px 0; font-size: 14px;">Current Stock: <strong style="color: #ef4444; font-size: 18px;">${data.currentStock}</strong></p>
              <p style="margin: 5px 0; font-size: 14px;">Minimum Required: <strong>${data.minStock}</strong></p>
            </div>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px; color: #1e40af;">
              <strong>Action Required:</strong> Please reorder this product to avoid stock-outs.
            </p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #999;">
            <p style="margin: 5px 0;">Automated alert from Wiyone Charcoal Inventory System</p>
          </div>
        </div>
      </body>
    </html>
  `

  return await sendEmail({
    to: "admin@wiyonecharcoal.com", // Replace with actual admin email
    subject: `🚨 Low Stock Alert: ${data.productName}`,
    html,
  })
}
