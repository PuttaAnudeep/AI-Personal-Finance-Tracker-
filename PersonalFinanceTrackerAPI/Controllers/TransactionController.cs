using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalFinanceTrackerAPI.DTOs;
using PersonalFinanceTrackerAPI.Models;
using PersonalFinanceTrackerAPI.Services.Interfaces;

namespace PersonalFinanceTrackerAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TransactionController : ControllerBase
    {
        private readonly ITransactionService _transactionService;

        public TransactionController(ITransactionService transactionService)
        {
            _transactionService = transactionService;
        }

        private string GetUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? throw new UnauthorizedAccessException("User ID not found in token.");
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateTransactionDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var userId = GetUserId();
                var result = await _transactionService.CreateAsync(dto, userId);
                return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var userId = GetUserId();
                var result = await _transactionService.GetAllAsync(userId);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var userId = GetUserId();
                var result = await _transactionService.GetByIdAsync(id, userId);

                if (result == null)
                    return NotFound(new { message = "Transaction not found." });

                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        [HttpGet("user/{targetUserId}")]
        public async Task<IActionResult> GetByUserId(string targetUserId)
        {
            try
            {
                var result = await _transactionService.GetByUserIdAsync(targetUserId);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        [HttpGet("type/{type}")]
        public async Task<IActionResult> GetByType(TransactionType type)
        {
            try
            {
                var userId = GetUserId();
                var result = await _transactionService.GetByTypeAsync(type, userId);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        [HttpGet("category/{category}")]
        public async Task<IActionResult> GetByCategory(TransactionCategory category)
        {
            try
            {
                var userId = GetUserId();
                var result = await _transactionService.GetByCategoryAsync(category, userId);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        [HttpGet("date-range")]
        public async Task<IActionResult> GetByDateRange([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            try
            {
                var userId = GetUserId();
                var result = await _transactionService.GetByDateRangeAsync(startDate, endDate, userId);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        [HttpGet("filtered")]
        public async Task<IActionResult> GetFiltered([FromQuery] TransactionFilterDTO filters)
        {
            try
            {
                var userId = GetUserId();
                var result = await _transactionService.GetFilteredAsync(userId, filters);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred", error = ex.Message, stackTrace = ex.StackTrace });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CreateTransactionDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var userId = GetUserId();
                var result = await _transactionService.UpdateAsync(id, dto, userId);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var userId = GetUserId();
                var deleted = await _transactionService.DeleteAsync(id, userId);

                if (!deleted)
                    return NotFound(new { message = "Transaction not found or access denied." });

                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }
    }
}