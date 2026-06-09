namespace WebsiteServiceEcommerce.API.DTOs
{
    public class PackageDto
    {
        public int Id { get; set; }
        public int ProviderId { get; set; }
        public string ProviderName { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string Category { get; set; } = string.Empty;
        public int DeliveryDays { get; set; }
        public int Revisions { get; set; }
        public List<string> Features { get; set; } = new List<string>();
        public string Sku { get; set; } = string.Empty;
        public string Unit { get; set; } = string.Empty;
        public int StockQuantity { get; set; }
        public string ShortDescription { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public bool IsFeatured { get; set; }
        public bool IsActive { get; set; }
        public bool IsApproved { get; set; }
        public decimal ProviderRating { get; set; }
        public int ProviderCompletedProjects { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<ProductImageDto> Images { get; set; } = new List<ProductImageDto>();
    }
}
