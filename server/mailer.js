import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendLeadNotification(lead) {
  const { nombre, email, telefono, plan, mensaje } = lead;

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nueva Solicitud Pulso.app</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #000000; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #000000;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 12px; overflow: hidden; border-top: 4px solid #39FF14;">
              
              <!-- Header Section -->
              <tr>
                <td style="padding: 50px 40px 30px 40px; text-align: left;">
                  <div style="font-size: 1rem; font-weight: 800; letter-spacing: 0.15em; color: #ffffff; margin-bottom: 30px; line-height: 1;">
                    PULSO<span style="color: #39FF14;">.</span>APP
                  </div>
                  <div style="display: inline-block; background-color: rgba(57, 255, 20, 0.1); color: #39FF14; font-size: 10px; font-weight: 800; letter-spacing: 0.2em; padding: 8px 16px; border-radius: 4px; border: 1px solid rgba(57, 255, 20, 0.2); text-transform: uppercase; margin-bottom: 24px;">
                    Lead de Élite Detectado
                  </div>
                  <h1 style="margin: 0; font-size: 2.2rem; font-weight: 900; color: #ffffff; line-height: 1.1; letter-spacing: -0.02em;">
                    HAY UNA NUEVA<br/><span style="color: #39FF14;">OPORTUNIDAD.</span>
                  </h1>
                </td>
              </tr>

              <!-- Details Section -->
              <tr>
                <td style="padding: 0 40px 40px 40px;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="padding: 24px; background-color: #0f0f0f; border-radius: 8px; border-left: 3px solid #39FF14;">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                          <tr>
                            <td style="padding-bottom: 24px;">
                              <div style="font-size: 10px; color: #666; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px;">INTERESADO</div>
                              <div style="font-size: 1.1rem; color: #ffffff; font-weight: 600;">${nombre}</div>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding-bottom: 24px;">
                              <div style="font-size: 10px; color: #666; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px;">CANAL DE CONTACTO</div>
                              <div style="font-size: 1rem; color: #39FF14; font-weight: 500;">${email}</div>
                              ${telefono ? `<div style="font-size: 0.9rem; color: #999; margin-top: 4px;">${telefono}</div>` : ''}
                            </td>
                          </tr>
                          <tr>
                            <td style="padding-bottom: 0;">
                              <div style="font-size: 10px; color: #666; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px;">PLAN SELECCIONADO</div>
                              <div style="font-size: 1rem; color: #ffffff; font-weight: 200; opacity: 0.9;">${plan || 'Por definir'}</div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Message Section -->
              ${mensaje ? `
              <tr>
                <td style="padding: 0 40px 40px 40px;">
                  <div style="font-size: 10px; color: #666; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px;">RESUMEN DEL PROYECTO</div>
                  <div style="padding: 20px; background-color: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 8px; font-size: 0.95rem; line-height: 1.6; color: #bbbbbb; font-style: italic;">
                    "${mensaje}"
                  </div>
                </td>
              </tr>` : ''}

              <!-- CTA Row -->
              <tr>
                <td style="padding: 0 40px 60px 40px; text-align: center;">
                  <a href="https://pulso.app/admin" style="display: block; background-color: #39FF14; color: #000000; text-decoration: none; padding: 18px 40px; border-radius: 4px; font-weight: 900; font-size: 0.85rem; letter-spacing: 0.1em; text-transform: uppercase;">
                    Ver detalles en el CRM →
                  </a>
                </td>
              </tr>

            </table>

            <!-- Email Footer -->
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin-top: 30px;">
              <tr>
                <td style="text-align: center; color: #444444; font-size: 11px; line-height: 1.6; letter-spacing: 0.05em;">
                  Este es un mensaje automático del Motor de Ingeniería de Pulso.app<br/>
                  &copy; 2026 Pulso.app — Catamarca, Argentina.<br/>
                  SISTEMAS CON PULSO PROPIO.
                </td>
              </tr>
            </table>

          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"Pulso.app CRM" <${process.env.GMAIL_USER}>`,
    to: process.env.GMAIL_USER,
    subject: `[Pulso.app] Nueva solicitud — ${nombre} (${plan || 'sin plan'})`,
    html,
  });
}
