namespace WebsiteServiceEcommerce.API.Models
{
    public class Order
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public int ProviderId { get; set; }
        public int PackageId { get; set; }
        public string Status { get; set; } = "Pending";
        public decimal TotalPrice { get; set; }
        public string Requirements { get; set; } = string.Empty;
        public string ShippingName { get; set; } = string.Empty;
        public string ShippingPhone { get; set; } = string.Empty;
        public string ShippingAddress { get; set; } = string.Empty;
        public string DeliveryMethod { get; set; } = "Standard";
        public string AssignedStaffName { get; set; } = string.Empty;
        public string DeliveryRoute { get; set; } = string.Empty;
        public string TrackingCode { get; set; } = string.Empty;
        public DateTime? EstimatedDeliveryAt { get; set; }
        public string DeliveryNote { get; set; } = string.Empty;
        public string DeliveryProofImageUrl { get; set; } = string.Empty;
        public string DeliveryFailureReason { get; set; } = string.Empty;
        public string ClientOrderKey { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }

        // Navigation properties
        public User Customer { get; set; } = null!;
        public Provider Provider { get; set; } = null!;
        public Package Package { get; set; } = null!;
        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
        public ICollection<ProjectDelivery> ProjectDeliveries { get; set; } = new List<ProjectDelivery>();
        public ICollection<OrderStatusHistory> StatusHistories { get; set; } = new List<OrderStatusHistory>();
        public ICollection<InventoryTransaction> InventoryTransactions { get; set; } = new List<InventoryTransaction>();
        public ICollection<SupportRequest> SupportRequests { get; set; } = new List<SupportRequest>();
        public Review? Review { get; set; }
    }
}
