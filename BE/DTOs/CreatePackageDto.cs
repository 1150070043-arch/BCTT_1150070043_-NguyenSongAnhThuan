namespace WebsiteServiceEcommerce.API.DTOs
{
    public class CreatePackageDto
    {
        public int? ProviderId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string Category { get; set; } = string.Empty;
        public int DeliveryDays { get; set; }
        public int Revisions { get; set; } = 1;
        public List<string> Features { get; set; } = new List<string>();
        public string Sku { get; set; } = string.Empty;
        public string Unit { get; set; } = string.Empty;
        public int StockQuantity { get; set; }
        public string ShortDescription { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public bool IsFeatured { get; set; }
    }
}
