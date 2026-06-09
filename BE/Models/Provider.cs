namespace WebsiteServiceEcommerce.API.Models
{
    public class Provider
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Skills { get; set; } = string.Empty; // JSON array stored as string
        public decimal Rating { get; set; } = 0;
        public int CompletedProjects { get; set; } = 0;
        public bool IsVerified { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public User User { get; set; } = null!;
        public ICollection<Package> Packages { get; set; } = new List<Package>();
        public ICollection<Order> Orders { get; set; } = new List<Order>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
    }
}
