namespace WebsiteServiceEcommerce.API.DTOs
{
    public class CreateReviewDto
    {
        public int OrderId { get; set; }
        public int Rating { get; set; }
        public string Comment { get; set; } = string.Empty;
    }
}
