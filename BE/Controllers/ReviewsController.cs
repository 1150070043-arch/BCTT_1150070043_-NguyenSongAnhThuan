using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebsiteServiceEcommerce.API.Data;
using WebsiteServiceEcommerce.API.DTOs;
using WebsiteServiceEcommerce.API.Helpers;
using WebsiteServiceEcommerce.API.Models;

namespace WebsiteServiceEcommerce.API.Controllers
{
    [Route("api/reviews")]
    [ApiController]
    public class ReviewsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ReviewsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [Authorize(Roles = "Customer")]
        [HttpPost]
        public async Task<ActionResult<ApiResponse<object>>> CreateReview(CreateReviewDto dto)
        {
            var customerId = GetUserId();
            if (customerId == null)
            {
                return Unauthorized(new ApiResponse<object> { Success = false, Message = "Token không hợp lệ." });
            }

            if (dto.Rating < 1 || dto.Rating > 5)
            {
                return BadRequest(new ApiResponse<object> { Success = false, Message = "Rating phải từ 1 đến 5." });
            }

            var order = await _context.Orders
                .Include(o => o.Review)
                .FirstOrDefaultAsync(o => o.Id == dto.OrderId);

            if (order == null)
            {
                return NotFound(new ApiResponse<object> { Success = false, Message = "Không tìm thấy đơn hàng." });
            }

            if (order.CustomerId != customerId.Value)
            {
                return Forbid();
            }

            if (order.Review != null)
            {
                return BadRequest(new ApiResponse<object> { Success = false, Message = "Đơn hàng này đã được đánh giá." });
            }

            if (OrderWorkflow.Normalize(order.Status) != OrderWorkflow.Completed)
            {
                return BadRequest(new ApiResponse<object> { Success = false, Message = "Chi duoc danh gia sau khi don hang hoan tat." });
            }

            var review = new Review
            {
                OrderId = order.Id,
                CustomerId = order.CustomerId,
                ProviderId = order.ProviderId,
                Rating = dto.Rating,
                Comment = dto.Comment,
                CreatedAt = DateTime.UtcNow
            };

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();
            await UpdateProviderRating(order.ProviderId);

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Gửi đánh giá thành công.",
                Data = new { review.Id, review.Rating, review.Comment, review.CreatedAt }
            });
        }

        [HttpGet("provider/{providerId}")]
        public async Task<ActionResult<ApiResponse<List<object>>>> GetProviderReviews(int providerId)
        {
            var reviews = await _context.Reviews
                .Include(r => r.Customer)
                .Where(r => r.ProviderId == providerId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    r.Id,
                    r.Rating,
                    r.Comment,
                    r.CreatedAt,
                    CustomerName = r.Customer.FullName
                })
                .Cast<object>()
                .ToListAsync();

            return Ok(new ApiResponse<List<object>>
            {
                Success = true,
                Message = "Lấy đánh giá provider thành công.",
                Data = reviews
            });
        }

        private async Task UpdateProviderRating(int providerId)
        {
            var provider = await _context.Providers.FindAsync(providerId);
            if (provider == null) return;

            var reviews = await _context.Reviews.Where(r => r.ProviderId == providerId).ToListAsync();
            provider.Rating = reviews.Count == 0 ? 0 : Math.Round((decimal)reviews.Average(r => r.Rating), 2);
            await _context.SaveChangesAsync();
        }

        private int? GetUserId()
        {
            var value = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(value, out var id) ? id : null;
        }
    }
}
