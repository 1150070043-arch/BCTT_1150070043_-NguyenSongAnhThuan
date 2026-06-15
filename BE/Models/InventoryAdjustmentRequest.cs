namespace WebsiteServiceEcommerce.API.Models
{
    public class InventoryAdjustmentRequest
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public int ProviderId { get; set; }
        public int RequestedByUserId { get; set; }
        public int? ReviewedByUserId { get; set; }
        public string MovementType { get; set; } = "StockIn";
        public int Quantity { get; set; }
        public int StockBefore { get; set; }
        public int? StockAfter { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending";
        public string AdminSignature { get; set; } = string.Empty;
        public string AdminNote { get; set; } = string.Empty;
        public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ReviewedAt { get; set; }

        public Package Product { get; set; } = null!;
        public Provider Provider { get; set; } = null!;
        public User RequestedByUser { get; set; } = null!;
        public User? ReviewedByUser { get; set; }
    }
}
