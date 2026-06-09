namespace WebsiteServiceEcommerce.API.DTOs
{
    public class CreateOrderDto
    {
        public int PackageId { get; set; }
        public string Requirement { get; set; } = string.Empty;
        public int Quantity { get; set; } = 1;
        public string ShippingName { get; set; } = string.Empty;
        public string ShippingPhone { get; set; } = string.Empty;
        public string ShippingAddress { get; set; } = string.Empty;
        public string DeliveryMethod { get; set; } = "Standard";
        public string PaymentMethod { get; set; } = "MockWallet";
        public string TransferReference { get; set; } = string.Empty;
        public string PaymentNote { get; set; } = string.Empty;
        public string ClientOrderKey { get; set; } = string.Empty;
    }
}
