namespace WebsiteServiceEcommerce.API.Models
{
    public class OrderItem
    {
        public int Id { get; set; }
        public int OrderId { get; set; }
        public int PackageId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal LineTotal { get; set; }

        public Order Order { get; set; } = null!;
        public Package Package { get; set; } = null!;
    }
}
