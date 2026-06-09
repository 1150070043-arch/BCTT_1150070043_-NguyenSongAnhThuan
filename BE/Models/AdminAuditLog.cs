namespace WebsiteServiceEcommerce.API.Models
{
    public class AdminAuditLog
    {
        public int Id { get; set; }
        public int? AdminUserId { get; set; }
        public string AdminName { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string EntityType { get; set; } = string.Empty;
        public int? EntityId { get; set; }
        public string Summary { get; set; } = string.Empty;
        public string MetadataJson { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public User? AdminUser { get; set; }
    }
}
