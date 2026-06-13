using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using WebsiteServiceEcommerce.API.Data;
using WebsiteServiceEcommerce.API.DTOs;
using WebsiteServiceEcommerce.API.Helpers;
using WebsiteServiceEcommerce.API.Models;

namespace WebsiteServiceEcommerce.API.Controllers
{
    [Route("api/admin")]
    [ApiController]
    [Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public AdminController(ApplicationDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        [HttpGet("dashboard")]
        public async Task<ActionResult<ApiResponse<object>>> GetDashboard()
        {
            var paidRevenue = await _context.Payments
                .Where(p => p.PaymentStatus == "Paid")
                .SumAsync(p => p.Amount);

            var lowStock = await _context.Packages.CountAsync(p => p.StockQuantity <= 50 && p.IsActive);
            var codUncollected = await _context.Payments.CountAsync(p => p.PaymentMethod == "MockCOD" && p.PaymentStatus == "Pending");
            var awaitingBankTransfers = await _context.Payments.CountAsync(p => p.PaymentMethod == "MockBanking" && p.PaymentStatus == "AwaitingTransfer");
            var openSupportRequests = await _context.SupportRequests.CountAsync(r => r.Status == "Open" || r.Status == "InProgress");

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Lấy dashboard quản trị thành công.",
                Data = new
                {
                    TotalUsers = await _context.Users.CountAsync(),
                    TotalProviders = await _context.Providers.CountAsync(),
                    TotalProducts = await _context.Packages.CountAsync(),
                    ActiveProducts = await _context.Packages.CountAsync(p => p.IsActive && p.IsApproved),
                    TotalOrders = await _context.Orders.CountAsync(),
                    Revenue = paidRevenue,
                    PendingProviders = await _context.Providers.CountAsync(p => !p.IsVerified),
                    PendingPackages = await _context.Packages.CountAsync(p => !p.IsApproved),
                    LowStockProducts = lowStock,
                    CodUncollected = codUncollected,
                    AwaitingBankTransfers = awaitingBankTransfers,
                    OpenSupportRequests = openSupportRequests
                }
            });
        }

        [HttpGet("users")]
        public async Task<ActionResult<ApiResponse<List<object>>>> GetUsers()
        {
            var users = await _context.Users
                .OrderByDescending(u => u.CreatedAt)
                .Select(u => new
                {
                    u.Id,
                    u.FullName,
                    u.Email,
                    u.PhoneNumber,
                    u.Role,
                    u.IsActive,
                    u.CreatedAt
                })
                .Cast<object>()
                .ToListAsync();

            return Ok(new ApiResponse<List<object>>
            {
                Success = true,
                Message = "Lấy danh sách người dùng thành công.",
                Data = users
            });
        }

