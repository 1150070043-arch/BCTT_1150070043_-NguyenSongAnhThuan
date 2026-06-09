namespace WebsiteServiceEcommerce.API.DTOs
{
    public class CreateMessageDto
    {
        public int OrderId { get; set; }
        public string Content { get; set; } = string.Empty;
    }
}
