namespace WebsiteServiceEcommerce.API.Models
{
    public class Package
    {
        public int Id { get; set; }
        public int ProviderId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string Category { get; set; } = string.Empty;
        public int DeliveryDays { get; set; }
        public int Revisions { get; set; } = 1;
        public string Features { get; set; } = string.Empty;
        public string Sku { get; set; } = string.Empty;
        public string Unit { get; set; } = string.Empty;
        public int StockQuantity { get; set; }
        public string ShortDescription { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public bool IsFeatured { get; set; }
        public bool IsActive { get; set; } = true;
        public bool IsApproved { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public Provider Provider { get; set; } = null!;
        public ICollection<Order> Orders { get; set; } = new List<Order>();
        public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
        public ICollection<InventoryTransaction> InventoryTransactions { get; set; } = new List<InventoryTransaction>();
    }
}
