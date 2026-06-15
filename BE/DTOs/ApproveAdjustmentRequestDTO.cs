using System.ComponentModel.DataAnnotations;

namespace WebsiteServiceEcommerce.API.DTOs
{
    public class ApproveAdjustmentRequestDTO
    {
        [Required(ErrorMessage = "RequestId is required")]
        [Range(1, int.MaxValue, ErrorMessage = "RequestId must be greater than 0")]
        public int RequestId { get; set; }

        [Required(ErrorMessage = "AdminSignature is required")]
        [StringLength(255, ErrorMessage = "AdminSignature cannot exceed 255 characters")]
        public string AdminSignature { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "AdminNote cannot exceed 500 characters")]
        public string AdminNote { get; set; } = string.Empty;
    }
}
