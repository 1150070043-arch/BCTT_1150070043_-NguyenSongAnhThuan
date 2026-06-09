namespace WebsiteServiceEcommerce.API.Models
{
    public class Message
    {
        public int Id { get; set; }
        public int OrderId { get; set; }
        public int SenderId { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Order Order { get; set; } = null!;
        public User Sender { get; set; } = null!;
    }
}
