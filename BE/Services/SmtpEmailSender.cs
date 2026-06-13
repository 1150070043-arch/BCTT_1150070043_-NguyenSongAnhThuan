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
                ? _settings.SmtpUser?.Trim()
                : _settings.SenderEmail.Trim();
            var smtpUser = string.IsNullOrWhiteSpace(_settings.SmtpUser)
                ? senderEmail
                : _settings.SmtpUser.Trim();
            var appPassword = (_settings.AppPassword ?? string.Empty).Replace(" ", "");

            if (string.IsNullOrWhiteSpace(senderEmail) ||
                string.IsNullOrWhiteSpace(smtpUser) ||
                string.IsNullOrWhiteSpace(appPassword))
            {
                throw new InvalidOperationException("Chua cau hinh EmailSettings:SenderEmail/SmtpUser hoac EmailSettings:AppPassword.");
            }

            if (!MailAddress.TryCreate(senderEmail, out var senderAddress))
            {
                throw new InvalidOperationException("EmailSettings:SenderEmail phai la dia chi email hop le, vi du ten@gmail.com.");
            }

            if (!MailAddress.TryCreate(toEmail, out var recipientAddress))
            {
                throw new InvalidOperationException("Email nhan ma khoi phuc khong hop le.");
            }

            using var message = new MailMessage
            {
                From = new MailAddress(senderAddress.Address, _settings.FromName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };
            message.To.Add(recipientAddress);

            using var client = new SmtpClient(_settings.SmtpHost, _settings.SmtpPort)
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(smtpUser, appPassword)
            };

            await client.SendMailAsync(message);
        }
    }
}
