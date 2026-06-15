using WebsiteServiceEcommerce.API.DTOs;

namespace WebsiteServiceEcommerce.API.Services
{
    public interface IInventoryService
    {
        Task<List<CheckStockResponseDTO>> CheckProviderStockAsync(List<CheckStockRequestDTO> requests, int providerId);
        Task<bool> CreateAdjustmentRequestAsync(CreateAdjustmentRequestDTO dto, int providerId, int requestedByUserId);
        Task<string> ApproveAdjustmentRequestAsync(ApproveAdjustmentRequestDTO dto, int reviewedByUserId);
    }
}
