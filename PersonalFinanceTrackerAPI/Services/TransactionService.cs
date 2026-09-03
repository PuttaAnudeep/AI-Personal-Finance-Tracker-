using Microsoft.EntityFrameworkCore;
using PersonalFinanceTrackerAPI.Data;
using PersonalFinanceTrackerAPI.DTOs;
using PersonalFinanceTrackerAPI.Models;
using PersonalFinanceTrackerAPI.Services.Interfaces;

namespace PersonalFinanceTrackerAPI.Services
{
    public class TransactionService : ITransactionService
    {
        private readonly FinanceTrackerDbContext _context;

        public TransactionService(FinanceTrackerDbContext context)
        {
            _context = context;
        }

        public async Task<TransactionResponseDTO> CreateAsync(CreateTransactionDTO dto, string userId)
        {
            var transaction = new TransactionModel
            {
                Date = dto.Date,
                Type = dto.Type,
                Category = dto.Category,
                Amount = dto.Amount,
                Description = dto.Description,
                UserId = userId
            };

            _context.Transactions.Add(transaction);
            await _context.SaveChangesAsync();

            return MapToResponseDTO(transaction);
        }

        public async Task<TransactionResponseDTO> UpdateAsync(int id, CreateTransactionDTO dto, string userId)
        {
            var transaction = await _context.Transactions
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

            if (transaction == null)
                throw new KeyNotFoundException("Transaction not found or access denied.");

            transaction.Date = dto.Date;
            transaction.Type = dto.Type;
            transaction.Category = dto.Category;
            transaction.Amount = dto.Amount;
            transaction.Description = dto.Description;

            await _context.SaveChangesAsync();

            return MapToResponseDTO(transaction);
        }

        public async Task<bool> DeleteAsync(int id, string userId)
        {
            var transaction = await _context.Transactions
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

            if (transaction == null)
                return false;

            _context.Transactions.Remove(transaction);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<TransactionResponseDTO?> GetByIdAsync(int id, string userId)
        {
            var transaction = await _context.Transactions
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

            return transaction == null ? null : MapToResponseDTO(transaction);
        }

        public async Task<List<TransactionResponseDTO>> GetAllAsync(string userId)
        {
            var transactions = await _context.Transactions
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.Date)
                .ToListAsync();

            return transactions.Select(MapToResponseDTO).ToList();
        }

        public async Task<List<TransactionResponseDTO>> GetByUserIdAsync(string targetUserId)
        {
            var transactions = await _context.Transactions
                .Where(t => t.UserId == targetUserId)
                .OrderByDescending(t => t.Date)
                .ToListAsync();

            return transactions.Select(MapToResponseDTO).ToList();
        }

        public async Task<List<TransactionResponseDTO>> GetByTypeAsync(TransactionType type, string userId)
        {
            var transactions = await _context.Transactions
                .Where(t => t.UserId == userId && t.Type == type)
                .OrderByDescending(t => t.Date)
                .ToListAsync();

            return transactions.Select(MapToResponseDTO).ToList();
        }

        public async Task<List<TransactionResponseDTO>> GetByCategoryAsync(TransactionCategory category, string userId)
        {
            var transactions = await _context.Transactions
                .Where(t => t.UserId == userId && t.Category == category)
                .OrderByDescending(t => t.Date)
                .ToListAsync();

            return transactions.Select(MapToResponseDTO).ToList();
        }

        public async Task<List<TransactionResponseDTO>> GetByDateRangeAsync(DateTime startDate, DateTime endDate, string userId)
        {
            var transactions = await _context.Transactions
                .Where(t => t.UserId == userId && t.Date >= startDate && t.Date <= endDate)
                .OrderByDescending(t => t.Date)
                .ToListAsync();

            return transactions.Select(MapToResponseDTO).ToList();
        }

