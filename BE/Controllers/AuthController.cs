using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Caching.Memory;
using System.Net;
using System.Security.Cryptography;
using System.Security.Claims;
using WebsiteServiceEcommerce.API.Data;
using WebsiteServiceEcommerce.API.DTOs;
using WebsiteServiceEcommerce.API.Models;
using WebsiteServiceEcommerce.API.Helpers;
using WebsiteServiceEcommerce.API.Services;

namespace WebsiteServiceEcommerce.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly JwtHelper _jwtHelper;
        private readonly IMemoryCache _cache;
        private readonly IEmailSender _emailSender;

        public AuthController(
            ApplicationDbContext context,
            IConfiguration configuration,
            IMemoryCache cache,
            IEmailSender emailSender)
        {
            _context = context;
            _jwtHelper = new JwtHelper(configuration);
            _cache = cache;
            _emailSender = emailSender;
        }

        // POST: api/Auth/register
        [HttpPost("register")]
        public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Register(RegisterDto dto)
        {
            // Validate input
            if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest(new ApiResponse<AuthResponseDto>
                {
                    Success = false,
                    Message = "Email và mật khẩu không được để trống."
                });
            }

            // Check if email already exists
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (existingUser != null)
            {
                return BadRequest(new ApiResponse<AuthResponseDto>
                {
                    Success = false,
                    Message = "Email đã được sử dụng."
                });
            }

            // Public registration is only for customers. Internal users are created by admins.
            var user = new User
            {
                FullName = dto.FullName.Trim(),
                Email = dto.Email.Trim(),
                PasswordHash = PasswordHelper.HashPassword(dto.Password),
                PhoneNumber = dto.PhoneNumber.Trim(),
                Role = "Customer",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Generate JWT token
            var token = _jwtHelper.GenerateToken(user.Id, user.Email, user.Role, null);

            var response = new AuthResponseDto
            {
                UserId = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                Token = token,
                ProviderId = null
            };

            return Ok(new ApiResponse<AuthResponseDto>
            {
                Success = true,
                Message = "Đăng ký thành công.",
                Data = response
            });
        }

        // POST: api/Auth/forgot-password
        [HttpPost("forgot-password")]
        public async Task<ActionResult<ApiResponse<object>>> ForgotPassword(ForgotPasswordDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email))
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Vui lòng nhập email."
                });
            }

            var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail && u.IsActive);

            if (user == null)
            {
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Nếu email tồn tại trong hệ thống, mã khôi phục sẽ được gửi đến email đó."
                });
            }

            var code = RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
            _cache.Set(GetPasswordResetCacheKey(normalizedEmail), code, TimeSpan.FromMinutes(15));

            try
            {
                await _emailSender.SendAsync(
                    normalizedEmail,
                    "Mã khôi phục mật khẩu Ngọc Anh Phú Thịnh 9",
                    BuildPasswordResetEmail(user.FullName, code));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = ex.Message
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Đã gửi mã khôi phục mật khẩu đến email đăng ký. Mã có hiệu lực trong 15 phút."
            });
        }

        // POST: api/Auth/reset-password
        [HttpPost("reset-password")]
        public async Task<ActionResult<ApiResponse<object>>> ResetPassword(ResetPasswordDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email) ||
                string.IsNullOrWhiteSpace(dto.Code) ||
                string.IsNullOrWhiteSpace(dto.NewPassword))
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Vui lòng nhập email, mã xác nhận và mật khẩu mới."
                });
            }

            if (dto.NewPassword.Length < 6)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Mật khẩu mới cần tối thiểu 6 ký tự."
                });
            }

            var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
            var key = GetPasswordResetCacheKey(normalizedEmail);
            if (!_cache.TryGetValue<string>(key, out var expectedCode) || expectedCode != dto.Code.Trim())
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Mã xác nhận không đúng hoặc đã hết hạn."
                });
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail && u.IsActive);
            if (user == null)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Không tìm thấy tài khoản hợp lệ."
                });
            }

            user.PasswordHash = PasswordHelper.HashPassword(dto.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;
            _cache.Remove(key);

            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới."
            });
        }

        // POST: api/Auth/login
        [HttpPost("login")]
        public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Login(LoginDto dto)
        {
            // Validate input
            if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest(new ApiResponse<AuthResponseDto>
                {
                    Success = false,
                    Message = "Email và mật khẩu không được để trống."
                });
            }

            // Find user by email
            var user = await _context.Users
                .Include(u => u.Provider)
                .FirstOrDefaultAsync(u => u.Email == dto.Email);

            if (user == null)
            {
                return Unauthorized(new ApiResponse<AuthResponseDto>
                {
                    Success = false,
                    Message = "Email hoặc mật khẩu không chính xác."
                });
            }

            // Verify password
            if (!PasswordHelper.VerifyPassword(dto.Password, user.PasswordHash))
            {
                return Unauthorized(new ApiResponse<AuthResponseDto>
                {
                    Success = false,
                    Message = "Email hoặc mật khẩu không chính xác."
                });
            }

            // Check if user is active
            if (!user.IsActive)
            {
                return Unauthorized(new ApiResponse<AuthResponseDto>
                {
                    Success = false,
                    Message = "Tài khoản đã bị khóa."
                });
            }

            // Generate JWT token
            var token = _jwtHelper.GenerateToken(user.Id, user.Email, user.Role, user.Provider?.Id);

            var response = new AuthResponseDto
            {
                UserId = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                Token = token,
                ProviderId = user.Provider?.Id
            };

            return Ok(new ApiResponse<AuthResponseDto>
            {
                Success = true,
                Message = "Đăng nhập thành công.",
                Data = response
            });
        }

        // POST: api/Auth/logout
        [Authorize]
        [HttpPost("logout")]
        public ActionResult<ApiResponse<object>> Logout()
        {
            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Đăng xuất thành công. Vui lòng xóa token ở phía client."
            });
        }

        // GET: api/Auth/me
        [Authorize]
        [HttpGet("me")]
        public async Task<ActionResult<ApiResponse<object>>> Me()
        {
            var userIdValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdValue, out var userId))
            {
                return Unauthorized(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Token không hợp lệ."
                });
            }

            var user = await _context.Users
                .Include(u => u.Provider)
                .Include(u => u.Addresses)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Không tìm thấy người dùng."
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Lấy thông tin người dùng thành công.",
                Data = new
                {
                    user.Id,
                    user.FullName,
                    user.Email,
                    user.PhoneNumber,
                    user.Address,
                    Addresses = user.Addresses
                        .OrderByDescending(a => a.IsDefault)
                        .ThenByDescending(a => a.UpdatedAt ?? a.CreatedAt)
                        .Select(ToAddressResponse),
                    user.Role,
                    user.IsActive,
                    user.CreatedAt,
                    ProviderId = user.Provider?.Id
                }
            });
        }

        [Authorize]
        [HttpGet("addresses")]
        public async Task<ActionResult<ApiResponse<List<object>>>> GetAddresses()
        {
            var userId = GetUserId();
            if (userId == null)
            {
                return Unauthorized(new ApiResponse<List<object>> { Success = false, Message = "Token khong hop le." });
            }

            var addresses = await _context.UserAddresses
                .Where(a => a.UserId == userId.Value)
                .OrderByDescending(a => a.IsDefault)
                .ThenByDescending(a => a.UpdatedAt ?? a.CreatedAt)
                .ToListAsync();

            return Ok(new ApiResponse<List<object>>
            {
                Success = true,
                Message = "Lay danh sach dia chi thanh cong.",
                Data = addresses.Select(ToAddressResponse).ToList()
            });
        }

        [Authorize]
        [HttpPost("addresses")]
        public async Task<ActionResult<ApiResponse<object>>> CreateAddress(UserAddressDto dto)
        {
            var userId = GetUserId();
            if (userId == null)
            {
                return Unauthorized(new ApiResponse<object> { Success = false, Message = "Token khong hop le." });
            }

            var validation = ValidateAddress(dto);
            if (!string.IsNullOrEmpty(validation))
            {
                return BadRequest(new ApiResponse<object> { Success = false, Message = validation });
            }

            var hasAddress = await _context.UserAddresses.AnyAsync(a => a.UserId == userId.Value);
            if (dto.IsDefault || !hasAddress)
            {
                await ClearDefaultAddress(userId.Value);
            }

            var address = new UserAddress
            {
                UserId = userId.Value,
                Label = string.IsNullOrWhiteSpace(dto.Label) ? "Địa chỉ giao hàng" : dto.Label.Trim(),
                RecipientName = dto.RecipientName.Trim(),
                PhoneNumber = dto.PhoneNumber.Trim(),
                AddressLine = dto.AddressLine.Trim(),
                IsDefault = dto.IsDefault || !hasAddress,
                CreatedAt = DateTime.UtcNow
            };

            _context.UserAddresses.Add(address);

            var user = await _context.Users.FindAsync(userId.Value);
            if (user != null && address.IsDefault)
            {
                user.FullName = string.IsNullOrWhiteSpace(user.FullName) ? address.RecipientName : user.FullName;
                user.PhoneNumber = address.PhoneNumber;
                user.Address = address.AddressLine;
                user.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Da them dia chi giao hang.",
                Data = ToAddressResponse(address)
            });
        }

        [Authorize]
        [HttpPut("addresses/{id}")]
        public async Task<ActionResult<ApiResponse<object>>> UpdateAddress(int id, UserAddressDto dto)
        {
            var userId = GetUserId();
            if (userId == null)
            {
                return Unauthorized(new ApiResponse<object> { Success = false, Message = "Token khong hop le." });
            }

            var address = await _context.UserAddresses.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId.Value);
            if (address == null)
            {
                return NotFound(new ApiResponse<object> { Success = false, Message = "Khong tim thay dia chi." });
            }

            var validation = ValidateAddress(dto);
            if (!string.IsNullOrEmpty(validation))
            {
                return BadRequest(new ApiResponse<object> { Success = false, Message = validation });
            }

            if (dto.IsDefault)
            {
                await ClearDefaultAddress(userId.Value);
            }

            address.Label = string.IsNullOrWhiteSpace(dto.Label) ? address.Label : dto.Label.Trim();
            address.RecipientName = dto.RecipientName.Trim();
            address.PhoneNumber = dto.PhoneNumber.Trim();
            address.AddressLine = dto.AddressLine.Trim();
            address.IsDefault = dto.IsDefault || address.IsDefault;
            address.UpdatedAt = DateTime.UtcNow;

            if (address.IsDefault)
            {
                var user = await _context.Users.FindAsync(userId.Value);
                if (user != null)
                {
                    user.PhoneNumber = address.PhoneNumber;
                    user.Address = address.AddressLine;
                    user.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Da cap nhat dia chi.",
                Data = ToAddressResponse(address)
            });
        }

        [Authorize]
        [HttpPut("addresses/{id}/default")]
        public async Task<ActionResult<ApiResponse<object>>> SetDefaultAddress(int id)
        {
            var userId = GetUserId();
            if (userId == null)
            {
                return Unauthorized(new ApiResponse<object> { Success = false, Message = "Token khong hop le." });
            }

            var address = await _context.UserAddresses.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId.Value);
            if (address == null)
            {
                return NotFound(new ApiResponse<object> { Success = false, Message = "Khong tim thay dia chi." });
            }

            await ClearDefaultAddress(userId.Value);
            address.IsDefault = true;
            address.UpdatedAt = DateTime.UtcNow;

            var user = await _context.Users.FindAsync(userId.Value);
            if (user != null)
            {
                user.PhoneNumber = address.PhoneNumber;
                user.Address = address.AddressLine;
                user.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return Ok(new ApiResponse<object> { Success = true, Message = "Da dat dia chi mac dinh.", Data = ToAddressResponse(address) });
        }

        [Authorize]
        [HttpDelete("addresses/{id}")]
        public async Task<ActionResult<ApiResponse<object>>> DeleteAddress(int id)
        {
            var userId = GetUserId();
            if (userId == null)
            {
                return Unauthorized(new ApiResponse<object> { Success = false, Message = "Token khong hop le." });
            }

            var address = await _context.UserAddresses.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId.Value);
            if (address == null)
            {
                return NotFound(new ApiResponse<object> { Success = false, Message = "Khong tim thay dia chi." });
            }

            var wasDefault = address.IsDefault;
            _context.UserAddresses.Remove(address);
            await _context.SaveChangesAsync();

            if (wasDefault)
            {
                var next = await _context.UserAddresses
                    .Where(a => a.UserId == userId.Value)
                    .OrderByDescending(a => a.UpdatedAt ?? a.CreatedAt)
                    .FirstOrDefaultAsync();
                if (next != null)
                {
                    next.IsDefault = true;
                    await _context.SaveChangesAsync();
                }
            }

            return Ok(new ApiResponse<object> { Success = true, Message = "Da xoa dia chi." });
        }

        // PUT: api/Auth/profile
        [Authorize]
        [HttpPut("profile")]
        public async Task<ActionResult<ApiResponse<object>>> UpdateProfile(UpdateProfileDto dto)
        {
            var userIdValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdValue, out var userId))
            {
                return Unauthorized(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Token không hợp lệ."
                });
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Không tìm thấy người dùng."
                });
            }

            // Update profile
            user.FullName = string.IsNullOrWhiteSpace(dto.FullName) ? user.FullName : dto.FullName.Trim();
            user.PhoneNumber = dto.PhoneNumber?.Trim() ?? string.Empty;
            user.Address = dto.Address?.Trim() ?? string.Empty;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Cập nhật thông tin thành công.",
                Data = new
                {
                    user.FullName,
                    user.PhoneNumber,
                    user.Address
                }
            });
        }

        private int? GetUserId()
        {
            var userIdValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdValue, out var userId) ? userId : null;
        }

        private static string GetPasswordResetCacheKey(string email)
        {
            return $"password-reset:{email}";
        }

        private static string BuildPasswordResetEmail(string fullName, string code)
        {
            var safeName = WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(fullName) ? "khách hàng" : fullName);
            return $@"
                <div style=""font-family: Arial, sans-serif; color: #102033; line-height: 1.6;"">
                  <h2 style=""margin: 0 0 12px;"">Khôi phục mật khẩu Ngọc Anh Phú Thịnh 9</h2>
                  <p>Xin chào {safeName},</p>
                  <p>Mã xác nhận đặt lại mật khẩu của bạn là:</p>
                  <p style=""font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #0a72c9;"">{code}</p>
                  <p>Mã có hiệu lực trong 15 phút. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
                </div>";
        }

        private async Task ClearDefaultAddress(int userId)
        {
            var defaults = await _context.UserAddresses
                .Where(a => a.UserId == userId && a.IsDefault)
                .ToListAsync();
            foreach (var item in defaults)
            {
                item.IsDefault = false;
                item.UpdatedAt = DateTime.UtcNow;
            }
        }

        private static string ValidateAddress(UserAddressDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.RecipientName) ||
                string.IsNullOrWhiteSpace(dto.PhoneNumber) ||
                string.IsNullOrWhiteSpace(dto.AddressLine))
            {
                return "Vui long nhap nguoi nhan, so dien thoai va dia chi.";
            }

            var phone = dto.PhoneNumber.Replace(" ", "").Replace("-", "").Replace("+", "");
            if (phone.Length is < 9 or > 12 || !phone.All(char.IsDigit))
            {
                return "So dien thoai khong hop le.";
            }

            return string.Empty;
        }

        private static object ToAddressResponse(UserAddress address)
        {
            return new
            {
                address.Id,
                address.Label,
                address.RecipientName,
                address.PhoneNumber,
                address.AddressLine,
                address.IsDefault,
                address.CreatedAt,
                address.UpdatedAt
            };
        }
    }
}
