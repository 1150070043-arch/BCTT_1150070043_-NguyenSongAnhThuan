using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using WebsiteServiceEcommerce.API.Data;
using WebsiteServiceEcommerce.API.Services;
using VNPAY.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddMemoryCache();
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSettings"));
builder.Services.AddScoped<IEmailSender, SmtpEmailSender>();

var vnpaySettings = builder.Configuration.GetSection("VNPAY");
builder.Services.AddVnpayClient(config =>
{
    config.TmnCode = vnpaySettings["TmnCode"]!;
    config.HashSecret = vnpaySettings["HashSecret"]!;
    config.BaseUrl = vnpaySettings["BaseUrl"]!;
    config.CallbackUrl = vnpaySettings["CallbackUrl"]!;
    config.Version = vnpaySettings["Version"] ?? "2.1.0";
    config.OrderType = vnpaySettings["OrderType"] ?? "other";
});

// Configure Entity Framework with SQL Server
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"];

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey!))
    };
});

builder.Services.AddAuthorization();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
              {
                  if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri))
                  {
                      return false;
                  }

                  if ((uri.Host is "localhost" or "127.0.0.1") && uri.Port is 5173 or 5174 or 3000)
                  {
                      return true;
                  }

                  if (System.Net.IPAddress.TryParse(uri.Host, out var ip))
                  {
                      var bytes = ip.GetAddressBytes();
                      return ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork &&
                             uri.Port is 5173 or 5174 or 3000 &&
                             (bytes[0] == 10 ||
                              (bytes[0] == 172 && bytes[1] is >= 16 and <= 31) ||
                              (bytes[0] == 192 && bytes[1] == 168));
                  }

                  return false;
              })
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseStaticFiles();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
