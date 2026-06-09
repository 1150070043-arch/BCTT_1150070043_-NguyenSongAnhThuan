using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebsiteServiceEcommerce.API.Data;
using WebsiteServiceEcommerce.API.DTOs;
using WebsiteServiceEcommerce.API.Models;

namespace WebsiteServiceEcommerce.API.Controllers
{
    [Route("api/categories")]
    [Route("api/product-categories")]
    [ApiController]
    public class CategoriesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CategoriesController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<ServiceCategory>>>> GetCategories()
        {
            var categories = await _context.ServiceCategories
                .OrderBy(c => c.Id)
                .ToListAsync();

            if (categories.Count == 0)
            {
                categories = new List<ServiceCategory>
                {
                    new() { Id = 1, CategoryName = "DaVien", Description = "Đá viên tinh khiết dùng cho gia đình, quán nước và văn phòng.", Icon = "Snowflake" },
                    new() { Id = 2, CategoryName = "DaBi", Description = "Đá bi tinh khiết, nhỏ đều, làm lạnh nhanh cho đồ uống.", Icon = "CircleDot" },
                    new() { Id = 3, CategoryName = "DaOng", Description = "Đá ống tinh khiết, lâu tan, phù hợp cafe, trà sữa và nhà hàng.", Icon = "Cylinder" },
                    new() { Id = 4, CategoryName = "DaCay", Description = "Đá cây số lượng lớn cho bảo quản thực phẩm và sự kiện.", Icon = "Package" },
                    new() { Id = 5, CategoryName = "DaXay", Description = "Đá xay dùng cho sinh tố, cocktail và pha chế.", Icon = "Blend" },
                    new() { Id = 6, CategoryName = "ComboSi", Description = "Combo giao sỉ theo ngày cho quán cafe, nhà hàng và đại lý.", Icon = "Truck" }
                };
            }

            return Ok(new ApiResponse<List<ServiceCategory>>
            {
                Success = true,
                Message = "Lấy danh sách danh mục sản phẩm thành công.",
                Data = categories
            });
        }
    }
}
