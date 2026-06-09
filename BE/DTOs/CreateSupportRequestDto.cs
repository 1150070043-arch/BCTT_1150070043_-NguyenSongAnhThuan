namespace WebsiteServiceEcommerce.API.DTOs
{
    public class CreateSupportRequestDto
    {
        public string RequestType { get; set; } = "Support";
        public string Reason { get; set; } = string.Empty;
        public string RequestedResolution { get; set; } = string.Empty;
    }
}
