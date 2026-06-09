namespace WebsiteServiceEcommerce.API.DTOs
{
    public class CreateDeliveryDto
    {
        public int OrderId { get; set; }
        public string DeliveryNote { get; set; } = string.Empty;
        public string PreviewUrl { get; set; } = string.Empty;
        public string SourceFileUrl { get; set; } = string.Empty;
    }
}
