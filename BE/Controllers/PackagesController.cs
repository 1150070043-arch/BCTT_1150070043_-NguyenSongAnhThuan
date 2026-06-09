using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;
using WebsiteServiceEcommerce.API.Data;
using WebsiteServiceEcommerce.API.DTOs;
using WebsiteServiceEcommerce.API.Models;

namespace WebsiteServiceEcommerce.API.Controllers
{
    [Route("api/[controller]")]
    [Route("api/service-packages")]
    [Route("api/products")]
    [ApiController]
    public class PackagesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PackagesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Packages
        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<PackageDto>>>> GetPackages(
            [FromQuery] string? category = null,
            [FromQuery] decimal? minPrice = null,
            [FromQuery] decimal? maxPrice = null,
            [FromQuery] int? maxDeliveryDays = null,
            [FromQuery] string? search = null,
            [FromQuery] string? sort = null,
            [FromQuery] bool? isApproved = true)
        {
            var query = _context.Packages
                .Include(p => p.Provider)
                .Include(p => p.Images)
                .AsQueryable();

            // Filter by approved status
            if (isApproved.HasValue)
            {
                query = query.Where(p => p.IsApproved == isApproved.Value);
            }

            // Filter by category
            if (!string.IsNullOrWhiteSpace(category))
            {
                query = query.Where(p => p.Category == category);
            }

            // Filter by price range
            if (minPrice.HasValue)
            {
                query = query.Where(p => p.Price >= minPrice.Value);
            }
            if (maxPrice.HasValue)
            {
                query = query.Where(p => p.Price <= maxPrice.Value);
            }

            if (maxDeliveryDays.HasValue)
            {
                query = query.Where(p => p.DeliveryDays <= maxDeliveryDays.Value);
            }

            // Search by name or description
            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(p => p.Name.Contains(search) || p.Description.Contains(search));
            }

            // Only show active packages
            query = query.Where(p => p.IsActive);

            query = sort switch
            {
                "price-asc" => query.OrderBy(p => p.Price),
                "price-desc" => query.OrderByDescending(p => p.Price),
                "stock-desc" => query.OrderByDescending(p => p.StockQuantity),
                "featured" => query.OrderByDescending(p => p.IsFeatured).ThenByDescending(p => p.CreatedAt),
                "rating-desc" => query.OrderByDescending(p => p.Provider.Rating),
                "delivery-asc" => query.OrderBy(p => p.DeliveryDays),
                _ => query.OrderByDescending(p => p.CreatedAt)
            };

            var packages = await query.ToListAsync();

            var packageDtos = packages.Select(ToPackageDto).ToList();

