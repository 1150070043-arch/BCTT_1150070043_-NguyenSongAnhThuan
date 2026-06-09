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
    [Route("api/provider")]
    [ApiController]
    [Authorize(Roles = "Provider")]
    public class ProviderWorkController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProviderWorkController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("packages")]
        public async Task<ActionResult<ApiResponse<List<PackageDto>>>> GetPackages()
        {
            var providerId = GetProviderId();
            if (providerId == null)
            {
                return Unauthorized(new ApiResponse<List<PackageDto>> { Success = false, Message = "Không tìm thấy thông tin nhà cung cấp." });
            }

            var packages = await _context.Packages
                .Include(p => p.Provider)
                .Where(p => p.ProviderId == providerId.Value)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            return Ok(new ApiResponse<List<PackageDto>>
            {
                Success = true,
                Message = "Lấy danh sách sản phẩm thành công.",
                Data = packages.Select(ToPackageDto).ToList()
            });
        }

        [HttpPost("packages")]
        public async Task<ActionResult<ApiResponse<PackageDto>>> CreatePackage(CreatePackageDto dto)
        {
            var providerId = GetProviderId();
            if (providerId == null)
            {
                return Unauthorized(new ApiResponse<PackageDto> { Success = false, Message = "Không tìm thấy thông tin nhà cung cấp." });
            }

            var provider = await _context.Providers.FindAsync(providerId.Value);
            if (provider == null)
            {
                return NotFound(new ApiResponse<PackageDto> { Success = false, Message = "Nhà cung cấp không tồn tại." });
            }

            if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Sku) || string.IsNullOrWhiteSpace(dto.Unit) || dto.Price <= 0 || dto.DeliveryDays <= 0 || dto.StockQuantity < 0)
            {
                return BadRequest(new ApiResponse<PackageDto> { Success = false, Message = "Tên sản phẩm, giá và thời gian giao hàng không hợp lệ." });
            }

            var sku = dto.Sku.Trim();
            var skuExists = await _context.Packages.AnyAsync(p => p.Sku == sku);
            if (skuExists)
            {
                return BadRequest(new ApiResponse<PackageDto> { Success = false, Message = "SKU da ton tai." });
            }

            var package = new Package
            {
                ProviderId = providerId.Value,
                Name = dto.Name.Trim(),
                Description = dto.Description?.Trim() ?? string.Empty,
                Price = dto.Price,
                Category = dto.Category,
                DeliveryDays = dto.DeliveryDays,
                Revisions = dto.Revisions,
                Features = JsonSerializer.Serialize(dto.Features),
                Sku = sku,
                Unit = dto.Unit.Trim(),
                StockQuantity = dto.StockQuantity,
                ShortDescription = dto.ShortDescription?.Trim() ?? string.Empty,
                ImageUrl = dto.ImageUrl?.Trim() ?? string.Empty,
                IsFeatured = dto.IsFeatured,
                IsActive = true,
                IsApproved = false,
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
                    "Kho van tao san pham voi ton ban dau.",
                    GetUserId(),
                    "Provider");
                await _context.SaveChangesAsync();
            }
            await _context.Entry(package).Reference(p => p.Provider).LoadAsync();

            return Ok(new ApiResponse<PackageDto>
            {
                Success = true,
                Message = "Tạo sản phẩm thành công. Sản phẩm đang chờ quản trị viên duyệt.",
                Data = ToPackageDto(package)
            });
        }

        [HttpPut("packages/{id}")]
        public async Task<ActionResult<ApiResponse<PackageDto>>> UpdatePackage(int id, UpdatePackageDto dto)
        {
            var providerId = GetProviderId();
            if (providerId == null)
            {
                return Unauthorized(new ApiResponse<PackageDto> { Success = false, Message = "Không tìm thấy thông tin nhà cung cấp." });
            }

            var package = await _context.Packages
                .Include(p => p.Provider)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (package == null)
            {
                return NotFound(new ApiResponse<PackageDto> { Success = false, Message = "Không tìm thấy sản phẩm." });
            }

            if (package.ProviderId != providerId.Value)
            {
                return Forbid();
            }

            if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Sku) || string.IsNullOrWhiteSpace(dto.Unit) || dto.Price <= 0 || dto.DeliveryDays <= 0 || dto.StockQuantity < 0)
            {
                return BadRequest(new ApiResponse<PackageDto> { Success = false, Message = "Thong tin san pham khong hop le." });
            }

            var sku = dto.Sku.Trim();
            var skuExists = await _context.Packages.AnyAsync(p => p.Id != id && p.Sku == sku);
            if (skuExists)
            {
                return BadRequest(new ApiResponse<PackageDto> { Success = false, Message = "SKU da ton tai." });
            }

            var previousStock = package.StockQuantity;

            package.Name = dto.Name.Trim();
            package.Description = dto.Description?.Trim() ?? string.Empty;
            package.Price = dto.Price;
            package.Category = dto.Category;
            package.DeliveryDays = dto.DeliveryDays;
            package.Revisions = dto.Revisions;
            package.Features = JsonSerializer.Serialize(dto.Features);
            package.Sku = sku;
            package.Unit = dto.Unit.Trim();
            package.StockQuantity = dto.StockQuantity;
            package.ShortDescription = dto.ShortDescription?.Trim() ?? string.Empty;
            package.ImageUrl = dto.ImageUrl?.Trim() ?? string.Empty;
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
                    "Kho van dieu chinh ton san pham.",
                    GetUserId(),
                    "Provider");
            }

            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<PackageDto>
            {
                Success = true,
                Message = "Cập nhật sản phẩm thành công.",
                Data = ToPackageDto(package)
            });
        }

        [HttpGet("orders")]
        public async Task<ActionResult<ApiResponse<List<object>>>> GetOrders()
        {
            var providerId = GetProviderId();
            if (providerId == null)
            {
                return Unauthorized(new ApiResponse<List<object>> { Success = false, Message = "Không tìm thấy thông tin nhà cung cấp." });
            }

            var orders = await _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.Package)
                .Include(o => o.ProjectDeliveries)
                .Where(o => o.ProviderId == providerId.Value)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

            return Ok(new ApiResponse<List<object>>
            {
                Success = true,
                Message = "Lấy danh sách đơn hàng của nhà cung cấp thành công.",
                Data = orders.Select(o => new
                {
                    o.Id,
                    CustomerName = o.Customer.FullName,
                    PackageName = o.Package.Name,
                    ProductName = o.Package.Name,
                    o.Status,
                    o.TotalPrice,
                    o.Requirements,
                    o.AssignedStaffName,
                    o.DeliveryRoute,
                    o.TrackingCode,
                    o.EstimatedDeliveryAt,
                    o.DeliveryNote,
                    o.DeliveryProofImageUrl,
                    o.DeliveryFailureReason,
                    o.CreatedAt,
                    DeliveryCount = o.ProjectDeliveries.Count
                }).Cast<object>().ToList()
            });
        }

        [HttpPut("orders/{id}/delivery-assignment")]
        public async Task<ActionResult<ApiResponse<object>>> UpdateDeliveryAssignment(int id, UpdateDeliveryAssignmentDto dto)
        {
            var providerId = GetProviderId();
            if (providerId == null)
            {
                return Unauthorized(new ApiResponse<object> { Success = false, Message = "Khong tim thay thong tin kho van." });
            }

            var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == id);
            if (order == null)
            {
                return NotFound(new ApiResponse<object> { Success = false, Message = "Khong tim thay don hang." });
            }

            if (order.ProviderId != providerId.Value)
            {
                return Forbid();
            }

            var currentStatus = OrderWorkflow.Normalize(order.Status);
            if (currentStatus is OrderWorkflow.Completed or OrderWorkflow.Cancelled)
            {
                return BadRequest(new ApiResponse<object> { Success = false, Message = "Don hang da dong, khong the gan giao hang." });
            }

            order.AssignedStaffName = dto.AssignedStaffName?.Trim() ?? string.Empty;
            order.DeliveryRoute = dto.DeliveryRoute?.Trim() ?? string.Empty;
            order.TrackingCode = dto.TrackingCode?.Trim() ?? string.Empty;
            order.EstimatedDeliveryAt = dto.EstimatedDeliveryAt;
            order.DeliveryNote = dto.DeliveryNote?.Trim() ?? string.Empty;
            order.UpdatedAt = DateTime.UtcNow;

            AddStatusHistory(order.Id, currentStatus, currentStatus, "Kho van cap nhat nguoi phu trach/tuyen giao.");
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Da cap nhat thong tin phu trach va tuyen giao.",
                Data = new
                {
                    order.AssignedStaffName,
                    order.DeliveryRoute,
                    order.TrackingCode,
                    order.EstimatedDeliveryAt,
                    order.DeliveryNote
                }
            });
        }

        [HttpPut("orders/{id}/status")]
        public async Task<ActionResult<ApiResponse<object>>> UpdateOrderStatus(int id, UpdateOrderStatusDto dto)
        {
            var providerId = GetProviderId();
            if (providerId == null)
            {
                return Unauthorized(new ApiResponse<object> { Success = false, Message = "Không tìm thấy thông tin nhà cung cấp." });
            }

            var nextStatus = OrderWorkflow.Normalize(dto.Status);
            if (!OrderWorkflow.ValidStatuses.Contains(nextStatus))
            {
                return BadRequest(new ApiResponse<object> { Success = false, Message = "Trạng thái đơn hàng không hợp lệ." });
            }

            var order = await _context.Orders
                .Include(o => o.Customer)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
            {
                return NotFound(new ApiResponse<object> { Success = false, Message = "Không tìm thấy đơn hàng." });
            }

            if (order.ProviderId != providerId.Value)
            {
                return Forbid();
            }

            if (!OrderWorkflow.CanProviderTransition(order.Status, nextStatus))
            {
                return BadRequest(new ApiResponse<object> { Success = false, Message = "Trang thai tiep theo khong hop le cho kho van." });
            }

            var previousStatus = OrderWorkflow.Normalize(order.Status);
            order.Status = nextStatus;
            order.UpdatedAt = DateTime.UtcNow;
            if (nextStatus == OrderWorkflow.Completed) order.CompletedAt = DateTime.UtcNow;
            if (nextStatus == OrderWorkflow.Delivered)
            {
                await ConfirmCodIfNeeded(order.Id);
            }
            AddStatusHistory(order.Id, previousStatus, nextStatus, dto.Note?.Trim() ?? "Kho van cap nhat trang thai don hang.");

            _context.Notifications.Add(new Notification
            {
                UserId = order.CustomerId,
                Title = "Cập nhật trạng thái đơn hàng",
                Content = $"Don hang #{order.Id} da chuyen sang trang thai {nextStatus}.",
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object> { Success = true, Message = "Cập nhật trạng thái đơn hàng thành công." });
        }

        [HttpPut("orders/{id}/delivery-failed")]
        public async Task<ActionResult<ApiResponse<object>>> MarkDeliveryFailed(int id, FailDeliveryDto dto)
        {
            var providerId = GetProviderId();
            if (providerId == null)
            {
                return Unauthorized(new ApiResponse<object> { Success = false, Message = "Khong tim thay thong tin kho van." });
            }

            var reason = dto.Reason?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(reason))
            {
                return BadRequest(new ApiResponse<object> { Success = false, Message = "Vui long nhap ly do khong giao duoc." });
            }

            var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == id);
            if (order == null)
            {
                return NotFound(new ApiResponse<object> { Success = false, Message = "Khong tim thay don hang." });
            }

            if (order.ProviderId != providerId.Value)
            {
                return Forbid();
            }

            if (!OrderWorkflow.CanProviderTransition(order.Status, OrderWorkflow.DeliveryFailed))
            {
                return BadRequest(new ApiResponse<object> { Success = false, Message = "Chi co the bao khong giao duoc khi don dang giao." });
            }

            var previousStatus = OrderWorkflow.Normalize(order.Status);
            order.Status = OrderWorkflow.DeliveryFailed;
            order.DeliveryFailureReason = reason;
            order.DeliveryNote = string.IsNullOrWhiteSpace(dto.Note) ? order.DeliveryNote : dto.Note.Trim();
            order.UpdatedAt = DateTime.UtcNow;

            AddStatusHistory(order.Id, previousStatus, OrderWorkflow.DeliveryFailed, $"Khong giao duoc: {reason}");
            _context.Notifications.Add(new Notification
            {
                UserId = order.CustomerId,
                Title = "Don hang chua giao duoc",
                Content = $"Don hang #{order.Id} chua giao duoc. Ly do: {reason}",
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object> { Success = true, Message = "Da ghi nhan don hang khong giao duoc." });
        }

        private PackageDto ToPackageDto(Package package)
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
                CreatedAt = package.CreatedAt
            };
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

        private void AddStatusHistory(int orderId, string fromStatus, string toStatus, string note)
        {
            _context.OrderStatusHistories.Add(new OrderStatusHistory
            {
                OrderId = orderId,
                FromStatus = fromStatus,
                ToStatus = toStatus,
                ChangedByUserId = GetUserId(),
                ChangedByRole = "Provider",
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
            payment.PaymentNote = "Kho van xac nhan da thu COD khi giao hang.";
        }
    }
}
