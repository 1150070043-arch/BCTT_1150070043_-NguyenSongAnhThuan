namespace WebsiteServiceEcommerce.API.Models
{
    public class OrderStatusHistory
    {
        public int Id { get; set; }
        public int OrderId { get; set; }
        public string FromStatus { get; set; } = string.Empty;
        public string ToStatus { get; set; } = string.Empty;
        public int? ChangedByUserId { get; set; }
        public string ChangedByRole { get; set; } = string.Empty;
        public string Note { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Order Order { get; set; } = null!;
        public User? ChangedByUser { get; set; }
    }
}
