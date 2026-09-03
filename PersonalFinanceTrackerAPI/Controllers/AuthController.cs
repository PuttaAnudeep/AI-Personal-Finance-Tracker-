using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonalFinanceTrackerAPI.Data;
using PersonalFinanceTrackerAPI.Models;
using PersonalFinanceTrackerAPI.Services.Interfaces;

namespace PersonalFinanceTrackerAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly FinanceTrackerDbContext _financeContext;

        public AuthController(
            IAuthService authService,
            UserManager<ApplicationUser> userManager,
            FinanceTrackerDbContext financeContext)
        {
            _authService = authService;
            _userManager = userManager;
            _financeContext = financeContext;
        }

        private string GetUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? throw new UnauthorizedAccessException("User ID not found in token.");
        }

        // ========== PUBLIC ENDPOINTS (No Auth Required) ==========

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authService.RegisterAsync(model);

            if (!result.IsSuccess)
                return BadRequest(result);

            return Ok(result);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authService.LoginAsync(model);

            if (!result.IsSuccess)
                return Unauthorized(result);

            return Ok(result);
        }

        // ========== AUTHENTICATED ENDPOINTS (JWT Required) ==========

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetProfile()
        {
            try
            {
                var userId = GetUserId();
                var user = await _userManager.FindByIdAsync(userId);

                if (user == null)
                    return NotFound(new { message = "User not found." });

                return Ok(new
                {
                    user.Id,
                    user.UserName,
                    user.Email,
                    user.PhoneNumber
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        [HttpPut("me")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var userId = GetUserId();
                var user = await _userManager.FindByIdAsync(userId);

                if (user == null)
                    return NotFound(new { message = "User not found." });

                user.UserName = model.UserName ?? user.UserName;
                user.PhoneNumber = model.PhoneNumber ?? user.PhoneNumber;

                var result = await _userManager.UpdateAsync(user);

                if (!result.Succeeded)
                {
                    var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                    return BadRequest(new { message = $"Update failed: {errors}" });
                }

                return Ok(new
                {
                    message = "Profile updated successfully.",
                    user.UserName,
                    user.Email,
                    user.PhoneNumber
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        [HttpPut("me/change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var userId = GetUserId();
                var user = await _userManager.FindByIdAsync(userId);

                if (user == null)
                    return NotFound(new { message = "User not found." });

                var result = await _userManager.ChangePasswordAsync(user, model.CurrentPassword, model.NewPassword);

                if (!result.Succeeded)
                {
                    var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                    return BadRequest(new { message = $"Password change failed: {errors}" });
                }

                return Ok(new { message = "Password changed successfully." });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        [HttpGet("me/dashboard")]
        [Authorize]
        public async Task<IActionResult> GetDashboard()
        {
            try
            {
                var userId = GetUserId();

                var transactions = await _financeContext.Transactions
                    .Where(t => t.UserId == userId)
                    .ToListAsync();

                var totalIncome = transactions
                    .Where(t => t.Type == TransactionType.Income)
                    .Sum(t => t.Amount);

                var totalExpense = transactions
                    .Where(t => t.Type == TransactionType.Expense)
                    .Sum(t => t.Amount);

                return Ok(new
                {
                    totalIncome,
                    totalExpense,
                    balance = totalIncome - totalExpense,
                    transactionCount = transactions.Count
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        [HttpGet("me/spending-by-category")]
        [Authorize]
        public async Task<IActionResult> GetSpendingByCategory()
        {
            try
            {
                var userId = GetUserId();

                var spendingByCategory = await _financeContext.Transactions
                    .Where(t => t.UserId == userId && t.Type == TransactionType.Expense)
                    .GroupBy(t => t.Category)
                    .Select(g => new
                    {
                        category = g.Key.ToString(),
                        total = g.Sum(t => t.Amount),
                        count = g.Count()
                    })
                    .OrderByDescending(x => x.total)
                    .ToListAsync();

                return Ok(spendingByCategory);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        [HttpGet("me/monthly-summary")]
        [Authorize]
        public async Task<IActionResult> GetMonthlySummary()
        {
            try
            {
                var userId = GetUserId();

                var monthlyData = await _financeContext.Transactions
                    .Where(t => t.UserId == userId)
                    .GroupBy(t => new { t.Date.Year, t.Date.Month })
                    .Select(g => new
                    {
                        year = g.Key.Year,
                        month = g.Key.Month,
                        income = g.Where(t => t.Type == TransactionType.Income).Sum(t => t.Amount),
                        expense = g.Where(t => t.Type == TransactionType.Expense).Sum(t => t.Amount),
                        count = g.Count()
                    })
                    .OrderByDescending(x => x.year).ThenByDescending(x => x.month)
                    .ToListAsync();

                return Ok(monthlyData);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }
    }

    // Models for profile update and password change
    public class UpdateProfileModel
    {
        public string? UserName { get; set; }
        public string? PhoneNumber { get; set; }
    }

    public class ChangePasswordModel
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}