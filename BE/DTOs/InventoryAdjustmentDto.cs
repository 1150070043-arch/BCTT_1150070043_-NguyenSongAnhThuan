namespace WebsiteServiceEcommerce.API.DTOs
{
    public class InventoryAdjustmentDto
    {
        public int ProductId { get; set; }
        public string MovementType { get; set; } = "StockIn";
        public int Quantity { get; set; }
        public string Reason { get; set; } = string.Empty;
    }
}
