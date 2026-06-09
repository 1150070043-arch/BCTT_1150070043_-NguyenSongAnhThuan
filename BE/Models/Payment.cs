namespace WebsiteServiceEcommerce.API.Models
{
    public class Payment
    {
        public int Id { get; set; }
        public int OrderId { get; set; }
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = "Mock";
        public string PaymentStatus { get; set; } = "Pending";
        public string TransferReference { get; set; } = string.Empty;
        public string PaymentNote { get; set; } = string.Empty;
        public DateTime? PaidAt { get; set; }
        public DateTime? ConfirmedAt { get; set; }
        public int? ConfirmedByUserId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Order Order { get; set; } = null!;
        public User? ConfirmedByUser { get; set; }
    }
}
