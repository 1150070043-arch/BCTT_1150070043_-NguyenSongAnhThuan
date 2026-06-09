using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebsiteServiceEcommerce.API.Data;
using WebsiteServiceEcommerce.API.DTOs;

namespace WebsiteServiceEcommerce.API.Controllers
{
    [Route("api/health")]
    [ApiController]
    public class HealthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public HealthController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<object>>> Get()
        {
            var canConnect = await _context.Database.CanConnectAsync();

            return Ok(new ApiResponse<object>
            {
                Success = canConnect,
                Message = canConnect ? "API và database hoạt động bình thường." : "API chạy nhưng chưa kết nối được database.",
                Data = new
                {
                    status = canConnect ? "Healthy" : "Degraded",
                    checkedAt = DateTime.UtcNow
                }
            });
        }
    }
}
