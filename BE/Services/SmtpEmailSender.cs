using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Options;

namespace WebsiteServiceEcommerce.API.Services
{
    public class SmtpEmailSender : IEmailSender
    {
        private readonly EmailSettings _settings;

        public SmtpEmailSender(IOptions<EmailSettings> options)
        {
            _settings = options.Value;
        }

        public async Task SendAsync(string toEmail, string subject, string htmlBody)
        {
            var senderEmail = string.IsNullOrWhiteSpace(_settings.SenderEmail)
                ? _settings.SmtpUser
                : _settings.SenderEmail;
            var appPassword = _settings.AppPassword.Replace(" ", "");

            if (string.IsNullOrWhiteSpace(senderEmail) ||
                string.IsNullOrWhiteSpace(appPassword))
            {
                throw new InvalidOperationException("Chưa cấu hình EmailSettings:SenderEmail hoặc EmailSettings:AppPassword.");
            }

            using var message = new MailMessage
            {
                From = new MailAddress(senderEmail, _settings.FromName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };
            message.To.Add(toEmail);

            using var client = new SmtpClient(_settings.SmtpHost, _settings.SmtpPort)
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(senderEmail, appPassword)
            };

            await client.SendMailAsync(message);
        }
    }
}
