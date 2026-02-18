/**
 * Módulo de envio de e-mails via AWS SES (Simple Email Service).
 * Requer as seguintes variáveis de ambiente:
 *   - AWS_REGION (ex: us-east-1)
 *   - AWS_SES_FROM_EMAIL: endereço remetente verificado no SES (ex: noreply@seudominio.com)
 *   - AWS_ACCESS_KEY_ID e AWS_SECRET_ACCESS_KEY (ou IAM Role na EC2)
 *
 * Caso o SES não esteja configurado, o envio é ignorado com log de aviso.
 */

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Envia um e-mail via AWS SES.
 * Retorna true em caso de sucesso, false caso SES não esteja configurado ou ocorra erro.
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const fromEmail = process.env.AWS_SES_FROM_EMAIL;
  const region = process.env.AWS_REGION || 'us-east-1';

  if (!fromEmail) {
    console.warn('[Email] AWS_SES_FROM_EMAIL não configurado. E-mail não enviado:', options.subject);
    return false;
  }

  try {
    // Import dinâmico para não impactar bundle se SES não for usado
    const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');

    const client = new SESClient({ region });

    const command = new SendEmailCommand({
      Source: fromEmail,
      Destination: {
        ToAddresses: [options.to],
      },
      Message: {
        Subject: {
          Data: options.subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: options.html,
            Charset: 'UTF-8',
          },
          ...(options.text
            ? {
                Text: {
                  Data: options.text,
                  Charset: 'UTF-8',
                },
              }
            : {}),
        },
      },
    });

    await client.send(command);
    return true;
  } catch (error) {
    console.error('[Email] Erro ao enviar e-mail:', error);
    return false;
  }
}

/**
 * Gera o HTML do e-mail de aniversário para o líder.
 */
export function buildBirthdayEmailHtml(params: {
  leaderName: string;
  memberName: string;
  memberPhone: string | null;
  groupName: string;
}): string {
  const whatsappUrl = params.memberPhone
    ? `https://wa.me/55${params.memberPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${params.memberName}! Feliz aniversário! 🎉`)}`
    : null;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px; color: #333;">
  <div style="max-width: 500px; margin: 0 auto; background: #fff; border-radius: 8px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <h2 style="color: #7c3aed; margin-bottom: 8px;">🎂 Aniversário hoje!</h2>
    <p style="margin-bottom: 16px;">Olá, <strong>${params.leaderName}</strong>!</p>
    <p>Hoje é aniversário de <strong>${params.memberName}</strong> do grupo <em>${params.groupName}</em>.</p>
    <p style="margin-top: 8px; color: #666;">Aproveite para enviar uma mensagem de parabéns!</p>
    ${
      whatsappUrl
        ? `<a href="${whatsappUrl}" style="display: inline-block; margin-top: 20px; background: #25D366; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold;">
            💬 Parabenizar pelo WhatsApp
          </a>`
        : ''
    }
    <hr style="margin: 28px 0; border: none; border-top: 1px solid #eee;">
    <p style="font-size: 12px; color: #999;">Pequenos Grupos — notificação automática</p>
  </div>
</body>
</html>
  `.trim();
}
