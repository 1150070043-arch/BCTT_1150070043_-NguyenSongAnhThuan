namespace WebsiteServiceEcommerce.API.DTOs
{
    public class UserAddressDto
    {
        public string Label { get; set; } = string.Empty;
        public string RecipientName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string AddressLine { get; set; } = string.Empty;
        public bool IsDefault { get; set; }
    }
}
