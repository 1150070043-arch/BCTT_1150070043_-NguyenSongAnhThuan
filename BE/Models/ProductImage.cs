namespace WebsiteServiceEcommerce.API.Models
{
    public class ProductImage
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public int SortOrder { get; set; }
        public bool IsPrimary { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Package Product { get; set; } = null!;
    }
}
