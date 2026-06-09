namespace WebsiteServiceEcommerce.API.DTOs
{
    public class UpdateDeliveryAssignmentDto
    {
        public string AssignedStaffName { get; set; } = string.Empty;
        public string DeliveryRoute { get; set; } = string.Empty;
        public string TrackingCode { get; set; } = string.Empty;
        public DateTime? EstimatedDeliveryAt { get; set; }
        public string DeliveryNote { get; set; } = string.Empty;
    }
}
