namespace WebsiteServiceEcommerce.API.Models
{
    public class ProjectDelivery
    {
        public int Id { get; set; }
        public int OrderId { get; set; }
        public string PreviewLink { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
        public string SourceFiles { get; set; } = string.Empty; // JSON array of file URLs
        public string Status { get; set; } = "Submitted"; // Submitted, Approved, RevisionRequested
        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ReviewedAt { get; set; }

        // Navigation properties
        public Order Order { get; set; } = null!;
    }
}
