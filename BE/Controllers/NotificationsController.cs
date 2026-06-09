using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WebsiteServiceEcommerce.API.Data;
using WebsiteServiceEcommerce.API.DTOs;

namespace WebsiteServiceEcommerce.API.Controllers
{
    [Route("api/notifications")]
    [ApiController]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public NotificationsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<object>>>> GetNotifications()
        {
            var userId = GetUserId();
            if (userId == null)
            {
                return Unauthorized(new ApiResponse<List<object>> { Success = false, Message = "Token không hợp lệ." });
            }

            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId.Value)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new
                {
                    n.Id,
                    n.Title,
                    n.Content,
                    n.IsRead,
                    n.CreatedAt
                })
                .Cast<object>()
                .ToListAsync();

            return Ok(new ApiResponse<List<object>>
            {
                Success = true,
                Message = "Lấy thông báo thành công.",
                Data = notifications
            });
        }

        [HttpPut("{id}/read")]
        public async Task<ActionResult<ApiResponse<object>>> MarkAsRead(int id)
        {
            var userId = GetUserId();
            if (userId == null)
            {
                return Unauthorized(new ApiResponse<object> { Success = false, Message = "Token không hợp lệ." });
            }

            var notification = await _context.Notifications.FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId.Value);
            if (notification == null)
            {
                return NotFound(new ApiResponse<object> { Success = false, Message = "Không tìm thấy thông báo." });
            }

            notification.IsRead = true;
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object> { Success = true, Message = "Đã đánh dấu thông báo là đã đọc." });
        }

        private int? GetUserId()
        {
            var value = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(value, out var id) ? id : null;
        }
    }
}