        [HttpPost("users")]
        public async Task<ActionResult<ApiResponse<object>>> CreateInternalUser(CreateInternalUserDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.FullName) ||
                string.IsNullOrWhiteSpace(dto.Email) ||
                string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Vui lòng nhập họ tên, email và mật khẩu."
                });
            }

            if (dto.Password.Length < 6)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Mật khẩu cần tối thiểu 6 ký tự."
                });
            }

            var role = dto.Role.Trim();
            if (role is not ("Admin" or "Provider"))
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Admin chỉ cấp tài khoản nội bộ vai trò Admin hoặc Kho vận."
                });
            }

            var email = dto.Email.Trim();
            var exists = await _context.Users.AnyAsync(u => u.Email == email);
            if (exists)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Email đã được sử dụng."
                });
            }

            var user = new User
            {
                FullName = dto.FullName.Trim(),
                Email = email,
                PhoneNumber = dto.PhoneNumber.Trim(),
                PasswordHash = PasswordHelper.HashPassword(dto.Password),
                Role = role,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            AddAuditLog("CreateInternalUser", "User", null, $"Cap tai khoan noi bo {role} cho {email}.", new { email, role });
            await _context.SaveChangesAsync();

            int? providerId = null;
            if (role == "Provider")
            {
                var provider = new Provider
                {
                    UserId = user.Id,
                    CompanyName = user.FullName,
                    Description = string.Empty,
                    Skills = "[]",
                    Rating = 0,
                    CompletedProjects = 0,
                    IsVerified = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Providers.Add(provider);
                await _context.SaveChangesAsync();
                providerId = provider.Id;
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Đã cấp tài khoản nội bộ thành công.",
                Data = new
                {
                    user.Id,
                    user.FullName,
                    user.Email,
                    user.PhoneNumber,
                    user.Role,
                    user.IsActive,
                    ProviderId = providerId
                }
            });
        }

        [HttpPut("users/{id}/status")]
        public async Task<ActionResult<ApiResponse<object>>> UpdateUserStatus(int id, UpdateUserStatusDto dto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound(new ApiResponse<object> { Success = false, Message = "Không tìm thấy người dùng." });
            }

            user.IsActive = dto.IsActive;
            user.UpdatedAt = DateTime.UtcNow;
            AddAuditLog("UpdateUserStatus", "User", user.Id, $"{(dto.IsActive ? "Mo khoa" : "Khoa")} tai khoan {user.Email}.", new { user.Email, dto.IsActive });
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object> { Success = true, Message = "Cập nhật trạng thái người dùng thành công." });
        }

        [HttpPut("users/{id}/password/default")]
        public async Task<ActionResult<ApiResponse<object>>> ResetUserPasswordToDefault(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound(new ApiResponse<object> { Success = false, Message = "Không tìm thấy người dùng." });
            }

            user.PasswordHash = PasswordHelper.HashPassword("123123");
            user.UpdatedAt = DateTime.UtcNow;
            AddAuditLog("ResetUserPassword", "User", user.Id, $"Đặt lại mật khẩu mặc định cho {user.Email}.", new { user.Email, DefaultPassword = "123123" });
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Đã đặt lại mật khẩu người dùng về mặc định 123123."
            });
        }

        [HttpGet("providers/pending")]
        public async Task<ActionResult<ApiResponse<List<object>>>> GetPendingProviders()
        {
            var providers = await _context.Providers
                .Include(p => p.User)
                .Where(p => !p.IsVerified)
                .Select(p => new
                {
                    p.Id,
                    p.CompanyName,
                    p.Description,
                    p.Skills,
                    p.CreatedAt,
                    UserName = p.User.FullName,
                    p.User.Email
                })
                .Cast<object>()
                .ToListAsync();

            return Ok(new ApiResponse<List<object>>
            {
                Success = true,
                Message = "Lấy danh sách nhà cung cấp chờ duyệt thành công.",
                Data = providers
            });
        }

        [HttpGet("providers")]
        public async Task<ActionResult<ApiResponse<List<object>>>> GetProviders()
        {
            var providers = await _context.Providers
                .Include(p => p.User)
                .OrderByDescending(p => p.IsVerified)
                .ThenBy(p => p.CompanyName)
                .Select(p => new
                {
                    p.Id,
                    p.CompanyName,
                    p.Description,
                    p.IsVerified,
                    p.CreatedAt,
                    UserName = p.User.FullName,
                    p.User.Email,
                    p.User.PhoneNumber,
                    p.User.Address
                })
                .Cast<object>()
                .ToListAsync();

            return Ok(new ApiResponse<List<object>>
            {
                Success = true,
                Message = "Lay danh sach kho van thanh cong.",
                Data = providers
            });
        }

        [HttpPut("providers/{id}/verify")]
        public async Task<ActionResult<ApiResponse<object>>> VerifyProvider(int id)
        {
            var provider = await _context.Providers.FindAsync(id);
            if (provider == null)
            {
                return NotFound(new ApiResponse<object> { Success = false, Message = "Không tìm thấy nhà cung cấp." });
            }

            provider.IsVerified = true;
            provider.UpdatedAt = DateTime.UtcNow;
            AddAuditLog("VerifyProvider", "Provider", provider.Id, $"Duyet kho van #{provider.Id}.", new { provider.Id });
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object> { Success = true, Message = "Duyệt nhà cung cấp thành công." });
        }

        [HttpGet("packages/pending")]
        public async Task<ActionResult<ApiResponse<List<PackageDto>>>> GetPendingPackages()
        {
            var packages = await _context.Packages
                .Include(p => p.Provider)
                .Include(p => p.Images)
                .Where(p => !p.IsApproved)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            return Ok(new ApiResponse<List<PackageDto>>
            {
                Success = true,
                Message = "Lấy danh sách sản phẩm chờ duyệt thành công.",
                Data = packages.Select(ToPackageDto).ToList()
            });
        }

        [HttpGet("packages")]
        public async Task<ActionResult<ApiResponse<List<PackageDto>>>> GetPackages(
            [FromQuery] string? status = null,
            [FromQuery] string? search = null,
            [FromQuery] string? category = null)
        {
            var query = _context.Packages
                .Include(p => p.Provider)
                .Include(p => p.Images)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(p =>
                    p.Name.Contains(search) ||
                    p.Sku.Contains(search) ||
                    p.Description.Contains(search));
            }

            if (!string.IsNullOrWhiteSpace(category) && category != "All")
            {
                query = query.Where(p => p.Category == category);
            }

            query = status switch
            {
                "Pending" => query.Where(p => !p.IsApproved),
                "Published" => query.Where(p => p.IsApproved && p.IsActive),
                "Hidden" => query.Where(p => !p.IsActive),
                "Featured" => query.Where(p => p.IsFeatured),
                "LowStock" => query.Where(p => p.StockQuantity <= 50),
                _ => query
            };

            var packages = await query
                .OrderByDescending(p => p.UpdatedAt ?? p.CreatedAt)
                .ToListAsync();

            return Ok(new ApiResponse<List<PackageDto>>
            {
                Success = true,
                Message = "Lấy danh sách sản phẩm quản trị thành công.",
                Data = packages.Select(ToPackageDto).ToList()
            });
        }

        [HttpPost("packages")]
        public async Task<ActionResult<ApiResponse<PackageDto>>> CreatePackage(CreatePackageDto dto)
        {
            var providerQuery = _context.Providers.AsQueryable();
            var selectedProviderId = dto.ProviderId.GetValueOrDefault();
            var provider = selectedProviderId > 0
                ? await providerQuery.FirstOrDefaultAsync(p => p.Id == selectedProviderId && p.IsVerified)
                : await providerQuery
                    .OrderByDescending(p => p.IsVerified)
                    .ThenBy(p => p.Id)
                    .FirstOrDefaultAsync();

            if (provider == null)
            {
                return BadRequest(new ApiResponse<PackageDto>
                {
                    Success = false,
                    Message = "Chưa có tài khoản kho. Vui lòng tạo tài khoản kho trước khi thêm sản phẩm."
                });
            }

            if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Sku) || string.IsNullOrWhiteSpace(dto.Unit) || dto.Price <= 0 || dto.StockQuantity < 0)
            {
                return BadRequest(new ApiResponse<PackageDto> { Success = false, Message = "Thông tin sản phẩm không hợp lệ." });
            }

            var sku = dto.Sku.Trim();
            var skuExists = await _context.Packages.AnyAsync(p => p.ProviderId == provider.Id && p.Sku == sku);
            if (skuExists)
            {
                return BadRequest(new ApiResponse<PackageDto> { Success = false, Message = "SKU đã tồn tại." });
            }

            var package = new Package
            {
                ProviderId = provider.Id,
                Name = dto.Name.Trim(),
                ShortDescription = dto.ShortDescription?.Trim() ?? string.Empty,
                Description = dto.Description?.Trim() ?? string.Empty,
                Price = dto.Price,
                Category = string.IsNullOrWhiteSpace(dto.Category) ? "DaVien" : dto.Category,
                DeliveryDays = dto.DeliveryDays <= 0 ? 1 : dto.DeliveryDays,
                Revisions = dto.Revisions <= 0 ? 1 : dto.Revisions,
                Features = JsonSerializer.Serialize(dto.Features ?? new List<string>()),
                Sku = sku,
                Unit = dto.Unit.Trim(),
                StockQuantity = dto.StockQuantity,
                ImageUrl = dto.ImageUrl?.Trim() ?? string.Empty,
                IsFeatured = dto.IsFeatured,
                IsActive = true,
                IsApproved = true,
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
                    "Admin tạo sản phẩm với tồn ban đầu.",
                    GetUserId(),
                    "Admin");
            }

            AddAuditLog("CreatePackage", "Product", package.Id, $"Tạo sản phẩm {package.Name}.", new { package.Sku, package.StockQuantity, package.IsFeatured });
            await _context.SaveChangesAsync();
            await _context.Entry(package).Reference(p => p.Provider).LoadAsync();
            await _context.Entry(package).Collection(p => p.Images).LoadAsync();

            return Ok(new ApiResponse<PackageDto>
            {
                Success = true,
                Message = "Đã thêm sản phẩm mới.",
                Data = ToPackageDto(package)
            });
        }

        [HttpPut("packages/{id}")]
        public async Task<ActionResult<ApiResponse<PackageDto>>> UpdatePackage(int id, UpdatePackageDto dto)
        {
            var package = await _context.Packages
                .Include(p => p.Provider)
                .Include(p => p.Images)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (package == null)
            {
                return NotFound(new ApiResponse<PackageDto> { Success = false, Message = "Không tìm thấy sản phẩm." });
            }

            if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Sku) || string.IsNullOrWhiteSpace(dto.Unit) || dto.Price <= 0 || dto.DeliveryDays <= 0 || dto.StockQuantity < 0)
            {
                return BadRequest(new ApiResponse<PackageDto> { Success = false, Message = "Thong tin san pham khong hop le." });
            }

            var sku = dto.Sku.Trim();
            var skuExists = await _context.Packages.AnyAsync(p => p.Id != id && p.ProviderId == package.ProviderId && p.Sku == sku);
            if (skuExists)
            {
                return BadRequest(new ApiResponse<PackageDto> { Success = false, Message = "SKU da ton tai." });
            }

            var previousStock = package.StockQuantity;

            package.Name = dto.Name.Trim();
            package.ShortDescription = dto.ShortDescription?.Trim() ?? string.Empty;
            package.Description = dto.Description?.Trim() ?? string.Empty;
            package.Price = dto.Price;
            package.Category = dto.Category;
            package.DeliveryDays = dto.DeliveryDays;
            package.Revisions = dto.Revisions;
            package.Features = JsonSerializer.Serialize(dto.Features ?? new List<string>());
            package.Sku = sku;
            package.Unit = dto.Unit.Trim();
            package.StockQuantity = dto.StockQuantity;
            package.ImageUrl = dto.ImageUrl?.Trim() ?? string.Empty;
            package.IsFeatured = dto.IsFeatured;
            package.IsActive = dto.IsActive;
            package.IsApproved = dto.IsActive || package.IsApproved;
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
                    "Admin dieu chinh ton san pham.",
                    GetUserId(),
                    "Admin");
            }

            AddAuditLog("UpdatePackage", "Product", package.Id, $"Cap nhat san pham {package.Name}.", new { package.Sku, StockDelta = stockDelta, package.Price, package.IsActive, package.IsFeatured });
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<PackageDto>
            {
                Success = true,
                Message = "Cập nhật sản phẩm thành công.",
                Data = ToPackageDto(package)
            });
        }

        [HttpPost("packages/{id}/images")]
        [RequestSizeLimit(5 * 1024 * 1024)]
        public async Task<ActionResult<ApiResponse<PackageDto>>> UploadProductImage(int id, [FromForm] IFormFile file)
        {
            var package = await _context.Packages
                .Include(p => p.Provider)
                .Include(p => p.Images)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (package == null)
            {
                return NotFound(new ApiResponse<PackageDto> { Success = false, Message = "Không tìm thấy sản phẩm." });
            }

            if (file == null || file.Length == 0)
            {
                return BadRequest(new ApiResponse<PackageDto> { Success = false, Message = "Vui lòng chọn file ảnh." });
            }

            if (package.Images.Count >= 7)
            {
                return BadRequest(new ApiResponse<PackageDto> { Success = false, Message = "Mỗi sản phẩm chỉ được tối đa 7 hình." });
            }

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var allowedExtensions = new HashSet<string> { ".jpg", ".jpeg", ".png", ".webp" };
            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest(new ApiResponse<PackageDto> { Success = false, Message = "Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP." });
            }

            var webRoot = EnsureWebRoot();
            var uploadDir = Path.Combine(webRoot, "uploads", "products", id.ToString());
            Directory.CreateDirectory(uploadDir);

            var safeFileName = $"{Guid.NewGuid():N}{extension}";
            var filePath = Path.Combine(uploadDir, safeFileName);
            await using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var isPrimary = !package.Images.Any();
            var image = new ProductImage
            {
                ProductId = id,
                FileName = safeFileName,
                ImageUrl = $"{Request.Scheme}://{Request.Host}/uploads/products/{id}/{safeFileName}",
                SortOrder = package.Images.Any() ? package.Images.Max(i => i.SortOrder) + 1 : 1,
                IsPrimary = isPrimary,
                CreatedAt = DateTime.UtcNow
            };

            _context.ProductImages.Add(image);
            if (isPrimary)
            {
                package.ImageUrl = image.ImageUrl;
            }

            package.UpdatedAt = DateTime.UtcNow;
            AddAuditLog("UploadProductImage", "Product", package.Id, $"Upload anh san pham {package.Name}.", new { image.FileName, image.IsPrimary });
            await _context.SaveChangesAsync();
            await _context.Entry(package).Collection(p => p.Images).LoadAsync();

            return Ok(new ApiResponse<PackageDto>
            {
                Success = true,
                Message = "Upload ảnh sản phẩm thành công.",
                Data = ToPackageDto(package)
            });
        }

        [HttpPut("packages/{id}/images/{imageId}/primary")]
        public async Task<ActionResult<ApiResponse<PackageDto>>> SetPrimaryProductImage(int id, int imageId)
        {
            var package = await _context.Packages
                .Include(p => p.Provider)
                .Include(p => p.Images)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (package == null)
            {
                return NotFound(new ApiResponse<PackageDto> { Success = false, Message = "Không tìm thấy sản phẩm." });
            }

            var target = package.Images.FirstOrDefault(i => i.Id == imageId);
            if (target == null)
            {
                return NotFound(new ApiResponse<PackageDto> { Success = false, Message = "Không tìm thấy ảnh sản phẩm." });
            }

            foreach (var image in package.Images)
            {
                image.IsPrimary = image.Id == imageId;
            }

            package.ImageUrl = target.ImageUrl;
            package.UpdatedAt = DateTime.UtcNow;
            AddAuditLog("SetPrimaryProductImage", "Product", package.Id, $"Dat anh chinh cho san pham {package.Name}.", new { ImageId = imageId });
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<PackageDto>
            {
                Success = true,
                Message = "Đã đặt ảnh chính cho sản phẩm.",
                Data = ToPackageDto(package)
            });
        }

        [HttpDelete("packages/{id}/images/{imageId}")]
        public async Task<ActionResult<ApiResponse<PackageDto>>> DeleteProductImage(int id, int imageId)
        {
            var package = await _context.Packages
                .Include(p => p.Provider)
                .Include(p => p.Images)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (package == null)
            {
                return NotFound(new ApiResponse<PackageDto> { Success = false, Message = "Không tìm thấy sản phẩm." });
            }

            var target = package.Images.FirstOrDefault(i => i.Id == imageId);
            if (target == null)
            {
                return NotFound(new ApiResponse<PackageDto> { Success = false, Message = "Không tìm thấy ảnh sản phẩm." });
            }

            DeleteUploadedFileIfLocal(target.ImageUrl);
            package.Images.Remove(target);
            _context.ProductImages.Remove(target);
            await _context.SaveChangesAsync();

            await _context.Entry(package).Collection(p => p.Images).LoadAsync();
            if (target.IsPrimary)
            {
                var nextPrimary = package.Images.OrderBy(i => i.SortOrder).FirstOrDefault();
                if (nextPrimary != null)
                {
                    nextPrimary.IsPrimary = true;
                    package.ImageUrl = nextPrimary.ImageUrl;
                }
                else
                {
                    package.ImageUrl = string.Empty;
                }
            }

            package.UpdatedAt = DateTime.UtcNow;
            AddAuditLog("DeleteProductImage", "Product", package.Id, $"Xoa anh san pham {package.Name}.", new { ImageId = imageId });
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<PackageDto>
            {
                Success = true,
                Message = "Đã xóa ảnh sản phẩm.",
                Data = ToPackageDto(package)
            });
        }

        [HttpDelete("packages/{id}")]
        public async Task<ActionResult<ApiResponse<object>>> DeletePackage(int id)
        {
            var package = await _context.Packages.FindAsync(id);
            if (package == null)
            {
                return NotFound(new ApiResponse<object> { Success = false, Message = "Không tìm thấy sản phẩm." });
            }

            package.IsActive = false;
            package.IsApproved = false;
            package.UpdatedAt = DateTime.UtcNow;
            AddAuditLog("HidePackage", "Product", package.Id, $"An san pham #{package.Id}.", new { package.Id });
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object> { Success = true, Message = "Đã ẩn sản phẩm khỏi cửa hàng." });
        }

        [HttpGet("orders")]
        public async Task<ActionResult<ApiResponse<List<object>>>> GetOrders(
            [FromQuery] string? status = null,
            [FromQuery] string? paymentStatus = null,
            [FromQuery] string? paymentMethod = null,
            [FromQuery] string? search = null,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            var query = _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.Provider)
                .Include(o => o.Package)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(status) && status != "All")
            {
                var normalizedStatus = OrderWorkflow.Normalize(status);
                query = query.Where(o => o.Status == normalizedStatus);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var keyword = search.Trim();
                query = query.Where(o =>
                    o.Id.ToString().Contains(keyword) ||
                    o.Customer.FullName.Contains(keyword) ||
                    o.Customer.Email.Contains(keyword) ||
                    (o.Customer.PhoneNumber != null && o.Customer.PhoneNumber.Contains(keyword)) ||
                    o.Package.Name.Contains(keyword) ||
                    o.Provider.CompanyName.Contains(keyword) ||
                    (o.TrackingCode != null && o.TrackingCode.Contains(keyword)));
            }

            if (fromDate.HasValue)
            {
                query = query.Where(o => o.CreatedAt >= fromDate.Value.Date);
            }

            if (toDate.HasValue)
            {
                query = query.Where(o => o.CreatedAt < toDate.Value.Date.AddDays(1));
            }

            if (!string.IsNullOrWhiteSpace(paymentStatus) && paymentStatus != "All")
            {
                query = query.Where(o => _context.Payments.Any(p => p.OrderId == o.Id && p.PaymentStatus == paymentStatus));
            }

            if (!string.IsNullOrWhiteSpace(paymentMethod) && paymentMethod != "All")
            {
                query = query.Where(o => _context.Payments.Any(p => p.OrderId == o.Id && p.PaymentMethod == paymentMethod));
            }

            var orders = await query
                .OrderByDescending(o => o.CreatedAt)
                .Select(o => new
                {
                    o.Id,
                    CustomerName = o.Customer.FullName,
                    ProviderName = o.Provider.CompanyName,
                    SupplierName = o.Provider.CompanyName,
                    PackageName = o.Package.Name,
                    ProductName = o.Package.Name,
                    o.Status,
                    o.TotalPrice,
                    o.AssignedStaffName,
                    o.DeliveryRoute,
                    o.TrackingCode,
                    o.EstimatedDeliveryAt,
                    o.DeliveryNote,
                    o.DeliveryProofImageUrl,
                    o.DeliveryFailureReason,
                    Payment = _context.Payments
                        .Where(p => p.OrderId == o.Id)
                        .Select(p => new
                        {
                            p.Id,
                            p.PaymentMethod,
                            p.PaymentStatus,
                            p.TransferReference,
                            p.PaymentNote,
                            p.PaidAt,
                            p.ConfirmedAt
                        })
                        .FirstOrDefault(),
                    o.CreatedAt,
                    o.CompletedAt
                })
                .Cast<object>()
                .ToListAsync();

            return Ok(new ApiResponse<List<object>>
            {
                Success = true,
                Message = "Lấy danh sách đơn hàng thành công.",
                Data = orders
            });
        }

        [HttpGet("orders/{id}")]
        public async Task<ActionResult<ApiResponse<object>>> GetOrderDetail(int id)
        {
            var order = await _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.Provider)
                .Include(o => o.Package)
                .Include(o => o.OrderItems)
                .ThenInclude(i => i.Package)
                .Include(o => o.StatusHistories)
                .ThenInclude(h => h.ChangedByUser)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
            {
                return NotFound(new ApiResponse<object> { Success = false, Message = "Khong tim thay don hang." });
            }

            var payment = await _context.Payments
                .Include(p => p.ConfirmedByUser)
                .Where(p => p.OrderId == id)
                .Select(p => new
                {
                    p.Id,
                    p.PaymentMethod,
                    p.PaymentStatus,
                    p.TransferReference,
                    p.PaymentNote,
                    p.Amount,
                    p.PaidAt,
                    p.ConfirmedAt,
                    ConfirmedByName = p.ConfirmedByUser == null ? "" : p.ConfirmedByUser.FullName,
                    p.CreatedAt
                })
                .FirstOrDefaultAsync();

            var data = new
            {
                order.Id,
                order.CustomerId,
                CustomerName = order.Customer.FullName,
                CustomerEmail = order.Customer.Email,
                CustomerPhone = order.Customer.PhoneNumber,
                ProviderName = order.Provider.CompanyName,
                SupplierName = order.Provider.CompanyName,
                PackageName = order.Package.Name,
                ProductName = order.Package.Name,
                ProductSku = order.Package.Sku,
                order.Status,
                order.TotalPrice,
                order.Requirements,
                order.ShippingName,
                order.ShippingPhone,
                order.ShippingAddress,
                order.DeliveryMethod,
                order.AssignedStaffName,
                order.DeliveryRoute,
                order.TrackingCode,
                order.EstimatedDeliveryAt,
                order.DeliveryNote,
                order.DeliveryProofImageUrl,
                order.DeliveryFailureReason,
                Payment = payment,
                Items = order.OrderItems.Select(i => new
                {
                    i.Id,
                    i.PackageId,
                    ProductName = i.Package.Name,
                    i.Package.Sku,
                    i.Package.Unit,
                    i.Quantity,
                    i.UnitPrice,
                    i.LineTotal
                }).ToList(),
                StatusHistories = order.StatusHistories
                    .OrderByDescending(h => h.CreatedAt)
                    .Select(h => new
                    {
                        h.Id,
                        h.FromStatus,
                        h.ToStatus,
                        h.ChangedByRole,
                        ChangedByName = h.ChangedByUser == null ? "" : h.ChangedByUser.FullName,
                        h.Note,
                        h.CreatedAt
                    })
                    .ToList(),
                order.CreatedAt,
                order.UpdatedAt,
                order.CompletedAt
            };

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Lay chi tiet don hang thanh cong.",
                Data = data
            });
        }

        [HttpPut("orders/{id}/status")]
        public async Task<ActionResult<ApiResponse<object>>> UpdateOrderStatus(int id, UpdateOrderStatusDto dto)
        {
            var nextStatus = OrderWorkflow.Normalize(dto.Status);
            if (!OrderWorkflow.ValidStatuses.Contains(nextStatus))
            {
                return BadRequest(new ApiResponse<object> { Success = false, Message = "Trạng thái đơn hàng không hợp lệ." });
            }

            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .ThenInclude(i => i.Package)
                .FirstOrDefaultAsync(o => o.Id == id);
            if (order == null)
            {
                return NotFound(new ApiResponse<object> { Success = false, Message = "Không tìm thấy đơn hàng." });
            }

            if (!OrderWorkflow.CanAdminSet(order.Status, nextStatus))
            {
                return BadRequest(new ApiResponse<object> { Success = false, Message = "Không thể đổi sang trạng thái này theo nghiệp vụ đơn hàng." });
            }

            var previousStatus = OrderWorkflow.Normalize(order.Status);
            if (nextStatus == OrderWorkflow.Cancelled && previousStatus != OrderWorkflow.Cancelled)
            {
                foreach (var item in order.OrderItems)
                {
                    item.Package.StockQuantity += item.Quantity;
                    AddInventoryTransaction(
                        item.PackageId,
                        order.Id,
                        item.Quantity,
                        item.Package.StockQuantity,
                        "OrderCancelled",
                        $"Admin huy don #{order.Id}, hoan ton kho.",
                        GetUserId(),
                        "Admin");
                }

                var payment = await _context.Payments.FirstOrDefaultAsync(p => p.OrderId == order.Id);
                if (payment != null && payment.PaymentStatus != "Paid")
                {
                    payment.PaymentStatus = "Cancelled";
                }
            }

            order.Status = nextStatus;
            order.UpdatedAt = DateTime.UtcNow;
            order.CompletedAt = nextStatus == OrderWorkflow.Completed ? DateTime.UtcNow : order.CompletedAt;
            if (nextStatus == OrderWorkflow.Delivered)
            {
                await ConfirmCodIfNeeded(order.Id);
            }
            AddStatusHistory(order.Id, previousStatus, nextStatus, dto.Note?.Trim() ?? "Admin cập nhật trạng thái đơn hàng.");
            AddAuditLog("UpdateOrderStatus", "Order", order.Id, $"Doi trang thai don #{order.Id}: {previousStatus} -> {nextStatus}.", new { PreviousStatus = previousStatus, NextStatus = nextStatus, dto.Note });
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object> { Success = true, Message = "Cập nhật trạng thái đơn hàng thành công." });
        }

        [HttpPut("orders/{id}/payment/confirm")]
        public async Task<ActionResult<ApiResponse<object>>> ConfirmOrderPayment(int id, ConfirmPaymentDto dto)
        {
            var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == id);
            if (order == null)
            {
                return NotFound(new ApiResponse<object> { Success = false, Message = "Khong tim thay don hang." });
            }

            var payment = await _context.Payments.FirstOrDefaultAsync(p => p.OrderId == id);
            if (payment == null)
            {
                return NotFound(new ApiResponse<object> { Success = false, Message = "Don hang chua co ban ghi thanh toan." });
            }

            if (payment.PaymentStatus == "Paid")
            {
                return BadRequest(new ApiResponse<object> { Success = false, Message = "Thanh toan da duoc xac nhan truoc do." });
            }

            payment.PaymentStatus = "Paid";
            payment.PaidAt = DateTime.UtcNow;
            payment.ConfirmedAt = DateTime.UtcNow;
            payment.ConfirmedByUserId = GetUserId();
            payment.TransferReference = string.IsNullOrWhiteSpace(dto.Reference)
                ? payment.TransferReference
                : dto.Reference.Trim();
            payment.PaymentNote = string.IsNullOrWhiteSpace(dto.Note)
                ? "Admin xac nhan thanh toan."
                : dto.Note.Trim();

            _context.Notifications.Add(new Notification
            {
                UserId = order.CustomerId,
                Title = "Thanh toan da duoc xac nhan",
                Content = $"Don hang #{order.Id} da duoc xac nhan thanh toan.",
                CreatedAt = DateTime.UtcNow
            });

            AddAuditLog("ConfirmOrderPayment", "Order", order.Id, $"Xac nhan thanh toan don #{order.Id}.", new { payment.PaymentMethod, payment.Amount, payment.TransferReference });
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object> { Success = true, Message = "Da xac nhan thanh toan don hang." });
        }

        [HttpPut("packages/{id}/approve")]
        public async Task<ActionResult<ApiResponse<object>>> ApprovePackage(int id)
        {
            return await SetPackageApproval(id, true, "Duyệt sản phẩm thành công.");
        }

        [HttpPut("packages/{id}/reject")]
        public async Task<ActionResult<ApiResponse<object>>> RejectPackage(int id)
        {
            return await SetPackageApproval(id, false, "Từ chối sản phẩm thành công.");
        }

        [HttpGet("inventory/transactions")]
        public async Task<ActionResult<ApiResponse<List<object>>>> GetInventoryTransactions(
            [FromQuery] int? productId = null,
            [FromQuery] int take = 80)
        {
            var query = _context.InventoryTransactions
                .Include(t => t.Product)
                .Include(t => t.Order)
                .Include(t => t.CreatedByUser)
                .AsQueryable();

            if (productId.HasValue)
            {
                query = query.Where(t => t.ProductId == productId.Value);
            }

            var safeTake = Math.Clamp(take, 1, 200);
            var transactions = await query
                .OrderByDescending(t => t.CreatedAt)
                .Take(safeTake)
                .Select(t => new
                {
                    t.Id,
                    t.ProductId,
                    ProductName = t.Product.Name,
                    ProductSku = t.Product.Sku,
                    t.OrderId,
                    t.QuantityChange,
                    t.BalanceAfter,
                    t.TransactionType,
                    t.Reason,
                    t.CreatedByUserId,
                    CreatedByName = t.CreatedByUser == null ? "" : t.CreatedByUser.FullName,
                    t.CreatedByRole,
                    t.CreatedAt
                })
                .Cast<object>()
                .ToListAsync();

            return Ok(new ApiResponse<List<object>>
            {
                Success = true,
                Message = "Lay lich su ton kho thanh cong.",
                Data = transactions
            });
        }

        [HttpGet("inventory/summary")]
        public async Task<ActionResult<ApiResponse<List<object>>>> GetInventorySummary()
        {
            var summary = await _context.Packages
                .Include(p => p.Provider)
                .OrderBy(p => p.StockQuantity)
                .Select(p => new
                {
                    p.Id,
                    ProductName = p.Name,
                    p.Sku,
                    p.Unit,
                    p.StockQuantity,
                    p.Category,
                    ProviderName = p.Provider.CompanyName,
                    IsLowStock = p.StockQuantity <= 50,
                    p.UpdatedAt
                })
                .Cast<object>()
                .ToListAsync();

            return Ok(new ApiResponse<List<object>>
            {
                Success = true,
                Message = "Lay bao cao ton kho thanh cong.",
                Data = summary
            });
        }

        [HttpPost("inventory/adjustments")]
        public async Task<ActionResult<ApiResponse<object>>> CreateInventoryAdjustment(InventoryAdjustmentDto dto)
        {
            var product = await _context.Packages.FirstOrDefaultAsync(p => p.Id == dto.ProductId);
            if (product == null)
            {
                return NotFound(new ApiResponse<object> { Success = false, Message = "Khong tim thay san pham." });
            }

            if (dto.Quantity <= 0)
            {
                return BadRequest(new ApiResponse<object> { Success = false, Message = "So luong nhap/xuat phai lon hon 0." });
            }

            var movementType = dto.MovementType == "StockOut" ? "StockOut" : "StockIn";
            var quantityChange = movementType == "StockOut" ? -dto.Quantity : dto.Quantity;
            var nextStock = product.StockQuantity + quantityChange;
            if (nextStock < 0)
            {
                return BadRequest(new ApiResponse<object> { Success = false, Message = "So luong xuat vuot qua ton kho hien tai." });
            }

            product.StockQuantity = nextStock;
            product.UpdatedAt = DateTime.UtcNow;
            var reason = string.IsNullOrWhiteSpace(dto.Reason)
                ? (movementType == "StockIn" ? "Admin nhap kho thu cong." : "Admin xuat kho thu cong.")
                : dto.Reason.Trim();

            AddInventoryTransaction(
                product.Id,
                null,
                quantityChange,
                product.StockQuantity,
                movementType,
                reason,
                GetUserId(),
                "Admin");

            AddAuditLog("InventoryAdjustment", "Product", product.Id, $"{(movementType == "StockIn" ? "Nhap" : "Xuat")} kho {dto.Quantity} {product.Unit} cho {product.Name}.", new { product.Sku, MovementType = movementType, dto.Quantity, BalanceAfter = product.StockQuantity, Reason = reason });
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Da cap nhat ton kho thu cong.",
                Data = new
                {
                    product.Id,
                    ProductName = product.Name,
                    product.Sku,
                    product.Unit,
                    product.StockQuantity,
                    QuantityChange = quantityChange,
                    MovementType = movementType
                }
            });
        }

        [HttpGet("support-requests")]
        public async Task<ActionResult<ApiResponse<List<object>>>> GetSupportRequests(
            [FromQuery] string? status = null,
            [FromQuery] int take = 100)
        {
            var query = _context.SupportRequests
                .Include(r => r.Order)
                .ThenInclude(o => o.Package)
                .Include(r => r.Customer)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(status) && status != "All")
            {
                query = query.Where(r => r.Status == status);
            }

            var safeTake = Math.Clamp(take, 1, 200);
            var requests = await query
                .OrderByDescending(r => r.UpdatedAt ?? r.CreatedAt)
                .Take(safeTake)
                .Select(r => new
                {
                    r.Id,
                    r.OrderId,
                    ProductName = r.Order.Package.Name,
                    r.CustomerId,
                    CustomerName = r.Customer.FullName,
                    CustomerPhone = r.Customer.PhoneNumber,
                    r.RequestType,
                    r.Reason,
                    r.RequestedResolution,
                    r.Status,
                    r.AdminNote,
                    r.CreatedAt,
                    r.UpdatedAt,
                    r.ResolvedAt
                })
                .Cast<object>()
                .ToListAsync();

            return Ok(new ApiResponse<List<object>>
            {
                Success = true,
                Message = "Lay danh sach yeu cau ho tro thanh cong.",
                Data = requests
            });
        }

        [HttpPut("support-requests/{id}")]
        public async Task<ActionResult<ApiResponse<object>>> UpdateSupportRequest(int id, UpdateSupportRequestDto dto)
        {
            var request = await _context.SupportRequests
                .Include(r => r.Order)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request == null)
            {
                return NotFound(new ApiResponse<object> { Success = false, Message = "Khong tim thay yeu cau ho tro." });
            }

            var allowed = new HashSet<string> { "Open", "InProgress", "Resolved", "Rejected" };
            var status = allowed.Contains(dto.Status) ? dto.Status : "InProgress";
            request.Status = status;
            request.AdminNote = dto.AdminNote?.Trim() ?? string.Empty;
            request.UpdatedAt = DateTime.UtcNow;
            request.ResolvedAt = status is "Resolved" or "Rejected" ? DateTime.UtcNow : null;

            _context.Notifications.Add(new Notification
            {
                UserId = request.CustomerId,
                Title = "Yeu cau ho tro da cap nhat",
                Content = $"Yeu cau cho don #{request.OrderId} dang o trang thai {status}.",
                CreatedAt = DateTime.UtcNow
            });

            AddAuditLog("UpdateSupportRequest", "SupportRequest", request.Id, $"Cap nhat yeu cau ho tro #{request.Id} sang {status}.", new { request.OrderId, Status = status, request.AdminNote });
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object> { Success = true, Message = "Da cap nhat yeu cau ho tro." });
        }

        [HttpGet("reports")]
        public async Task<ActionResult<ApiResponse<object>>> GetReports(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            var rangeStart = fromDate?.Date;
            var rangeEnd = toDate?.Date.AddDays(1);

            var ordersQuery = _context.Orders.AsQueryable();
            var paymentsQuery = _context.Payments.AsQueryable();
            var supportQuery = _context.SupportRequests.AsQueryable();

            if (rangeStart.HasValue)
            {
                ordersQuery = ordersQuery.Where(o => o.CreatedAt >= rangeStart.Value);
                paymentsQuery = paymentsQuery.Where(p => p.CreatedAt >= rangeStart.Value);
                supportQuery = supportQuery.Where(r => r.CreatedAt >= rangeStart.Value);
            }

            if (rangeEnd.HasValue)
            {
                ordersQuery = ordersQuery.Where(o => o.CreatedAt < rangeEnd.Value);
                paymentsQuery = paymentsQuery.Where(p => p.CreatedAt < rangeEnd.Value);
                supportQuery = supportQuery.Where(r => r.CreatedAt < rangeEnd.Value);
            }

            var paidPaymentsQuery = _context.Payments.Where(p => p.PaymentStatus == "Paid");
            if (rangeStart.HasValue)
            {
                paidPaymentsQuery = paidPaymentsQuery.Where(p => p.PaidAt != null && p.PaidAt >= rangeStart.Value);
            }

            if (rangeEnd.HasValue)
            {
                paidPaymentsQuery = paidPaymentsQuery.Where(p => p.PaidAt != null && p.PaidAt < rangeEnd.Value);
            }

            var ordersByStatus = await ordersQuery
                .GroupBy(o => o.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToListAsync();

            var packagesByCategory = await _context.Packages
                .GroupBy(p => p.Category)
                .Select(g => new { Category = g.Key, Count = g.Count() })
                .ToListAsync();

            var lowStockProducts = await _context.Packages
                .Where(p => p.StockQuantity <= 50 && p.IsActive)
                .OrderBy(p => p.StockQuantity)
                .Take(10)
                .Select(p => new { p.Id, p.Name, p.Sku, p.Unit, p.StockQuantity })
                .ToListAsync();

            var revenueByDay = await paidPaymentsQuery
                .Where(p => p.PaidAt != null)
                .GroupBy(p => p.PaidAt!.Value.Date)
                .OrderByDescending(g => g.Key)
                .Take(14)
                .Select(g => new { Date = g.Key, Revenue = g.Sum(p => p.Amount), Count = g.Count() })
                .ToListAsync();

            var revenueByMonth = await paidPaymentsQuery
                .Where(p => p.PaidAt != null)
                .GroupBy(p => new { p.PaidAt!.Value.Year, p.PaidAt!.Value.Month })
                .OrderByDescending(g => g.Key.Year)
                .ThenByDescending(g => g.Key.Month)
                .Take(12)
                .Select(g => new { g.Key.Year, g.Key.Month, Revenue = g.Sum(p => p.Amount), Count = g.Count() })
                .ToListAsync();

            var bestSellingProducts = await _context.OrderItems
                .Include(i => i.Order)
                .Include(i => i.Package)
                .Where(i =>
                    (!rangeStart.HasValue || i.Order.CreatedAt >= rangeStart.Value) &&
                    (!rangeEnd.HasValue || i.Order.CreatedAt < rangeEnd.Value))
                .GroupBy(i => new { i.PackageId, i.Package.Name, i.Package.Sku, i.Package.Unit })
                .OrderByDescending(g => g.Sum(i => i.Quantity))
                .Take(10)
                .Select(g => new
                {
                    ProductId = g.Key.PackageId,
                    ProductName = g.Key.Name,
                    g.Key.Sku,
                    g.Key.Unit,
                    QuantitySold = g.Sum(i => i.Quantity),
                    Revenue = g.Sum(i => i.LineTotal)
                })
                .ToListAsync();

            var codUncollected = await paymentsQuery
                .Include(p => p.Order)
                .ThenInclude(o => o.Customer)
                .Where(p => p.PaymentMethod == "MockCOD" && p.PaymentStatus == "Pending")
                .OrderByDescending(p => p.CreatedAt)
                .Take(20)
                .Select(p => new
                {
                    p.OrderId,
                    CustomerName = p.Order.Customer.FullName,
                    p.Amount,
                    p.CreatedAt
                })
                .ToListAsync();

            var awaitingTransfers = await paymentsQuery
                .Include(p => p.Order)
                .ThenInclude(o => o.Customer)
                .Where(p => p.PaymentMethod == "MockBanking" && p.PaymentStatus == "AwaitingTransfer")
                .OrderByDescending(p => p.CreatedAt)
                .Take(20)
                .Select(p => new
                {
                    p.OrderId,
                    CustomerName = p.Order.Customer.FullName,
                    p.Amount,
                    p.TransferReference,
                    p.PaymentNote,
                    p.CreatedAt
                })
                .ToListAsync();

            var topCustomers = await ordersQuery
                .Include(o => o.Customer)
                .Where(o => o.Status != OrderWorkflow.Cancelled)
                .GroupBy(o => new { o.CustomerId, o.Customer.FullName, o.Customer.PhoneNumber })
                .OrderByDescending(g => g.Sum(o => o.TotalPrice))
                .Take(10)
                .Select(g => new
                {
                    g.Key.CustomerId,
                    CustomerName = g.Key.FullName,
                    g.Key.PhoneNumber,
                    OrderCount = g.Count(),
                    TotalSpent = g.Sum(o => o.TotalPrice)
                })
                .ToListAsync();

            var cancelledOrders = await ordersQuery
                .Include(o => o.Customer)
                .Include(o => o.Package)
                .Where(o => o.Status == OrderWorkflow.Cancelled)
                .OrderByDescending(o => o.UpdatedAt ?? o.CreatedAt)
                .Take(20)
                .Select(o => new
                {
                    o.Id,
                    CustomerName = o.Customer.FullName,
                    ProductName = o.Package.Name,
                    o.TotalPrice,
                    o.UpdatedAt,
                    Reason = _context.OrderStatusHistories
                        .Where(h => h.OrderId == o.Id && h.ToStatus == OrderWorkflow.Cancelled)
                        .OrderByDescending(h => h.CreatedAt)
                        .Select(h => h.Note)
                        .FirstOrDefault() ?? ""
                })
                .ToListAsync();

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Lấy báo cáo thành công.",
                Data = new
                {
                    OrdersByStatus = ordersByStatus,
                    PackagesByCategory = packagesByCategory,
                    PaidRevenue = await paidPaymentsQuery.SumAsync(p => p.Amount),
                    LowStockProducts = lowStockProducts,
                    RevenueByDay = revenueByDay,
                    RevenueByMonth = revenueByMonth,
                    BestSellingProducts = bestSellingProducts,
                    CodUncollected = codUncollected,
                    AwaitingTransfers = awaitingTransfers,
                    TopCustomers = topCustomers,
                    CancelledOrders = cancelledOrders,
                    OpenSupportRequests = await supportQuery.CountAsync(r => r.Status == "Open" || r.Status == "InProgress"),
                    DateFrom = rangeStart,
                    DateTo = toDate?.Date
                }
            });
        }

        [HttpGet("reports/export")]
        public async Task<IActionResult> ExportReportsCsv(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            var rangeStart = fromDate?.Date;
            var rangeEnd = toDate?.Date.AddDays(1);

            var paidPaymentsQuery = _context.Payments.Where(p => p.PaymentStatus == "Paid" && p.PaidAt != null);
            var ordersQuery = _context.Orders.AsQueryable();

            if (rangeStart.HasValue)
            {
                paidPaymentsQuery = paidPaymentsQuery.Where(p => p.PaidAt >= rangeStart.Value);
                ordersQuery = ordersQuery.Where(o => o.CreatedAt >= rangeStart.Value);
            }

            if (rangeEnd.HasValue)
            {
                paidPaymentsQuery = paidPaymentsQuery.Where(p => p.PaidAt < rangeEnd.Value);
                ordersQuery = ordersQuery.Where(o => o.CreatedAt < rangeEnd.Value);
            }

            var revenueByDay = await paidPaymentsQuery
                .GroupBy(p => p.PaidAt!.Value.Date)
                .OrderByDescending(g => g.Key)
                .Select(g => new { Date = g.Key, Revenue = g.Sum(p => p.Amount), Count = g.Count() })
                .ToListAsync();

            var ordersByStatus = await ordersQuery
                .GroupBy(o => o.Status)
                .Select(g => new { Status = g.Key, Count = g.Count(), Revenue = g.Sum(o => o.TotalPrice) })
                .ToListAsync();

            var bestSellingProducts = await _context.OrderItems
                .Include(i => i.Order)
                .Include(i => i.Package)
                .Where(i =>
                    (!rangeStart.HasValue || i.Order.CreatedAt >= rangeStart.Value) &&
                    (!rangeEnd.HasValue || i.Order.CreatedAt < rangeEnd.Value))
                .GroupBy(i => new { i.PackageId, i.Package.Name, i.Package.Sku, i.Package.Unit })
                .OrderByDescending(g => g.Sum(i => i.Quantity))
                .Take(50)
                .Select(g => new
                {
                    ProductId = g.Key.PackageId,
                    ProductName = g.Key.Name,
                    g.Key.Sku,
                    g.Key.Unit,
                    QuantitySold = g.Sum(i => i.Quantity),
                    Revenue = g.Sum(i => i.LineTotal)
                })
                .ToListAsync();

            var totalPaidRevenue = await paidPaymentsQuery.SumAsync(p => p.Amount);

            var csv = new StringBuilder();
            csv.AppendLine("sep=,");
            csv.AppendLine("BÁO CÁO VẬN HÀNH");
            csv.AppendLine($"Từ ngày,{Csv(fromDate?.ToString("dd/MM/yyyy") ?? "Tất cả")}");
            csv.AppendLine($"Đến ngày,{Csv(toDate?.ToString("dd/MM/yyyy") ?? "Tất cả")}");
            csv.AppendLine($"Ngày xuất,{Csv(DateTime.UtcNow.AddHours(7).ToString("dd/MM/yyyy HH:mm"))}");
            csv.AppendLine($"Tổng doanh thu đã thanh toán,{totalPaidRevenue}");
            csv.AppendLine();
            csv.AppendLine("DOANH THU THEO NGÀY");
            csv.AppendLine("Ngày,Số đơn,Doanh thu");
            foreach (var item in revenueByDay)
            {
                csv.AppendLine($"{item.Date:dd/MM/yyyy},{item.Count},{item.Revenue}");
            }

            csv.AppendLine();
            csv.AppendLine("ĐƠN THEO TRẠNG THÁI");
            csv.AppendLine("Trạng thái,Số đơn,Tổng giá trị đơn");
            foreach (var item in ordersByStatus)
            {
                csv.AppendLine($"{Csv(item.Status)},{item.Count},{item.Revenue}");
            }

            csv.AppendLine();
            csv.AppendLine("SẢN PHẨM BÁN CHẠY");
            csv.AppendLine("Mã sản phẩm,SKU,Tên sản phẩm,Số lượng,Đơn vị,Doanh thu");
            foreach (var item in bestSellingProducts)
            {
                csv.AppendLine($"{item.ProductId},{Csv(item.Sku)},{Csv(item.ProductName)},{item.QuantitySold},{Csv(item.Unit)},{item.Revenue}");
            }

            AddAuditLog("ExportReportCsv", "Report", null, "Xuất báo cáo CSV.", new { FromDate = fromDate, ToDate = toDate });
            await _context.SaveChangesAsync();

            var bytes = Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(csv.ToString())).ToArray();
            var fileName = $"bao-cao-van-hanh-{DateTime.UtcNow:yyyyMMddHHmmss}.csv";
            return File(bytes, "text/csv; charset=utf-8", fileName);
        }

        [HttpGet("reports/export-excel")]
        public async Task<IActionResult> ExportReportsExcel(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            var rangeStart = fromDate?.Date;
            var rangeEnd = toDate?.Date.AddDays(1);

            var paidPaymentsQuery = _context.Payments.Where(p => p.PaymentStatus == "Paid" && p.PaidAt != null);
            var ordersQuery = _context.Orders.AsQueryable();

            if (rangeStart.HasValue)
            {
                paidPaymentsQuery = paidPaymentsQuery.Where(p => p.PaidAt >= rangeStart.Value);
                ordersQuery = ordersQuery.Where(o => o.CreatedAt >= rangeStart.Value);
            }

            if (rangeEnd.HasValue)
            {
                paidPaymentsQuery = paidPaymentsQuery.Where(p => p.PaidAt < rangeEnd.Value);
                ordersQuery = ordersQuery.Where(o => o.CreatedAt < rangeEnd.Value);
            }

            var revenueByDay = await paidPaymentsQuery
                .GroupBy(p => p.PaidAt!.Value.Date)
                .OrderByDescending(g => g.Key)
                .Select(g => new { Date = g.Key, Revenue = g.Sum(p => p.Amount), Count = g.Count() })
                .ToListAsync();

            var ordersByStatus = await ordersQuery
                .GroupBy(o => o.Status)
                .Select(g => new { Status = g.Key, Count = g.Count(), Revenue = g.Sum(o => o.TotalPrice) })
                .ToListAsync();

            var bestSellingProducts = await _context.OrderItems
                .Include(i => i.Order)
                .Include(i => i.Package)
                .Where(i =>
                    (!rangeStart.HasValue || i.Order.CreatedAt >= rangeStart.Value) &&
                    (!rangeEnd.HasValue || i.Order.CreatedAt < rangeEnd.Value))
                .GroupBy(i => new { i.PackageId, i.Package.Name, i.Package.Sku, i.Package.Unit })
                .OrderByDescending(g => g.Sum(i => i.Quantity))
                .Take(50)
                .Select(g => new
                {
                    ProductId = g.Key.PackageId,
                    ProductName = g.Key.Name,
                    g.Key.Sku,
                    g.Key.Unit,
                    QuantitySold = g.Sum(i => i.Quantity),
                    Revenue = g.Sum(i => i.LineTotal)
                })
                .ToListAsync();

            static string H(object? value) => System.Net.WebUtility.HtmlEncode(Convert.ToString(value) ?? string.Empty);
            static string V(decimal value) => value.ToString("#,##0");

            var totalPaidRevenue = await paidPaymentsQuery.SumAsync(p => p.Amount);
            var html = new StringBuilder();
            html.AppendLine("<!doctype html><html><head><meta charset=\"utf-8\" />");
            html.AppendLine("<style>");
            html.AppendLine("body{font-family:Segoe UI,Arial,sans-serif;color:#102033}.title{font-size:24px;font-weight:800;color:#075985;margin-bottom:6px}.muted{color:#587086}.summary td{padding:8px 12px;border:1px solid #d8e6ef}.summary .label{background:#eaf8fd;font-weight:700}.section{margin-top:22px;font-size:17px;font-weight:800;color:#0e8bb2}table{border-collapse:collapse;width:100%;margin-top:8px}th{background:#0e8bb2;color:#fff;font-weight:800;padding:9px;border:1px solid #0b7394;text-align:left}td{padding:8px;border:1px solid #d8e6ef}tr:nth-child(even) td{background:#f7fbfd}.num{text-align:right;font-weight:700}.money{text-align:right;color:#047857;font-weight:800}");
            html.AppendLine("</style></head><body>");
            html.AppendLine("<div class=\"title\">BAO CAO VAN HANH</div>");
            html.AppendLine("<div class=\"muted\">Ngoc Anh Phu Thinh 9 - xuat tu he thong quan tri</div>");
            html.AppendLine("<table class=\"summary\">");
            html.AppendLine($"<tr><td class=\"label\">Tu ngay</td><td>{H(fromDate?.ToString("dd/MM/yyyy") ?? "Tat ca")}</td><td class=\"label\">Den ngay</td><td>{H(toDate?.ToString("dd/MM/yyyy") ?? "Tat ca")}</td></tr>");
            html.AppendLine($"<tr><td class=\"label\">Ngay xuat</td><td>{H(DateTime.UtcNow.AddHours(7).ToString("dd/MM/yyyy HH:mm"))}</td><td class=\"label\">Tong doanh thu da thanh toan</td><td class=\"money\">{V(totalPaidRevenue)}d</td></tr>");
            html.AppendLine("</table>");

            html.AppendLine("<div class=\"section\">1. Doanh thu theo ngay</div><table><thead><tr><th>Ngay</th><th>So don</th><th>Doanh thu</th></tr></thead><tbody>");
            foreach (var item in revenueByDay)
            {
                html.AppendLine($"<tr><td>{item.Date:dd/MM/yyyy}</td><td class=\"num\">{item.Count}</td><td class=\"money\">{V(item.Revenue)}d</td></tr>");
            }
            html.AppendLine("</tbody></table>");

            html.AppendLine("<div class=\"section\">2. Don theo trang thai</div><table><thead><tr><th>Trang thai</th><th>So don</th><th>Tong gia tri don</th></tr></thead><tbody>");
            foreach (var item in ordersByStatus)
            {
                html.AppendLine($"<tr><td>{H(item.Status)}</td><td class=\"num\">{item.Count}</td><td class=\"money\">{V(item.Revenue)}d</td></tr>");
            }
            html.AppendLine("</tbody></table>");

            html.AppendLine("<div class=\"section\">3. San pham ban chay</div><table><thead><tr><th>Ma san pham</th><th>SKU</th><th>Ten san pham</th><th>So luong</th><th>Don vi</th><th>Doanh thu</th></tr></thead><tbody>");
            foreach (var item in bestSellingProducts)
            {
                html.AppendLine($"<tr><td class=\"num\">{item.ProductId}</td><td>{H(item.Sku)}</td><td>{H(item.ProductName)}</td><td class=\"num\">{item.QuantitySold}</td><td>{H(item.Unit)}</td><td class=\"money\">{V(item.Revenue)}d</td></tr>");
            }
            html.AppendLine("</tbody></table></body></html>");

            AddAuditLog("ExportReportExcel", "Report", null, "Xuat bao cao Excel.", new { FromDate = fromDate, ToDate = toDate });
            await _context.SaveChangesAsync();

            var bytes = Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(html.ToString())).ToArray();
            var fileName = $"bao-cao-van-hanh-{DateTime.UtcNow:yyyyMMddHHmmss}.xls";
            return File(bytes, "application/vnd.ms-excel; charset=utf-8", fileName);
        }

        [HttpGet("audit-logs")]
        public async Task<ActionResult<ApiResponse<List<object>>>> GetAuditLogs(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] string? action = null,
            [FromQuery] int take = 100)
        {
            var query = _context.AdminAuditLogs
                .Include(l => l.AdminUser)
                .AsQueryable();

            if (fromDate.HasValue)
            {
                query = query.Where(l => l.CreatedAt >= fromDate.Value.Date);
            }

            if (toDate.HasValue)
            {
                query = query.Where(l => l.CreatedAt < toDate.Value.Date.AddDays(1));
            }

            if (!string.IsNullOrWhiteSpace(action) && action != "All")
            {
                query = query.Where(l => l.Action == action);
            }

            var safeTake = Math.Clamp(take, 1, 300);
            var logs = await query
                .OrderByDescending(l => l.CreatedAt)
                .Take(safeTake)
                .Select(l => new
                {
                    l.Id,
                    l.AdminUserId,
                    AdminName = l.AdminUser == null ? l.AdminName : l.AdminUser.FullName,
                    AdminEmail = l.AdminUser == null ? "" : l.AdminUser.Email,
                    l.Action,
                    l.EntityType,
                    l.EntityId,
                    l.Summary,
                    l.MetadataJson,
                    l.CreatedAt
                })
                .Cast<object>()
                .ToListAsync();

            return Ok(new ApiResponse<List<object>>
            {
                Success = true,
                Message = "Lay audit log thanh cong.",
                Data = logs
            });
        }

        [HttpGet("audit-logs/{id}")]
        public async Task<ActionResult<ApiResponse<object>>> GetAuditLogDetail(int id)
        {
            var log = await _context.AdminAuditLogs
                .Include(l => l.AdminUser)
                .Where(l => l.Id == id)
                .Select(l => new
                {
                    l.Id,
                    l.AdminUserId,
                    AdminName = l.AdminUser == null ? l.AdminName : l.AdminUser.FullName,
                    AdminEmail = l.AdminUser == null ? "" : l.AdminUser.Email,
                    l.Action,
                    l.EntityType,
                    l.EntityId,
                    l.Summary,
                    l.MetadataJson,
                    l.CreatedAt
                })
                .FirstOrDefaultAsync();

            if (log == null)
            {
                return NotFound(new ApiResponse<object> { Success = false, Message = "Không tìm thấy nhật ký thao tác." });
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Lấy chi tiết nhật ký thành công.",
                Data = log
            });
        }

        private async Task<ActionResult<ApiResponse<object>>> SetPackageApproval(int id, bool isApproved, string message)
        {
            var package = await _context.Packages.FindAsync(id);
            if (package == null)
            {
                return NotFound(new ApiResponse<object> { Success = false, Message = "Không tìm thấy sản phẩm." });
            }

            package.IsApproved = isApproved;
            package.IsActive = isApproved;
            package.UpdatedAt = DateTime.UtcNow;
            AddAuditLog(isApproved ? "ApprovePackage" : "RejectPackage", "Product", package.Id, $"{(isApproved ? "Duyet" : "Tu choi")} san pham #{package.Id}.", new { package.Id, isApproved });
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object> { Success = true, Message = message });
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

        private string EnsureWebRoot()
        {
            var webRoot = _environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            Directory.CreateDirectory(webRoot);
            return webRoot;
        }

        private void DeleteUploadedFileIfLocal(string imageUrl)
        {
            if (string.IsNullOrWhiteSpace(imageUrl))
            {
                return;
            }

            var relativeUrl = imageUrl;
            if (Uri.TryCreate(imageUrl, UriKind.Absolute, out var uri))
            {
                relativeUrl = uri.AbsolutePath;
            }

            if (!relativeUrl.StartsWith("/uploads/products/", StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            var webRoot = EnsureWebRoot();
            var relativePath = relativeUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
            var fullPath = Path.GetFullPath(Path.Combine(webRoot, relativePath));
            var rootPath = Path.GetFullPath(webRoot);

            if (fullPath.StartsWith(rootPath, StringComparison.OrdinalIgnoreCase) && System.IO.File.Exists(fullPath))
            {
                System.IO.File.Delete(fullPath);
            }
        }

        private int? GetUserId()
        {
            var value = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(value, out var id) ? id : null;
        }

        private string GetAdminName()
        {
            return User.FindFirst(ClaimTypes.Email)?.Value ?? "Admin";
        }

        private void AddAuditLog(string action, string entityType, int? entityId, string summary, object? metadata = null)
        {
            _context.AdminAuditLogs.Add(new AdminAuditLog
            {
                AdminUserId = GetUserId(),
                AdminName = GetAdminName(),
                Action = action,
                EntityType = entityType,
                EntityId = entityId,
                Summary = summary,
                MetadataJson = metadata == null ? string.Empty : JsonSerializer.Serialize(metadata),
                CreatedAt = DateTime.UtcNow
            });
        }

        private static string Csv(string? value)
        {
            var text = value ?? string.Empty;
            if (text.Contains('"') || text.Contains(',') || text.Contains('\n') || text.Contains('\r'))
            {
                return $"\"{text.Replace("\"", "\"\"")}\"";
            }

            return text;
        }

        private void AddStatusHistory(int orderId, string fromStatus, string toStatus, string note)
        {
            _context.OrderStatusHistories.Add(new OrderStatusHistory
            {
                OrderId = orderId,
                FromStatus = fromStatus,
                ToStatus = toStatus,
                ChangedByUserId = GetUserId(),
                ChangedByRole = "Admin",
                Note = note,
                CreatedAt = DateTime.UtcNow
            });
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

        private async Task ConfirmCodIfNeeded(int orderId)
        {
            var payment = await _context.Payments.FirstOrDefaultAsync(p => p.OrderId == orderId);
            if (payment == null || payment.PaymentMethod != "MockCOD" || payment.PaymentStatus != "Pending")
            {
                return;
            }

            payment.PaymentStatus = "Paid";
            payment.PaidAt = DateTime.UtcNow;
            payment.ConfirmedAt = DateTime.UtcNow;
            payment.ConfirmedByUserId = GetUserId();
            payment.PaymentNote = "Admin xac nhan COD da thu khi don giao thanh cong.";
        }
    }
}
