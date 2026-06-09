using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using WebsiteServiceEcommerce.API.Data;
using WebsiteServiceEcommerce.API.DTOs;

namespace WebsiteServiceEcommerce.API.Controllers
{
    [Route("api/providers")]
    [ApiController]
    public class ProvidersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProvidersController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<object>>> GetProvider(int id)
        {
            var provider = await _context.Providers
                .Include(p => p.User)
                .Include(p => p.Packages.Where(pkg => pkg.IsActive && pkg.IsApproved))
                .FirstOrDefaultAsync(p => p.Id == id);

            if (provider == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Không tìm thấy nhà cung cấp."
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Lấy thông tin nhà cung cấp thành công.",
                Data = new
                {
                    provider.Id,
                    provider.UserId,
                    DisplayName = provider.CompanyName,
                    SupplierName = provider.CompanyName,
                    Bio = provider.Description,
                    Skills = JsonSerializer.Deserialize<List<string>>(provider.Skills) ?? new List<string>(),
                    provider.Rating,
                    CompletedOrders = provider.CompletedProjects,
                    provider.IsVerified,
                    provider.CreatedAt,
                    User = new
                    {
                        provider.User.FullName,
                        provider.User.Email,
                        provider.User.PhoneNumber
                    },
                    Products = provider.Packages.Select(pkg => new
                    {
                        pkg.Id,
                        pkg.Name,
                        pkg.Price,
                        pkg.Category,
                        pkg.DeliveryDays
                    }),
                    Packages = provider.Packages.Select(pkg => new
                    {
                        pkg.Id,
                        pkg.Name,
                        pkg.Price,
                        pkg.Category,
                        pkg.DeliveryDays
                    })
                }
            });
        }
    }
}
