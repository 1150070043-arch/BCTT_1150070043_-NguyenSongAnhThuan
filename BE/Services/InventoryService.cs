using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using WebsiteServiceEcommerce.API.Data;
using WebsiteServiceEcommerce.API.DTOs;
using WebsiteServiceEcommerce.API.Models;

namespace WebsiteServiceEcommerce.API.Services
{
    public class InventoryService : IInventoryService
    {
        private readonly ApplicationDbContext _context;

        public InventoryService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<CheckStockResponseDTO>> CheckProviderStockAsync(
            List<CheckStockRequestDTO> requests, int providerId)
        {
            var productIds = requests.Select(r => r.ProductId).ToList();

            var products = await _context.Packages
                .Where(p => productIds.Contains(p.Id) && p.ProviderId == providerId)
                .ToDictionaryAsync(p => p.Id);

            var results = new List<CheckStockResponseDTO>();

            foreach (var request in requests)
            {
                if (!products.TryGetValue(request.ProductId, out var product))
                {
                    results.Add(new CheckStockResponseDTO
                    {
                        ProductId = request.ProductId,
                        IsEnough = false,
                        MissingQuantity = request.RequiredQuantity
                    });
                    continue;
                }

                var isEnough = product.StockQuantity >= request.RequiredQuantity;
                var missing = isEnough ? 0 : request.RequiredQuantity - product.StockQuantity;

                results.Add(new CheckStockResponseDTO
                {
                    ProductId = request.ProductId,
                    IsEnough = isEnough,
                    MissingQuantity = missing
                });
            }

            return results;
        }

        public async Task<bool> CreateAdjustmentRequestAsync(
            CreateAdjustmentRequestDTO dto, int providerId, int requestedByUserId)
        {
            var product = await _context.Packages
                .FirstOrDefaultAsync(p => p.Id == dto.ProductId && p.ProviderId == providerId);

            if (product == null)
                return false;

            var request = new InventoryAdjustmentRequest
            {
                ProductId = dto.ProductId,
                ProviderId = providerId,
                RequestedByUserId = requestedByUserId,
                MovementType = "Import",
                Quantity = dto.Quantity,
                StockBefore = 0,
                Reason = dto.Reason,
                Status = "Pending",
                RequestedAt = DateTime.UtcNow
            };

            _context.InventoryAdjustmentRequests.Add(request);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<string> ApproveAdjustmentRequestAsync(
            ApproveAdjustmentRequestDTO dto, int reviewedByUserId)
        {
            var request = await _context.InventoryAdjustmentRequests
                .Include(r => r.Product)
                .FirstOrDefaultAsync(r => r.Id == dto.RequestId);

            if (request == null)
                return "NotFound";

            if (request.Status != "Pending")
                return "AlreadyProcessed";

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var product = await _context.Packages
                    .FirstOrDefaultAsync(p => p.Id == request.ProductId);

                if (product == null)
                {
                    await transaction.RollbackAsync();
                    return "ProductNotFound";
                }

                bool autoPublished = false;
                if (!product.IsApproved)
                {
                    product.IsApproved = true;
                    product.IsActive = true;
                    autoPublished = true;
                }

                var adminUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Id == reviewedByUserId);

                request.Status = "Approved";
                request.AdminSignature = dto.AdminSignature;
                request.AdminNote = dto.AdminNote;
                request.ReviewedByUserId = reviewedByUserId;
                request.ReviewedAt = DateTime.UtcNow;

                request.StockBefore = product.StockQuantity;

                product.StockQuantity += request.Quantity;
                product.UpdatedAt = DateTime.UtcNow;

                request.StockAfter = product.StockQuantity;

                _context.InventoryTransactions.Add(new InventoryTransaction
                {
                    ProductId = request.ProductId,
                    QuantityChange = request.Quantity,
                    BalanceAfter = product.StockQuantity,
                    TransactionType = "Adjustment_Import",
                    Reason = request.Reason,
                    CreatedByUserId = reviewedByUserId,
                    CreatedByRole = "Admin",
                    CreatedAt = DateTime.UtcNow
                });

                _context.AdminAuditLogs.Add(new AdminAuditLog
                {
                    AdminUserId = reviewedByUserId,
                    AdminName = adminUser?.FullName ?? "Unknown",
                    Action = "Approve_Inventory_Adjustment",
                    EntityType = "InventoryAdjustmentRequests",
                    EntityId = request.Id,
                    Summary = $"Admin duyệt nhập {request.Quantity} {request.Product.Unit} cho sản phẩm #{request.ProductId}." + (autoPublished ? " Tự động mở bán sản phẩm." : ""),
                    MetadataJson = System.Text.Json.JsonSerializer.Serialize(new
                    {
                        request.ProductId,
                        request.Quantity,
                        request.StockBefore,
                        request.StockAfter,
                        request.AdminSignature
                    }),
                    CreatedAt = DateTime.UtcNow
                });

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return autoPublished ? "ApprovedAndPublished" : "Approved";
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }
}
