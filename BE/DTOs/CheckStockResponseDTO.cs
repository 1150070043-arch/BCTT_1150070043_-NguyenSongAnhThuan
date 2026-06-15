namespace WebsiteServiceEcommerce.API.DTOs
{
    public class CheckStockResponseDTO
    {
        public int ProductId { get; set; }
        public bool IsEnough { get; set; }
        public int MissingQuantity { get; set; }
    }
}
