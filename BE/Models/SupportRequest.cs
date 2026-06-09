namespace WebsiteServiceEcommerce.API.Models
{
    public class SupportRequest
    {
        public int Id { get; set; }
        public int OrderId { get; set; }
        public int CustomerId { get; set; }
        public string RequestType { get; set; } = "Support";
        public string Reason { get; set; } = string.Empty;
        public string RequestedResolution { get; set; } = string.Empty;
        public string Status { get; set; } = "Open";
        public string AdminNote { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public DateTime? ResolvedAt { get; set; }

        public Order Order { get; set; } = null!;
        public User Customer { get; set; } = null!;
    }
}
