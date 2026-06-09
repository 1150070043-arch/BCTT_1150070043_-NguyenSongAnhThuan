namespace WebsiteServiceEcommerce.API.Models
{
    public class InventoryTransaction
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public int? OrderId { get; set; }
        public int QuantityChange { get; set; }
        public int BalanceAfter { get; set; }
        public string TransactionType { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public int? CreatedByUserId { get; set; }
        public string CreatedByRole { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Package Product { get; set; } = null!;
        public Order? Order { get; set; }
        public User? CreatedByUser { get; set; }
    }
}
