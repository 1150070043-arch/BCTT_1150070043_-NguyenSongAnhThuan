namespace WebsiteServiceEcommerce.API.Models
{
    public class UserAddress
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Label { get; set; } = string.Empty;
        public string RecipientName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string AddressLine { get; set; } = string.Empty;
        public bool IsDefault { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public User User { get; set; } = null!;
    }
}