        public async Task<PaginatedTransactionResponseDTO> GetFilteredAsync(string userId, TransactionFilterDTO filters)
        {
            var query = _context.Transactions.Where(t => t.UserId == userId);

            if (!string.IsNullOrWhiteSpace(filters.Search))
            {
                var search = filters.Search.Trim();
                var searchPattern = $"%{search}%";

                decimal? searchAmount = decimal.TryParse(search, out var amount) ? amount : null;
                DateTime? searchDate = DateTime.TryParse(search, out var date) ? date.Date : null;

                query = query.Where(t =>
                    (t.Description != null && EF.Functions.Like(t.Description, searchPattern)) ||
                    (searchAmount.HasValue && t.Amount == searchAmount.Value) ||
                    (searchDate.HasValue && t.Date.Date == searchDate.Value));
            }

            // Apply filters
            if (!string.IsNullOrWhiteSpace(filters.Type))
            {
                if (Enum.TryParse<TransactionType>(filters.Type, true, out var type))
                {
                    query = query.Where(t => t.Type == type);
                }
            }

            if (!string.IsNullOrWhiteSpace(filters.Category))
            {
                if (Enum.TryParse<TransactionCategory>(filters.Category, true, out var category))
                {
                    query = query.Where(t => t.Category == category);
                }
            }

            if (!string.IsNullOrWhiteSpace(filters.StartDate))
            {
                if (DateTime.TryParse(filters.StartDate, out var startDate))
                {
                    query = query.Where(t => t.Date >= startDate);
                }
            }

            if (!string.IsNullOrWhiteSpace(filters.EndDate))
            {
                if (DateTime.TryParse(filters.EndDate, out var endDate))
                {
                    query = query.Where(t => t.Date <= endDate);
                }
            }

            // Apply sorting
            query = filters.SortBy?.ToLower() switch
            {
                "amount" => filters.SortOrder?.ToLower() == "asc"
                    ? query.OrderBy(t => t.Amount)
                    : query.OrderByDescending(t => t.Amount),
                "category" => filters.SortOrder?.ToLower() == "asc"
                    ? query.OrderBy(t => t.Category)
                    : query.OrderByDescending(t => t.Category),
                "date" => filters.SortOrder?.ToLower() == "asc"
                    ? query.OrderBy(t => t.Date)
                    : query.OrderByDescending(t => t.Date),
                _ => filters.SortOrder?.ToLower() == "asc"
                    ? query.OrderBy(t => t.Date)
                    : query.OrderByDescending(t => t.Date)
            };

            // Get total count before pagination
            var totalCount = await query.CountAsync();

            // Apply pagination
            var page = filters.Page < 1 ? 1 : filters.Page;
            var pageSize = filters.PageSize < 1 ? 10 : filters.PageSize;
            var transactions = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // Calculate summary statistics from filtered results
            var filteredQuery = _context.Transactions.Where(t => t.UserId == userId);
            
            if (!string.IsNullOrWhiteSpace(filters.Type))
            {
                if (Enum.TryParse<TransactionType>(filters.Type, true, out var type))
                {
                    filteredQuery = filteredQuery.Where(t => t.Type == type);
                }
            }

            if (!string.IsNullOrWhiteSpace(filters.Category))
            {
                if (Enum.TryParse<TransactionCategory>(filters.Category, true, out var category))
                {
                    filteredQuery = filteredQuery.Where(t => t.Category == category);
                }
            }

            if (!string.IsNullOrWhiteSpace(filters.StartDate))
            {
                if (DateTime.TryParse(filters.StartDate, out var startDate))
                {
                    filteredQuery = filteredQuery.Where(t => t.Date >= startDate);
                }
            }

            if (!string.IsNullOrWhiteSpace(filters.EndDate))
            {
                if (DateTime.TryParse(filters.EndDate, out var endDate))
                {
                    filteredQuery = filteredQuery.Where(t => t.Date <= endDate);
                }
            }

            filteredQuery = ApplySearchFilter(filteredQuery, filters.Search);

            var summary = new TransactionSummaryDTO();
            var allFiltered = await filteredQuery.ToListAsync();
            
            summary.TotalIncome = allFiltered
                .Where(t => t.Type == TransactionType.Income)
                .Sum(t => t.Amount);
            
            summary.TotalExpense = allFiltered
                .Where(t => t.Type == TransactionType.Expense)
                .Sum(t => t.Amount);
            
            summary.NetBalance = summary.TotalIncome - summary.TotalExpense;
            summary.TransactionCount = allFiltered.Count;

            return new PaginatedTransactionResponseDTO
            {
                Items = transactions.Select(MapToResponseDTO).ToList(),
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                Summary = summary
            };
        }

        private static IQueryable<TransactionModel> ApplySearchFilter(
            IQueryable<TransactionModel> query, string? search)
        {
            if (string.IsNullOrWhiteSpace(search))
                return query;

            var trimmedSearch = search.Trim();
            var searchPattern = $"%{trimmedSearch}%";

            decimal? searchAmount = decimal.TryParse(trimmedSearch, out var amount) ? amount : null;
            DateTime? searchDate = DateTime.TryParse(trimmedSearch, out var date) ? date.Date : null;

            return query.Where(t =>
                (t.Description != null && EF.Functions.Like(t.Description, searchPattern)) ||
                (searchAmount.HasValue && t.Amount == searchAmount.Value) ||
                (searchDate.HasValue && t.Date.Date == searchDate.Value));
        }

        private static TransactionResponseDTO MapToResponseDTO(TransactionModel transaction)
        {
            return new TransactionResponseDTO
            {
                Id = transaction.Id,
                Date = transaction.Date,
                Type = transaction.Type.ToString(),
                Category = transaction.Category.ToString(),
                Amount = transaction.Amount,
                Description = transaction.Description,
                UserId = transaction.UserId
            };
        }
    }
}