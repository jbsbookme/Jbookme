// Email notification utilities
// This module handles sending email notifications for appointments

export interface EmailNotificationData {
  to: string;
  subject: string;
  body: string;
}

/**
 * Send email notification
 * In a production environment, you would integrate with an email service like:
 * - SendGrid
 * - Mailgun
 * - AWS SES
 * - Nodemailer with SMTP
 * 
 * For now, this is a placeholder that logs the email
 */
export async function sendEmail(data: EmailNotificationData): Promise<boolean> {
  try {
    console.log('===== EMAIL NOTIFICATION =====');
    console.log('To:', data.to);
    console.log('Subject:', data.subject);
    console.log('Body:', data.body);
    console.log('=============================');

    // TODO: Integrate with actual email service
    // Example with SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({
    //   to: data.to,
    //   from: process.env.FROM_EMAIL,
    //   subject: data.subject,
    //   html: data.body,
    // });

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Generate email body for 24-hour reminder
 */
export function generate24HourReminderEmail(
  clientName: string,
  barberName: string,
  serviceName: string,
  date: string,
  time: string
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0a0a0a; color: #ffffff;">
      <div style="background: linear-gradient(135deg, #00f0ff, #0099cc); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: #000; margin: 0;">✂️ Recordatorio de Cita</h1>
      </div>
      
      <div style="background-color: #1a1a1a; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 18px; color: #00f0ff; margin-bottom: 20px;">Hola ${clientName},</p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #cccccc;">
          Este es un recordatorio de que tienes una cita programada <strong style="color: #ffd700;">mañana</strong>:
        </p>
        
        <div style="background-color: #0a0a0a; padding: 20px; border-left: 4px solid #00f0ff; margin: 20px 0;">
          <p style="margin: 5px 0; color: #ffffff;"><strong>Servicio:</strong> ${serviceName}</p>
          <p style="margin: 5px 0; color: #ffffff;"><strong>Barbero:</strong> ${barberName}</p>
          <p style="margin: 5px 0; color: #ffffff;"><strong>Fecha:</strong> ${date}</p>
          <p style="margin: 5px 0; color: #ffffff;"><strong>Hora:</strong> ${time}</p>
        </div>
        
        <p style="font-size: 14px; color: #888888; margin-top: 20px;">
          Te esperamos. Si necesitas cancelar o reprogramar, por favor contáctanos lo antes posible.
        </p>
        
        <p style="font-size: 16px; color: #00f0ff; margin-top: 30px;">
          ¡Nos vemos pronto!<br>
          <strong style="color: #ffd700;">Tu Barbería</strong>
        </p>
      </div>
    </div>
  `;
}

/**
 * Generate email body for 12-hour reminder
 */
export function generate12HourReminderEmail(
  clientName: string,
  barberName: string,
  serviceName: string,
  date: string,
  time: string
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0a0a0a; color: #ffffff;">
      <div style="background: linear-gradient(135deg, #8b5cf6, #6366f1); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: #ffffff; margin: 0;">📅 Recordatorio de Cita Próxima</h1>
      </div>
      
      <div style="background-color: #1a1a1a; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 18px; color: #00f0ff; margin-bottom: 20px;">Hola ${clientName},</p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #cccccc;">
          Tu cita es <strong style="color: #8b5cf6;">en aproximadamente 12 horas</strong>. Te recordamos los detalles:
        </p>
        
        <div style="background-color: #0a0a0a; padding: 20px; border-left: 4px solid #8b5cf6; margin: 20px 0;">
          <p style="margin: 5px 0; color: #ffffff;"><strong>Servicio:</strong> ${serviceName}</p>
          <p style="margin: 5px 0; color: #ffffff;"><strong>Barbero:</strong> ${barberName}</p>
          <p style="margin: 5px 0; color: #ffffff;"><strong>Fecha:</strong> ${date}</p>
          <p style="margin: 5px 0; color: #ffffff;"><strong>Hora:</strong> ${time}</p>
        </div>
        
        <p style="font-size: 14px; color: #888888; margin-top: 20px;">
          Si necesitas hacer algún cambio, por favor contáctanos cuanto antes.
        </p>
        
        <p style="font-size: 16px; color: #00f0ff; margin-top: 30px;">
          ¡Te esperamos!<br>
          <strong style="color: #ffd700;">BookMe - Tu Barbería</strong>
        </p>
      </div>
    </div>
  `;
}

/**
 * Generate email body for 2-hour reminder
 */
export function generate2HourReminderEmail(
  clientName: string,
  barberName: string,
  serviceName: string,
  date: string,
  time: string
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0a0a0a; color: #ffffff;">
      <div style="background: linear-gradient(135deg, #ffd700, #ff9500); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: #000; margin: 0;">⏰ ¡Tu Cita es Pronto!</h1>
      </div>
      
      <div style="background-color: #1a1a1a; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 18px; color: #00f0ff; margin-bottom: 20px;">Hola ${clientName},</p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #cccccc;">
          Tu cita es <strong style="color: #ffd700;">en aproximadamente 2 horas</strong>. ¡No la olvides!
        </p>
        
        <div style="background-color: #0a0a0a; padding: 20px; border-left: 4px solid #ffd700; margin: 20px 0;">
          <p style="margin: 5px 0; color: #ffffff;"><strong>Servicio:</strong> ${serviceName}</p>
          <p style="margin: 5px 0; color: #ffffff;"><strong>Barbero:</strong> ${barberName}</p>
          <p style="margin: 5px 0; color: #ffffff;"><strong>Fecha:</strong> ${date}</p>
          <p style="margin: 5px 0; color: #ffffff;"><strong>Hora:</strong> ${time}</p>
        </div>
        
        <p style="font-size: 14px; color: #888888; margin-top: 20px;">
          Recuerda llegar con un poco de anticipación.
        </p>
        
        <p style="font-size: 16px; color: #00f0ff; margin-top: 30px;">
          ¡Nos vemos en un rato!<br>
          <strong style="color: #ffd700;">BookMe - Tu Barbería</strong>
        </p>
      </div>
    </div>
  `;
}

/**
 * Generate email body for 30-minute reminder (URGENT)
 */
export function generate30MinuteReminderEmail(
  clientName: string,
  barberName: string,
  serviceName: string,
  date: string,
  time: string
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0a0a0a; color: #ffffff;">
      <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; animation: pulse 1s infinite;">🚨 ¡URGENTE - Tu Cita es en 30 Minutos!</h1>
      </div>
      
      <div style="background-color: #1a1a1a; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 20px; color: #ff0000; font-weight: bold; margin-bottom: 20px; text-align: center;">
          ⏰ Tu cita es en 30 minutos ⏰
        </p>
        
        <p style="font-size: 18px; color: #00f0ff; margin-bottom: 20px;">Hola ${clientName},</p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #ffffff; background-color: #ef4444; padding: 15px; border-radius: 8px; text-align: center;">
          <strong>¡Es hora de salir! Tu cita comienza a las ${time}</strong>
        </p>
        
        <div style="background-color: #0a0a0a; padding: 20px; border-left: 4px solid #ef4444; margin: 20px 0;">
          <p style="margin: 5px 0; color: #ffffff; font-size: 16px;"><strong>Servicio:</strong> ${serviceName}</p>
          <p style="margin: 5px 0; color: #ffffff; font-size: 16px;"><strong>Barbero:</strong> ${barberName}</p>
          <p style="margin: 5px 0; color: #ffffff; font-size: 16px;"><strong>Fecha:</strong> ${date}</p>
          <p style="margin: 5px 0; color: #ffffff; font-size: 16px;"><strong>Hora:</strong> <span style="color: #ef4444; font-weight: bold;">${time}</span></p>
        </div>
        
        <p style="font-size: 14px; color: #ffff00; margin-top: 20px; text-align: center; font-weight: bold;">
          ⚠️ Por favor, llega puntual o avísanos si llegarás tarde ⚠️
        </p>
        
        <p style="font-size: 18px; color: #00f0ff; margin-top: 30px; text-align: center;">
          ¡Te esperamos!<br>
          <strong style="color: #ffd700;">BookMe - Tu Barbería</strong>
        </p>
      </div>
    </div>
  `;
}

/**
 * Generate email body for thank you message after completion
 */
export function generateThankYouEmail(
  clientName: string,
  barberName: string,
  serviceName: string
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0a0a0a; color: #ffffff;">
      <div style="background: linear-gradient(135deg, #00f0ff, #0099cc); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: #000; margin: 0;">💈 ¡Gracias por tu Visita!</h1>
      </div>
      
      <div style="background-color: #1a1a1a; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 18px; color: #00f0ff; margin-bottom: 20px;">Hola ${clientName},</p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #cccccc;">
          Muchas gracias por elegir nuestros servicios. Esperamos que hayas quedado satisfecho con tu <strong style="color: #ffd700;">${serviceName}</strong> realizado por <strong style="color: #00f0ff;">${barberName}</strong>.
        </p>
        
        <div style="background-color: #0a0a0a; padding: 20px; border-left: 4px solid #00f0ff; margin: 20px 0; text-align: center;">
          <p style="font-size: 18px; color: #ffd700; margin: 10px 0;">
            ⭐ ⭐ ⭐ ⭐ ⭐
          </p>
          <p style="color: #cccccc; margin: 10px 0;">
            ¿Te gustaría dejarnos una reseña?
          </p>
          <p style="font-size: 14px; color: #888888;">
            Tu opinión nos ayuda a mejorar
          </p>
        </div>
        
        <p style="font-size: 14px; color: #888888; margin-top: 20px;">
          Esperamos verte pronto nuevamente. ¡Agenda tu próxima cita!
        </p>
        
        <p style="font-size: 16px; color: #00f0ff; margin-top: 30px;">
          ¡Hasta la próxima!<br>
          <strong style="color: #ffd700;">Tu Barbería</strong>
        </p>
      </div>
    </div>
  `;
}

/**
 * Send invoice email
 */
export async function sendInvoiceEmail(invoice: any): Promise<boolean> {
  try {
    // Parse items if they come as JSON string, or use directly if already parsed
    let items = [];
    if (invoice.items) {
      if (typeof invoice.items === 'string') {
        items = JSON.parse(invoice.items);
      } else if (Array.isArray(invoice.items)) {
        items = invoice.items;
      } else if (typeof invoice.items === 'object') {
        // Prisma Json type might return as object
        items = Array.isArray(invoice.items) ? invoice.items : [];
      }
    }
    
    const itemsHtml = items.length > 0 ? items.map((item: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #333;">${item.description || 'Sin descripción'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #333; text-align: center;">${item.quantity || 1}</td>
        <td style="padding: 10px; border-bottom: 1px solid #333; text-align: right;">$${(item.price || 0).toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #333; text-align: right;">$${((item.quantity || 1) * (item.price || 0)).toFixed(2)}</td>
      </tr>
    `).join('') : '';

  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #1a1a1a; color: #ffffff;">
      <div style="background: linear-gradient(135deg, #00f0ff 0%, #0066cc 100%); padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Factura</h1>
        <p style="color: #ffffff; margin: 10px 0 0 0;">${invoice.invoiceNumber}</p>
      </div>
      
      <div style="padding: 30px;">
        <div style="margin-bottom: 30px;">
          <h3 style="color: #00f0ff; margin-bottom: 10px;">De:</h3>
          <p style="margin: 5px 0;"><strong>${invoice.issuerName}</strong></p>
          ${invoice.issuerAddress ? `<p style="margin: 5px 0;">${invoice.issuerAddress}</p>` : ''}
          ${invoice.issuerPhone ? `<p style="margin: 5px 0;">Tel: ${invoice.issuerPhone}</p>` : ''}
          ${invoice.issuerEmail ? `<p style="margin: 5px 0;">Email: ${invoice.issuerEmail}</p>` : ''}
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="color: #00f0ff; margin-bottom: 10px;">Para:</h3>
          <p style="margin: 5px 0;"><strong>${invoice.recipientName}</strong></p>
          <p style="margin: 5px 0;">${invoice.recipientEmail}</p>
          ${invoice.recipientPhone ? `<p style="margin: 5px 0;">Tel: ${invoice.recipientPhone}</p>` : ''}
        </div>

        <div style="margin-bottom: 20px;">
          <p style="margin: 5px 0;"><strong>Fecha de emisión:</strong> ${new Date(invoice.issueDate).toLocaleDateString('es-ES')}</p>
          ${invoice.dueDate ? `<p style="margin: 5px 0;"><strong>Fecha de vencimiento:</strong> ${new Date(invoice.dueDate).toLocaleDateString('es-ES')}</p>` : ''}
        </div>

        <div style="margin-bottom: 20px;">
          <p style="margin: 5px 0;"><strong>Descripción:</strong></p>
          <p style="margin: 10px 0; padding: 15px; background-color: #2a2a2a; border-radius: 5px;">${invoice.description}</p>
        </div>

        ${items.length > 0 ? `
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #2a2a2a;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #00f0ff;">Descripción</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #00f0ff;">Cantidad</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #00f0ff;">Precio Unit.</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #00f0ff;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        ` : ''}

        <div style="margin-top: 30px; padding: 20px; background-color: #2a2a2a; border-radius: 5px; text-align: right;">
          <p style="font-size: 24px; color: #00f0ff; margin: 0;">
            <strong>Total: $${(invoice.amount || 0).toFixed(2)}</strong>
          </p>
        </div>

        <p style="font-size: 14px; color: #888888; margin-top: 30px; text-align: center;">
          Gracias por su preferencia.
        </p>
        
        <p style="font-size: 16px; color: #00f0ff; margin-top: 20px; text-align: center;">
          <strong style="color: #ffd700;">${invoice.issuerName || 'BookMe'}</strong>
        </p>
      </div>
    </div>
  `;

    return await sendEmail({
      to: invoice.recipientEmail,
      subject: `Factura ${invoice.invoiceNumber} - ${invoice.issuerName}`,
      body: emailBody,
    });
  } catch (error) {
    console.error('Error sending invoice email:', error);
    return false;
  }
}
