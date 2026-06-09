using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using VNPAY;
using VNPAY.Models.Exceptions;
using WebsiteServiceEcommerce.API.Data;
using WebsiteServiceEcommerce.API.DTOs;
using WebsiteServiceEcommerce.API.Helpers;

namespace WebsiteServiceEcommerce.API.Controllers
{
    [Route("api/vnpay")]
    [ApiController]
    public class VnpayController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IVnpayClient _vnpayClient;
        private readonly IConfiguration _configuration;

        public VnpayController(ApplicationDbContext context, IVnpayClient vnpayClient, IConfiguration configuration)
        {
            _context = context;
            _vnpayClient = vnpayClient;
            _configuration = configuration;
        }

        [HttpPost("orders/{orderId}/payment-url")]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult<ApiResponse<object>>> CreatePaymentUrl(int orderId)
        {
            var customerId = GetUserId();
            if (customerId == null)
            {
                return Unauthorized(new ApiResponse<object> { Success = false, Message = "Token khong hop le." });
            }

            var order = await _context.Orders
                .Include(o => o.Package)
                .FirstOrDefaultAsync(o => o.Id == orderId && o.CustomerId == customerId.Value);

            if (order == null)
            {
                return NotFound(new ApiResponse<object> { Success = false, Message = "Khong tim thay don hang." });
            }

            var payment = await _context.Payments.FirstOrDefaultAsync(p => p.OrderId == order.Id);
            if (payment == null || payment.PaymentMethod != "VNPAY")
            {
                return BadRequest(new ApiResponse<object> { Success = false, Message = "Don hang khong su dung thanh toan VNPAY." });
            }

            var orderStatus = OrderWorkflow.Normalize(order.Status);
            if (orderStatus is OrderWorkflow.Cancelled or OrderWorkflow.Completed)
            {
                return BadRequest(new ApiResponse<object> { Success = false, Message = "Don hang da ket thuc, khong the tao thanh toan VNPAY." });
            }

            if (payment.PaymentStatus == "Paid")
            {
                return BadRequest(new ApiResponse<object> { Success = false, Message = "Don hang da thanh toan." });
            }

            if (payment.PaymentStatus == "AwaitingVnpay" && !string.IsNullOrWhiteSpace(payment.TransferReference))
            {
                return BadRequest(new ApiResponse<object> { Success = false, Message = "Don hang dang co giao dich VNPAY cho xu ly." });
            }

            if (payment.Amount < 5000)
            {
                return BadRequest(new ApiResponse<object> { Success = false, Message = "VNPAY yeu cau so tien thanh toan toi thieu 5.000 VND." });
            }

            var urlDetail = _vnpayClient.CreatePaymentUrl(
                (double)payment.Amount,
                $"Thanh toan don hang {order.Id}");

            payment.PaymentStatus = "AwaitingVnpay";
            payment.TransferReference = urlDetail.PaymentId.ToString();
            payment.PaymentNote = $"VNPAY payment reference {urlDetail.PaymentId}.";
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Da tao URL thanh toan VNPAY.",
                Data = new
                {
                    OrderId = order.Id,
                    PaymentReference = urlDetail.PaymentId,
                    PaymentUrl = urlDetail.Url
                }
            });
        }

        [HttpGet("callback")]
        [AllowAnonymous]
        public async Task<IActionResult> Callback()
        {
            var result = await ApplyVnpayResult();
            var status = result.Paid ? "success" : "failed";

            return Redirect(BuildFrontendOrderUrl(result.OrderId, status));
        }

        [HttpGet("ipn")]
        [AllowAnonymous]
        public async Task<IActionResult> Ipn()
        {
            var result = await ApplyVnpayResult();
            if (result.OrderId == null)
            {
                return Ok(new { RspCode = "01", Message = "Order not found" });
            }

            return Ok(new { RspCode = "00", Message = "Confirm Success" });
        }

        private async Task<(int? OrderId, bool Paid)> ApplyVnpayResult()
        {
            var paymentReference = Request.Query.TryGetValue("vnp_TxnRef", out var txnRef)
                ? txnRef.ToString()
                : string.Empty;

            var payment = string.IsNullOrWhiteSpace(paymentReference)
                ? null
                : await _context.Payments.FirstOrDefaultAsync(p => p.TransferReference == paymentReference);

            if (payment == null)
            {
                return (null, false);
            }

            var paid = false;

            try
            {
                var result = _vnpayClient.GetPaymentResult(Request);
                payment.PaymentStatus = "Paid";
                payment.PaidAt = result.Timestamp;
                payment.ConfirmedAt = DateTime.UtcNow;
                payment.PaymentNote = $"VNPAY paid. Transaction {result.VnpayTransactionId}; bank {result.BankingInfor?.BankCode}; bank transaction {result.BankingInfor?.BankTransactionId}.";
                paid = true;
            }
            catch (VnpayException ex)
            {
                if (payment.PaymentStatus != "Paid")
                {
                    payment.PaymentStatus = "Failed";
                    payment.PaymentNote = $"VNPAY failed. {ex.Message}";
                }
            }
            catch (Exception ex)
            {
                if (payment.PaymentStatus != "Paid")
                {
                    payment.PaymentStatus = "Failed";
                    payment.PaymentNote = $"VNPAY callback error. {ex.Message}";
                }
            }

            await _context.SaveChangesAsync();
            return (payment.OrderId, paid || payment.PaymentStatus == "Paid");
        }

        private string BuildFrontendOrderUrl(int? orderId, string status)
        {
            var baseUrl = _configuration["VNPAY:FrontendReturnUrl"]?.TrimEnd('/') ?? "http://localhost:5173/#/orders";
            if (orderId == null)
            {
                return $"{baseUrl}/my?vnpay={status}";
            }

            return $"{baseUrl}/{orderId}?vnpay={status}";
        }

        private int? GetUserId()
        {
            var value = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(value, out var id) ? id : null;
        }
    }
}
