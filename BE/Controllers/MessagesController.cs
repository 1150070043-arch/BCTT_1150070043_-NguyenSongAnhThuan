using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WebsiteServiceEcommerce.API.Data;
using WebsiteServiceEcommerce.API.DTOs;
using WebsiteServiceEcommerce.API.Models;

namespace WebsiteServiceEcommerce.API.Controllers
{
    [Route("api/messages")]
    [ApiController]
    [Authorize]
    public class MessagesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public MessagesController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("order/{orderId}")]
        public async Task<ActionResult<ApiResponse<List<object>>>> GetOrderMessages(int orderId)
        {
            var order = await _context.Orders.FindAsync(orderId);
            if (order == null)
            {
                return NotFound(new ApiResponse<List<object>> { Success = false, Message = "Không tìm thấy đơn hàng." });
            }

            if (!CanAccessOrder(order))
            {
                return Forbid();
            }

            var messages = await _context.Messages
                .Include(m => m.Sender)
                .Where(m => m.OrderId == orderId)
                .OrderBy(m => m.CreatedAt)
                .Select(m => new
                {
                    m.Id,
                    m.OrderId,
                    m.SenderId,
                    SenderName = m.Sender.FullName,
                    SenderRole = m.Sender.Role,
                    m.Content,
                    m.CreatedAt
                })
                .Cast<object>()
                .ToListAsync();

            return Ok(new ApiResponse<List<object>>
            {
                Success = true,
                Message = "Lấy tin nhắn thành công.",
                Data = messages
            });
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<object>>> CreateMessage(CreateMessageDto dto)
        {
            var senderId = GetUserId();
            if (senderId == null)
            {
                return Unauthorized(new ApiResponse<object> { Success = false, Message = "Token không hợp lệ." });
            }

            var order = await _context.Orders
                .Include(o => o.Provider)
                .FirstOrDefaultAsync(o => o.Id == dto.OrderId);
            if (order == null)
            {
                return NotFound(new ApiResponse<object> { Success = false, Message = "Không tìm thấy đơn hàng." });
            }

            if (!CanAccessOrder(order))
            {
                return Forbid();
            }

            if (string.IsNullOrWhiteSpace(dto.Content))
            {
                return BadRequest(new ApiResponse<object> { Success = false, Message = "Nội dung tin nhắn không được để trống." });
            }

            var message = new Message
            {
                OrderId = order.Id,
                SenderId = senderId.Value,
                Content = dto.Content,
                CreatedAt = DateTime.UtcNow
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Gửi tin nhắn thành công.",
                Data = new { message.Id, message.OrderId, message.SenderId, message.Content, message.CreatedAt }
            });
        }

        private bool CanAccessOrder(Order order)
        {
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            if (role == "Admin") return true;

            var userId = GetUserId();
            if (role == "Customer") return userId == order.CustomerId;

            var providerId = GetProviderId();
            return role == "Provider" && providerId == order.ProviderId;
        }

        private int? GetUserId()
        {
            var value = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(value, out var id) ? id : null;
        }

        private int? GetProviderId()
        {
            var value = User.FindFirst("ProviderId")?.Value;
            return int.TryParse(value, out var id) ? id : null;
        }
    }
}
