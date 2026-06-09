using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using WebsiteServiceEcommerce.API.Data;
using WebsiteServiceEcommerce.API.DTOs;
using WebsiteServiceEcommerce.API.Helpers;
using WebsiteServiceEcommerce.API.Models;

namespace WebsiteServiceEcommerce.API.Controllers
{
    [Route("api/project-deliveries")]
    [ApiController]
    [Authorize(Roles = "Provider")]
    public class ProjectDeliveriesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProjectDeliveriesController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<object>>> SubmitDelivery(CreateDeliveryDto dto)
        {
            var providerId = GetProviderId();
            if (providerId == null)
            {
                return Unauthorized(new ApiResponse<object> { Success = false, Message = "Không tìm thấy thông tin kho vận." });
            }

            var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == dto.OrderId);
            if (order == null)
            {
                return NotFound(new ApiResponse<object> { Success = false, Message = "Không tìm thấy đơn hàng." });
            }

            if (order.ProviderId != providerId.Value)
            {
                return Forbid();
            }

            if (!OrderWorkflow.CanSubmitDeliveryUpdate(order.Status))
            {
                return BadRequest(new ApiResponse<object> { Success = false, Message = "Don hang da dong, khong the cap nhat giao hang." });
            }

            if (string.IsNullOrWhiteSpace(dto.PreviewUrl))
            {
                return BadRequest(new ApiResponse<object> { Success = false, Message = "Vui lòng nhập mã vận đơn hoặc link theo dõi." });
            }

            var attachments = string.IsNullOrWhiteSpace(dto.SourceFileUrl)
                ? Array.Empty<string>()
                : new[] { dto.SourceFileUrl.Trim() };

            var delivery = new ProjectDelivery
            {
                OrderId = order.Id,
                PreviewLink = dto.PreviewUrl.Trim(),
                Notes = dto.DeliveryNote?.Trim() ?? string.Empty,
                SourceFiles = JsonSerializer.Serialize(attachments),
                Status = "Submitted",
                SubmittedAt = DateTime.UtcNow
            };

            var previousStatus = OrderWorkflow.Normalize(order.Status);
            order.Status = OrderWorkflow.Shipping;
            order.TrackingCode = dto.PreviewUrl.Trim();
            order.DeliveryProofImageUrl = dto.SourceFileUrl?.Trim() ?? string.Empty;
            order.DeliveryNote = dto.DeliveryNote?.Trim() ?? string.Empty;
            order.DeliveryFailureReason = string.Empty;
            order.UpdatedAt = DateTime.UtcNow;

            _context.ProjectDeliveries.Add(delivery);
            if (previousStatus != OrderWorkflow.Shipping)
            {
                _context.OrderStatusHistories.Add(new OrderStatusHistory
                {
                    OrderId = order.Id,
                    FromStatus = previousStatus,
                    ToStatus = OrderWorkflow.Shipping,
                    ChangedByUserId = GetUserId(),
                    ChangedByRole = "Provider",
                    Note = "Kho van cap nhat ma van don/link theo doi.",
                    CreatedAt = DateTime.UtcNow
                });
            }
            _context.Notifications.Add(new Notification
            {
                UserId = order.CustomerId,
                Title = "Đơn hàng đang được giao",
                Content = $"Đơn hàng #{order.Id} đã có cập nhật giao hàng mới.",
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Cập nhật giao hàng thành công.",
                Data = new
                {
                    delivery.Id,
                    delivery.OrderId,
                    delivery.PreviewLink,
                    delivery.Notes,
                    delivery.SourceFiles,
                    delivery.Status,
                    delivery.SubmittedAt
                }
            });
        }

        private int? GetProviderId()
        {
            var value = User.FindFirst("ProviderId")?.Value;
            return int.TryParse(value, out var id) ? id : null;
        }

        private int? GetUserId()
        {
            var value = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(value, out var id) ? id : null;
        }
    }
}
