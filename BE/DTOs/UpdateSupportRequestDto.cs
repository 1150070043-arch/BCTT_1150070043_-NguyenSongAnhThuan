namespace WebsiteServiceEcommerce.API.DTOs
{
    public class UpdateSupportRequestDto
    {
        public string Status { get; set; } = "InProgress";
        public string AdminNote { get; set; } = string.Empty;
    }
}
