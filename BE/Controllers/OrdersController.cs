using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Security.Claims;
using System.Text;
using WebsiteServiceEcommerce.API.Data;
using WebsiteServiceEcommerce.API.DTOs;
using WebsiteServiceEcommerce.API.Helpers;
using WebsiteServiceEcommerce.API.Models;

namespace WebsiteServiceEcommerce.API.Controllers
{
    [Route("api/orders")]
    [ApiController]
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public OrdersController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult<ApiResponse<object>>> CreateOrder(CreateOrderDto dto)
        {
            var customerId = GetUserId();
            if (customerId == null)
            {
                return Unauthorized(new ApiResponse<object> { Success = false, Message = "Token không hợp lệ." });
            }

            var shippingName = dto.ShippingName?.Trim() ?? string.Empty;
            var shippingPhone = dto.ShippingPhone?.Trim() ?? string.Empty;
            var shippingAddress = dto.ShippingAddress?.Trim() ?? string.Empty;
            var deliveryMethod = NormalizeDeliveryMethod(dto.DeliveryMethod);
            var paymentMethod = NormalizePaymentMethod(dto.PaymentMethod);
            var actorUserId = customerId.Value;
            var clientOrderKey = NormalizeClientOrderKey(dto.ClientOrderKey);

            if (
                dto.PackageId <= 0 ||
                dto.Quantity <= 0 ||
                string.IsNullOrWhiteSpace(shippingName) ||
                string.IsNullOrWhiteSpace(shippingPhone) ||
                string.IsNullOrWhiteSpace(shippingAddress))
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Vui lòng chọn sản phẩm, nhập số lượng, người nhận, số điện thoại và địa chỉ giao hàng."
                });
            }

            if (!IsValidPhone(shippingPhone))
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "So dien thoai giao hang khong hop le."
                });
            }

            if (!string.IsNullOrWhiteSpace(clientOrderKey))
            {
                var existingOrder = await GetOrderQuery()
                    .FirstOrDefaultAsync(o => o.CustomerId == customerId.Value && o.ClientOrderKey == clientOrderKey);

                if (existingOrder != null)
                {
                    return Ok(new ApiResponse<object>
                    {
                        Success = true,
                        Message = "Don hang nay da duoc tao truoc do.",
                        Data = ToOrderResponse(existingOrder)
                    });
                }
            }

            var requestedProduct = await _context.Packages
                .Include(p => p.Provider)
                    .ThenInclude(p => p.User)
                .FirstOrDefaultAsync(p => p.Id == dto.PackageId && p.IsActive && p.IsApproved);

            if (requestedProduct == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Không tìm thấy sản phẩm đang bán."
                });
            }

            var product = await ResolveFulfillmentProduct(requestedProduct, dto.Quantity, shippingAddress);
            if (product.StockQuantity < dto.Quantity)
            {
                var totalAvailable = await GetTotalBranchStock(requestedProduct);
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = totalAvailable > 0
                        ? $"San pham con tong {totalAvailable} {requestedProduct.Unit} nhung chua kho van nao du so luong {dto.Quantity} cho mot don."
                        : "San pham hien het hang o tat ca kho van."
                });
            }
            var totalPrice = product.Price * dto.Quantity;
            var order = new Order
            {
                CustomerId = customerId.Value,
                ProviderId = product.ProviderId,
                PackageId = product.Id,
                TotalPrice = totalPrice,
                Requirements = dto.Requirement?.Trim() ?? string.Empty,
                ShippingName = shippingName,
                ShippingPhone = shippingPhone,
                ShippingAddress = shippingAddress,
                DeliveryMethod = deliveryMethod,
                ClientOrderKey = clientOrderKey,
                Status = OrderWorkflow.Pending,
                CreatedAt = DateTime.UtcNow
            };

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            _context.OrderItems.Add(new OrderItem
            {
                OrderId = order.Id,
                PackageId = product.Id,
                Quantity = dto.Quantity,
                UnitPrice = product.Price,
                LineTotal = totalPrice
            });

            product.StockQuantity -= dto.Quantity;
            AddInventoryTransaction(
                product.Id,
                order.Id,
                -dto.Quantity,
                product.StockQuantity,
                "OrderReserved",
                $"Giu ton cho don hang #{order.Id}.",
                actorUserId,
                "Customer");

            var isPaidImmediately = paymentMethod == "MockWallet" || paymentMethod == "MockCard";
            var paymentStatus = paymentMethod == "MockBanking"
                ? "AwaitingTransfer"
                : paymentMethod == "VNPAY" ? "AwaitingVnpay"
                : isPaidImmediately ? "Paid" : "Pending";

            _context.Payments.Add(new Payment
            {
                OrderId = order.Id,
                Amount = totalPrice,
                PaymentMethod = paymentMethod,
                PaymentStatus = paymentStatus,
                TransferReference = dto.TransferReference?.Trim() ?? string.Empty,
                PaymentNote = dto.PaymentNote?.Trim() ?? string.Empty,
                PaidAt = isPaidImmediately ? DateTime.UtcNow : null,
                CreatedAt = DateTime.UtcNow
            });

            AddStatusHistory(order.Id, string.Empty, OrderWorkflow.Pending, actorUserId, "Customer", $"Khach hang tao don hang. Kho van xu ly: {product.Provider.CompanyName}.");

            _context.Notifications.Add(new Notification
            {
                UserId = product.Provider.UserId,
                Title = "Có đơn hàng mới",
                Content = $"Khách hàng vừa đặt {dto.Quantity} {product.Unit} {product.Name}.",
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            var createdOrder = await GetOrderQuery().FirstAsync(o => o.Id == order.Id);
            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Tạo đơn hàng thành công.",
                Data = ToOrderResponse(createdOrder)
            });
        }

        [HttpGet("my-orders")]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult<ApiResponse<List<object>>>> GetMyOrders()
        {
            var customerId = GetUserId();
            if (customerId == null)
            {
                return Unauthorized(new ApiResponse<List<object>> { Success = false, Message = "Token không hợp lệ." });
            }

            var orders = await GetOrderQuery()
                .Where(o => o.CustomerId == customerId.Value)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

            return Ok(new ApiResponse<List<object>>
            {
                Success = true,
                Message = "Lấy danh sách đơn hàng thành công.",
                Data = orders.Select(ToOrderResponse).ToList()
            });
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<object>>> GetOrder(int id)
        {
            var order = await GetOrderQuery().FirstOrDefaultAsync(o => o.Id == id);
            if (order == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Không tìm thấy đơn hàng."
                });
            }

            if (!CanAccessOrder(order))
            {
                return Forbid();
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Lấy chi tiết đơn hàng thành công.",
                Data = ToOrderResponse(order)
            });
        }

        [HttpPut("{id}/cancel")]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult<ApiResponse<object>>> CancelOrder(int id)
        {
            var customerId = GetUserId();
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .ThenInclude(i => i.Package)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
            {
                return NotFound(new ApiResponse<object> { Success = false, Message = "Không tìm thấy đơn hàng." });
            }

            if (order.CustomerId != customerId)
            {
                return Forbid();
            }

            if (!OrderWorkflow.CanCustomerCancel(order.Status))
            {
                return BadRequest(new ApiResponse<object> { Success = false, Message = "Không thể hủy đơn ở trạng thái hiện tại." });
            }

            foreach (var item in order.OrderItems)
            {
                item.Package.StockQuantity += item.Quantity;
                AddInventoryTransaction(
                    item.PackageId,
                    order.Id,
                    item.Quantity,
                    item.Package.StockQuantity,
                    "OrderCancelled",
                    $"Hoan ton do khach huy don #{order.Id}.",
                    customerId,
                    "Customer");
            }

            var previousStatus = OrderWorkflow.Normalize(order.Status);
            order.Status = OrderWorkflow.Cancelled;
            order.UpdatedAt = DateTime.UtcNow;

            var payment = await _context.Payments.FirstOrDefaultAsync(p => p.OrderId == order.Id);
            if (payment != null && payment.PaymentStatus != "Paid")
            {
                payment.PaymentStatus = "Cancelled";
            }

            AddStatusHistory(order.Id, previousStatus, OrderWorkflow.Cancelled, customerId, "Customer", "Khach hang huy don, hoan ton kho.");
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object> { Success = true, Message = "Hủy đơn hàng thành công." });
        }

        [HttpPut("{id}/complete")]
        [Authorize(Roles = "Customer,Admin")]
        public async Task<ActionResult<ApiResponse<object>>> CompleteOrder(int id)
        {
            var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == id);
            if (order == null)
            {
                return NotFound(new ApiResponse<object> { Success = false, Message = "Không tìm thấy đơn hàng." });
            }

            if (!CanAccessOrder(order))
            {
                return Forbid();
            }

            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            var currentStatus = OrderWorkflow.Normalize(order.Status);
            if (currentStatus == OrderWorkflow.Completed || currentStatus == OrderWorkflow.Cancelled)
            {
                return BadRequest(new ApiResponse<object> { Success = false, Message = "Khong the hoan tat don o trang thai hien tai." });
            }

            if (role != "Admin" && !OrderWorkflow.CanCustomerComplete(order.Status))
            {
                return BadRequest(new ApiResponse<object> { Success = false, Message = "Chi co the hoan tat don khi don da giao." });
            }

            order.Status = OrderWorkflow.Completed;
            order.CompletedAt = DateTime.UtcNow;
            order.UpdatedAt = DateTime.UtcNow;

            var payment = await _context.Payments.FirstOrDefaultAsync(p => p.OrderId == order.Id);
            if (payment != null && payment.PaymentMethod == "MockCOD" && payment.PaymentStatus == "Pending")
            {
                payment.PaymentStatus = "Paid";
                payment.PaidAt = DateTime.UtcNow;
                payment.ConfirmedAt = DateTime.UtcNow;
                payment.ConfirmedByUserId = GetUserId();
                payment.PaymentNote = "COD da thu khi khach xac nhan nhan hang.";
            }

            AddStatusHistory(order.Id, currentStatus, OrderWorkflow.Completed, GetUserId(), role ?? string.Empty, "Don hang hoan tat.");
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object> { Success = true, Message = "Đơn hàng đã hoàn tất." });
        }

        [HttpPost("{id}/reorder")]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult<ApiResponse<object>>> Reorder(int id)
        {
            var customerId = GetUserId();
            if (customerId == null)
            {
                return Unauthorized(new ApiResponse<object> { Success = false, Message = "Token khong hop le." });
            }

            var original = await _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == id && o.CustomerId == customerId.Value);

            if (original == null)
            {
                return NotFound(new ApiResponse<object> { Success = false, Message = "Khong tim thay don hang cu." });
            }

            var originalItem = original.OrderItems.FirstOrDefault();
            if (originalItem == null)
            {
                return BadRequest(new ApiResponse<object> { Success = false, Message = "Don hang cu khong co san pham de dat lai." });
            }

            var requestedProduct = await _context.Packages
                .Include(p => p.Provider)
                    .ThenInclude(p => p.User)
                .FirstOrDefaultAsync(p => p.Id == originalItem.PackageId && p.IsActive && p.IsApproved);

            if (requestedProduct == null)
            {
                return BadRequest(new ApiResponse<object> { Success = false, Message = "San pham trong don cu hien khong kha dung." });
            }

            var product = await ResolveFulfillmentProduct(requestedProduct, originalItem.Quantity, original.ShippingAddress);
            if (product.StockQuantity < originalItem.Quantity)
            {
                var totalAvailable = await GetTotalBranchStock(requestedProduct);
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = totalAvailable > 0
                        ? $"San pham con tong {totalAvailable} {requestedProduct.Unit} nhung chua kho van nao du so luong {originalItem.Quantity} cho mot don."
                        : "San pham hien het hang o tat ca kho van."
                });
            }

            var totalPrice = product.Price * originalItem.Quantity;
            var order = new Order
            {
                CustomerId = customerId.Value,
                ProviderId = product.ProviderId,
                PackageId = product.Id,
                TotalPrice = totalPrice,
                Requirements = string.IsNullOrWhiteSpace(original.Requirements)
                    ? $"Dat lai tu don #{original.Id}."
                    : $"{original.Requirements} | Dat lai tu don #{original.Id}.",
                ShippingName = original.ShippingName,
                ShippingPhone = original.ShippingPhone,
                ShippingAddress = original.ShippingAddress,
                DeliveryMethod = original.DeliveryMethod,
                Status = OrderWorkflow.Pending,
                CreatedAt = DateTime.UtcNow
            };

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            _context.OrderItems.Add(new OrderItem
            {
                OrderId = order.Id,
                PackageId = product.Id,
                Quantity = originalItem.Quantity,
                UnitPrice = product.Price,
                LineTotal = totalPrice
            });

            product.StockQuantity -= originalItem.Quantity;
            AddInventoryTransaction(product.Id, order.Id, -originalItem.Quantity, product.StockQuantity, "OrderReserved", $"Giu ton cho don dat lai #{order.Id}.", customerId, "Customer");

            _context.Payments.Add(new Payment
            {
                OrderId = order.Id,
                Amount = totalPrice,
                PaymentMethod = "MockCOD",
                PaymentStatus = "Pending",
                PaymentNote = $"Dat lai tu don #{original.Id}, thanh toan COD.",
                CreatedAt = DateTime.UtcNow
            });

            AddStatusHistory(order.Id, string.Empty, OrderWorkflow.Pending, customerId, "Customer", $"Khach hang dat lai tu don #{original.Id}.");
            _context.Notifications.Add(new Notification
            {
                UserId = product.Provider.UserId,
                Title = "Co don hang dat lai",
                Content = $"Khach hang dat lai {originalItem.Quantity} {product.Unit} {product.Name}.",
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            var created = await GetOrderQuery().FirstAsync(o => o.Id == order.Id);
            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Dat lai don hang thanh cong. Don moi dang cho kho xac nhan.",
                Data = ToOrderResponse(created)
            });
        }

        [HttpPost("{id}/support-requests")]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult<ApiResponse<object>>> CreateSupportRequest(int id, CreateSupportRequestDto dto)
        {
            var customerId = GetUserId();
            if (customerId == null)
            {
                return Unauthorized(new ApiResponse<object> { Success = false, Message = "Token khong hop le." });
            }

            var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == id);
            if (order == null)
            {
                return NotFound(new ApiResponse<object> { Success = false, Message = "Khong tim thay don hang." });
            }

            if (order.CustomerId != customerId.Value)
            {
                return Forbid();
            }

            var currentStatus = OrderWorkflow.Normalize(order.Status);
            if (currentStatus is OrderWorkflow.Pending or OrderWorkflow.Confirmed or OrderWorkflow.Preparing)
            {
                return BadRequest(new ApiResponse<object> { Success = false, Message = "Chi tao yeu cau ho tro sau khi don da giao, khong giao duoc hoac hoan tat." });
            }

            if (string.IsNullOrWhiteSpace(dto.Reason))
            {
                return BadRequest(new ApiResponse<object> { Success = false, Message = "Vui long nhap ly do can ho tro." });
            }

            var requestType = NormalizeSupportType(dto.RequestType);
            var request = new SupportRequest
            {
                OrderId = order.Id,
                CustomerId = customerId.Value,
                RequestType = requestType,
                Reason = dto.Reason.Trim(),
                RequestedResolution = dto.RequestedResolution?.Trim() ?? string.Empty,
                Status = "Open",
                CreatedAt = DateTime.UtcNow
            };

            _context.SupportRequests.Add(request);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Da gui yeu cau ho tro.",
                Data = ToSupportResponse(request)
            });
        }

        [HttpGet("{id}/support-requests")]
        public async Task<ActionResult<ApiResponse<List<object>>>> GetOrderSupportRequests(int id)
        {
            var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == id);
            if (order == null)
            {
                return NotFound(new ApiResponse<List<object>> { Success = false, Message = "Khong tim thay don hang." });
            }

            if (!CanAccessOrder(order))
            {
                return Forbid();
            }

            var requests = await _context.SupportRequests
                .Where(r => r.OrderId == id)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            return Ok(new ApiResponse<List<object>>
            {
                Success = true,
                Message = "Lay yeu cau ho tro thanh cong.",
                Data = requests.Select(ToSupportResponse).ToList()
            });
        }

        [HttpPut("{id}/request-revision")]
        [Authorize(Roles = "Customer")]
        public Task<ActionResult<ApiResponse<object>>> RequestRevision(int id)
        {
            ActionResult<ApiResponse<object>> result = BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = "Chức năng chỉnh sửa không áp dụng cho đơn hàng sản phẩm."
            });
            return Task.FromResult(result);
        }

        private IQueryable<Order> GetOrderQuery()
        {
            return _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.Provider)
                .ThenInclude(p => p.User)
                .Include(o => o.Package)
                .Include(o => o.OrderItems)
                .ThenInclude(i => i.Package)
                .Include(o => o.ProjectDeliveries)
                .Include(o => o.StatusHistories)
                .Include(o => o.SupportRequests)
                .Include(o => o.Review);
        }

        private object ToOrderResponse(Order order)
        {
            var payment = _context.Payments.AsNoTracking().FirstOrDefault(p => p.OrderId == order.Id);

            return new
            {
                order.Id,
                order.CustomerId,
                CustomerName = order.Customer.FullName,
                order.ProviderId,
                ProviderName = order.Provider.CompanyName,
                SupplierName = order.Provider.CompanyName,
                order.PackageId,
                ProductId = order.PackageId,
                PackageName = order.Package.Name,
                ProductName = order.Package.Name,
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
                order.CreatedAt,
                order.UpdatedAt,
                order.CompletedAt,
                Items = order.OrderItems.Select(i => new
                {
                    i.Id,
                    i.PackageId,
                    ProductId = i.PackageId,
                    ProductName = i.Package.Name,
                    i.Package.Unit,
                    i.Quantity,
                    i.UnitPrice,
                    i.LineTotal
                }),
                Payment = payment == null ? null : new
                {
                    payment.Id,
                    payment.Amount,
                    payment.PaymentMethod,
                    payment.PaymentStatus,
                    payment.TransferReference,
                    payment.PaymentNote,
                    payment.PaidAt,
                    payment.ConfirmedAt,
                    payment.ConfirmedByUserId
                },
                StatusHistory = order.StatusHistories
                    .OrderBy(h => h.CreatedAt)
                    .Select(h => new
                    {
                        h.Id,
                        h.FromStatus,
                        h.ToStatus,
                        h.ChangedByUserId,
                        h.ChangedByRole,
                        h.Note,
                        h.CreatedAt
                    }),
                Deliveries = order.ProjectDeliveries
                    .OrderByDescending(d => d.SubmittedAt)
                    .Select(d => new
                    {
                        d.Id,
                        d.PreviewLink,
                        TrackingCode = d.PreviewLink,
                        d.Notes,
                        d.SourceFiles,
                        AttachmentsJson = d.SourceFiles,
                        d.Status,
                        d.SubmittedAt,
                        d.ReviewedAt
                    }),
                SupportRequests = order.SupportRequests
                    .OrderByDescending(r => r.CreatedAt)
                    .Select(r => new
                    {
                        r.Id,
                        r.RequestType,
                        r.Reason,
                        r.RequestedResolution,
                        r.Status,
                        r.AdminNote,
                        r.CreatedAt,
                        r.UpdatedAt,
                        r.ResolvedAt
                    }),
                Review = order.Review == null ? null : new
                {
                    order.Review.Id,
                    order.Review.Rating,
                    order.Review.Comment,
                    order.Review.CreatedAt
                }
            };
        }

        private bool CanAccessOrder(Order order)
        {
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            if (role == "Admin") return true;

            var userId = GetUserId();
            if (role == "Customer") return order.CustomerId == userId;

            var providerId = GetProviderId();
            return role == "Provider" && order.ProviderId == providerId;
        }

        private static bool IsValidPhone(string phone)
        {
            var normalized = phone.Replace(" ", "").Replace("-", "").Replace("+", "");
            return normalized.Length is >= 9 and <= 12 && normalized.All(char.IsDigit);
        }

        private async Task<Package> ResolveFulfillmentProduct(Package requestedProduct, int quantity, string shippingAddress)
        {
            var candidates = await GetBranchProductCandidates(requestedProduct).ToListAsync();
            if (candidates.Count == 0)
            {
                return requestedProduct;
            }

            var preferredArea = DetectBranchArea(shippingAddress);
            return candidates
                .OrderByDescending(p => p.StockQuantity >= quantity)
                .ThenByDescending(p => string.IsNullOrWhiteSpace(preferredArea) ? 0 : GetBranchMatchScore(p, preferredArea))
                .ThenByDescending(p => p.Id == requestedProduct.Id)
                .ThenByDescending(p => p.StockQuantity)
                .ThenBy(p => p.ProviderId)
                .First();
        }

        private async Task<int> GetTotalBranchStock(Package requestedProduct)
        {
            return await GetBranchProductCandidates(requestedProduct).SumAsync(p => p.StockQuantity);
        }

        private IQueryable<Package> GetBranchProductCandidates(Package requestedProduct)
        {
            var sku = requestedProduct.Sku.Trim();
            var name = requestedProduct.Name.Trim();
            var category = requestedProduct.Category.Trim();
            var unit = requestedProduct.Unit.Trim();

            var query = _context.Packages
                .Include(p => p.Provider)
                    .ThenInclude(p => p.User)
                .Where(p => p.IsActive && p.IsApproved && p.Provider.IsVerified);

            if (!string.IsNullOrWhiteSpace(sku))
            {
                return query.Where(p => p.Sku == sku);
            }

            return query.Where(p =>
                p.Name == name &&
                p.Category == category &&
                p.Unit == unit);
        }

        private static string DetectBranchArea(string value)
        {
            var normalized = NormalizeSearchText(value);
            if (normalized.Contains("thu duc")) return "thu duc";
            if (normalized.Contains("phu nhuan")) return "phu nhuan";
            return string.Empty;
        }

        private static int GetBranchMatchScore(Package product, string preferredArea)
        {
            var providerText = NormalizeSearchText(string.Join(" ",
                product.Provider.CompanyName,
                product.Provider.Description,
                product.Provider.User.FullName,
                product.Provider.User.Address,
                product.Provider.User.Email));

            return providerText.Contains(preferredArea) ? 1 : 0;
        }

        private static string NormalizeSearchText(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return string.Empty;

            var normalized = value.Trim().ToLowerInvariant().Normalize(NormalizationForm.FormD);
            var builder = new StringBuilder(normalized.Length);

            foreach (var ch in normalized)
            {
                if (CharUnicodeInfo.GetUnicodeCategory(ch) != UnicodeCategory.NonSpacingMark)
                {
                    builder.Append(ch);
                }
            }

            return builder
                .ToString()
                .Normalize(NormalizationForm.FormC)
                .Replace("đ", "d")
                .Replace("Đ", "d");
        }

        private static string NormalizeDeliveryMethod(string? method)
        {
            var allowed = new HashSet<string> { "Standard", "Express", "DailyRoute" };
            return !string.IsNullOrWhiteSpace(method) && allowed.Contains(method)
                ? method
                : "Standard";
        }

        private static string NormalizePaymentMethod(string? method)
        {
            var allowed = new HashSet<string> { "MockCOD", "MockWallet", "MockCard", "MockBanking", "VNPAY" };
            return !string.IsNullOrWhiteSpace(method) && allowed.Contains(method)
                ? method
                : "MockCOD";
        }

        private static string NormalizeClientOrderKey(string? value)
        {
            var normalized = new string((value ?? string.Empty)
                .Trim()
                .Where(ch => char.IsLetterOrDigit(ch) || ch == '-' || ch == '_' || ch == ':')
                .Take(80)
                .ToArray());

            return normalized;
        }

        private static string NormalizeSupportType(string? type)
        {
            var allowed = new HashSet<string> { "Support", "Complaint", "Return", "Exchange", "Refund" };
            return !string.IsNullOrWhiteSpace(type) && allowed.Contains(type)
                ? type
                : "Support";
        }

        private void AddStatusHistory(int orderId, string fromStatus, string toStatus, int? userId, string role, string note)
        {
            _context.OrderStatusHistories.Add(new OrderStatusHistory
            {
                OrderId = orderId,
                FromStatus = fromStatus,
                ToStatus = toStatus,
                ChangedByUserId = userId,
                ChangedByRole = role,
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

        private static object ToSupportResponse(SupportRequest request)
        {
            return new
            {
                request.Id,
                request.OrderId,
                request.CustomerId,
                request.RequestType,
                request.Reason,
                request.RequestedResolution,
                request.Status,
                request.AdminNote,
                request.CreatedAt,
                request.UpdatedAt,
                request.ResolvedAt
            };
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
