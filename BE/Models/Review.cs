namespace WebsiteServiceEcommerce.API.Models
{
    public class Review
    {
        public int Id { get; set; }
        public int OrderId { get; set; }
        public int CustomerId { get; set; }
        public int ProviderId { get; set; }
        public int Rating { get; set; } // 1-5
        public string Comment { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Order Order { get; set; } = null!;
        public User Customer { get; set; } = null!;
        public Provider Provider { get; set; } = null!;
    }
}