            return Ok(new ApiResponse<List<PackageDto>>
            {
                Success = true,
                Message = "Lấy danh sách sản phẩm thành công.",
                Data = packageDtos
            });
        }

        // GET: api/Packages/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<PackageDto>>> GetPackage(int id)
        {
            var package = await _context.Packages
                .Include(p => p.Provider)
                .ThenInclude(pr => pr.User)
                .Include(p => p.Images)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (package == null)
            {
                return NotFound(new ApiResponse<PackageDto>
                {
                    Success = false,
                    Message = "Không tìm thấy sản phẩm."
                });
            }

            var packageDto = ToPackageDto(package);

            return Ok(new ApiResponse<PackageDto>
            {
                Success = true,
                Message = "Lấy thông tin sản phẩm thành công.",
                Data = packageDto
            });
        }

        // GET: api/Packages/provider/{providerId}
        [HttpGet("provider/{providerId}")]
        public async Task<ActionResult<ApiResponse<List<PackageDto>>>> GetPackagesByProvider(int providerId)
        {
            var packages = await _context.Packages
                .Include(p => p.Provider)
                .Include(p => p.Images)
                .Where(p => p.ProviderId == providerId)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            var packageDtos = packages.Select(ToPackageDto).ToList();

            return Ok(new ApiResponse<List<PackageDto>>
            {
                Success = true,
                Message = "Lấy danh sách sản phẩm theo nhà cung cấp thành công.",
                Data = packageDtos
            });
        }

        // POST: api/Packages
        [Authorize(Roles = "Provider")]
        [HttpPost]
        public async Task<ActionResult<ApiResponse<PackageDto>>> CreatePackage(CreatePackageDto dto)
        {
            // Get provider ID from JWT token
            var providerIdClaim = User.FindFirst("ProviderId")?.Value;
            if (string.IsNullOrEmpty(providerIdClaim))
            {
                return BadRequest(new ApiResponse<PackageDto>
                {
                    Success = false,
                    Message = "Không tìm thấy thông tin nhà cung cấp."
                });
            }

            var providerId = int.Parse(providerIdClaim);

            // Validate provider exists
            var provider = await _context.Providers.FindAsync(providerId);
            if (provider == null)
            {
                return NotFound(new ApiResponse<PackageDto>
                {
                    Success = false,
                    Message = "Nhà cung cấp không tồn tại."
                });
            }

            // Create package
            var package = new Package
            {
                ProviderId = providerId,
                Name = dto.Name,
                Description = dto.Description,
                Price = dto.Price,
                Category = dto.Category,
                DeliveryDays = dto.DeliveryDays,
                Revisions = dto.Revisions,
                Features = JsonSerializer.Serialize(dto.Features),
                Sku = dto.Sku,
                Unit = dto.Unit,
                StockQuantity = dto.StockQuantity,
                ShortDescription = dto.ShortDescription,
                ImageUrl = dto.ImageUrl,
                IsFeatured = dto.IsFeatured,
                IsActive = true,
                IsApproved = false, // Needs admin approval
                CreatedAt = DateTime.UtcNow
            };

            _context.Packages.Add(package);
            await _context.SaveChangesAsync();
            if (package.StockQuantity > 0)
            {
                AddInventoryTransaction(
                    package.Id,
                    null,
                    package.StockQuantity,
                    package.StockQuantity,
                    "InitialStock",
                    "Nha cung cap tao san pham voi ton ban dau.",
                    GetUserId(),
                    "Provider");
                await _context.SaveChangesAsync();
            }

            // Load provider for response
            await _context.Entry(package).Reference(p => p.Provider).LoadAsync();

            var packageDto = new PackageDto
            {
                Id = package.Id,
                ProviderId = package.ProviderId,
                ProviderName = package.Provider.CompanyName,
                Name = package.Name,
                Description = package.Description,
                Price = package.Price,
                Category = package.Category,
                DeliveryDays = package.DeliveryDays,
                Revisions = package.Revisions,
                Features = dto.Features,
                Sku = package.Sku,
                Unit = package.Unit,
                StockQuantity = package.StockQuantity,
                ShortDescription = package.ShortDescription,
                ImageUrl = package.ImageUrl,
                IsFeatured = package.IsFeatured,
                IsActive = package.IsActive,
                IsApproved = package.IsApproved,
                ProviderRating = package.Provider.Rating,
                ProviderCompletedProjects = package.Provider.CompletedProjects,
                CreatedAt = package.CreatedAt
            };

            return CreatedAtAction(nameof(GetPackage), new { id = package.Id }, new ApiResponse<PackageDto>
            {
                Success = true,
                Message = "Tạo sản phẩm thành công. Đang chờ quản trị viên duyệt.",
                Data = packageDto
            });
        }

        // PUT: api/Packages/5
        [Authorize(Roles = "Provider")]
        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<PackageDto>>> UpdatePackage(int id, UpdatePackageDto dto)
        {
            // Get provider ID from JWT token
            var providerIdClaim = User.FindFirst("ProviderId")?.Value;
            if (string.IsNullOrEmpty(providerIdClaim))
            {
                return BadRequest(new ApiResponse<PackageDto>
                {
                    Success = false,
                    Message = "Không tìm thấy thông tin nhà cung cấp."
                });
            }

            var providerId = int.Parse(providerIdClaim);

            var package = await _context.Packages
                .Include(p => p.Provider)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (package == null)
            {
                return NotFound(new ApiResponse<PackageDto>
                {
                    Success = false,
                    Message = "Không tìm thấy sản phẩm."
                });
            }

            // Check if provider owns this package
            if (package.ProviderId != providerId)
            {
                return Forbid();
            }

            var previousStock = package.StockQuantity;

            // Update package
            package.Name = dto.Name;
            package.Description = dto.Description;
            package.Price = dto.Price;
            package.Category = dto.Category;
            package.DeliveryDays = dto.DeliveryDays;
            package.Revisions = dto.Revisions;
            package.Features = JsonSerializer.Serialize(dto.Features);
            package.Sku = dto.Sku;
            package.Unit = dto.Unit;
            package.StockQuantity = dto.StockQuantity;
            package.ShortDescription = dto.ShortDescription;
            package.ImageUrl = dto.ImageUrl;
            package.IsFeatured = dto.IsFeatured;
            package.IsActive = dto.IsActive;
            package.UpdatedAt = DateTime.UtcNow;

            var stockDelta = package.StockQuantity - previousStock;
            if (stockDelta != 0)
            {
                AddInventoryTransaction(
                    package.Id,
                    null,
                    stockDelta,
                    package.StockQuantity,
                    "ManualAdjustment",
                    "Nha cung cap dieu chinh ton san pham.",
                    GetUserId(),
                    "Provider");
            }

            await _context.SaveChangesAsync();

            var packageDto = new PackageDto
            {
                Id = package.Id,
                ProviderId = package.ProviderId,
                ProviderName = package.Provider.CompanyName,
                Name = package.Name,
                Description = package.Description,
                Price = package.Price,
                Category = package.Category,
                DeliveryDays = package.DeliveryDays,
                Revisions = package.Revisions,
                Features = dto.Features,
                Sku = package.Sku,
                Unit = package.Unit,
                StockQuantity = package.StockQuantity,
                ShortDescription = package.ShortDescription,
                ImageUrl = package.ImageUrl,
                IsFeatured = package.IsFeatured,
                IsActive = package.IsActive,
                IsApproved = package.IsApproved,
                ProviderRating = package.Provider.Rating,
                ProviderCompletedProjects = package.Provider.CompletedProjects,
                CreatedAt = package.CreatedAt
            };

            return Ok(new ApiResponse<PackageDto>
            {
                Success = true,
                Message = "Cập nhật sản phẩm thành công.",
                Data = packageDto
            });
        }

        // DELETE: api/Packages/5
        [Authorize(Roles = "Provider")]
        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<object>>> DeletePackage(int id)
        {
            // Get provider ID from JWT token
            var providerIdClaim = User.FindFirst("ProviderId")?.Value;
            if (string.IsNullOrEmpty(providerIdClaim))
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Không tìm thấy thông tin nhà cung cấp."
                });
            }

            var providerId = int.Parse(providerIdClaim);

            var package = await _context.Packages.FindAsync(id);

            if (package == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Không tìm thấy sản phẩm."
                });
            }

            // Check if provider owns this package
            if (package.ProviderId != providerId)
            {
                return Forbid();
            }

            // Soft delete - just set IsActive to false
            package.IsActive = false;
            package.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Xóa sản phẩm thành công."
            });
        }

        // GET: api/Packages/categories
        [HttpGet("categories")]
        public ActionResult<ApiResponse<List<string>>> GetCategories()
        {
            var categories = new List<string>
            {
                "DaVien",
                "DaBi",
                "DaOng",
                "DaCay",
                "DaXay",
                "ComboSi"
            };

            return Ok(new ApiResponse<List<string>>
            {
                Success = true,
                Message = "Lấy danh sách danh mục thành công.",
                Data = categories
            });
        }

        private static PackageDto ToPackageDto(Package package)
        {
            return new PackageDto
            {
                Id = package.Id,
                ProviderId = package.ProviderId,
                ProviderName = package.Provider.CompanyName,
                Name = package.Name,
                Description = package.Description,
                Price = package.Price,
                Category = package.Category,
                DeliveryDays = package.DeliveryDays,
                Revisions = package.Revisions,
                Features = JsonSerializer.Deserialize<List<string>>(package.Features) ?? new List<string>(),
                Sku = package.Sku,
                Unit = package.Unit,
                StockQuantity = package.StockQuantity,
                ShortDescription = package.ShortDescription,
                ImageUrl = package.ImageUrl,
                IsFeatured = package.IsFeatured,
                IsActive = package.IsActive,
                IsApproved = package.IsApproved,
                ProviderRating = package.Provider.Rating,
                ProviderCompletedProjects = package.Provider.CompletedProjects,
                CreatedAt = package.CreatedAt,
                Images = package.Images
                    .OrderByDescending(i => i.IsPrimary)
                    .ThenBy(i => i.SortOrder)
                    .Select(i => new ProductImageDto
                    {
                        Id = i.Id,
                        ImageUrl = i.ImageUrl,
                        FileName = i.FileName,
                        SortOrder = i.SortOrder,
                        IsPrimary = i.IsPrimary,
                        CreatedAt = i.CreatedAt
                    })
                    .ToList()
            };
        }

        private void AddInventoryTransaction(
            int productId,
            int? orderId,
            int quantityChange,
            int balanceAfter,
            string transactionType,
            string reason,
            int? userId,
            string role)
        {
            _context.InventoryTransactions.Add(new InventoryTransaction
            {
                ProductId = productId,
                OrderId = orderId,
                QuantityChange = quantityChange,
                BalanceAfter = balanceAfter,
                TransactionType = transactionType,
                Reason = reason,
                CreatedByUserId = userId,
                CreatedByRole = role,
                CreatedAt = DateTime.UtcNow
            });
        }

        private int? GetUserId()
        {
            var value = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(value, out var id) ? id : null;
        }
    }
}
