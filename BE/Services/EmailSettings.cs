namespace WebsiteServiceEcommerce.API.Services
{
    public class EmailSettings
    {
        public string SmtpHost { get; set; } = "smtp.gmail.com";
        public int SmtpPort { get; set; } = 587;
        public string SenderEmail { get; set; } = string.Empty;
        public string SmtpUser { get; set; } = string.Empty;
        public string AppPassword { get; set; } = string.Empty;
        public string FromName { get; set; } = "Ngoc Anh Phu Thinh 9";
    }
}
