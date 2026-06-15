using System.ComponentModel.DataAnnotations;

namespace WebsiteServiceEcommerce.API.DTOs
{
    public class CheckStockRequestDTO
    {
        [Required(ErrorMessage = "ProductId is required")]
        [Range(1, int.MaxValue, ErrorMessage = "ProductId must be greater than 0")]
        public int ProductId { get; set; }

        [Required(ErrorMessage = "RequiredQuantity is required")]
        [Range(1, int.MaxValue, ErrorMessage = "RequiredQuantity must be greater than 0")]
        public int RequiredQuantity { get; set; }
    }
}
