using PersonalFinanceTrackerAPI.DTOs;
using PersonalFinanceTrackerAPI.Models;

namespace PersonalFinanceTrackerAPI.Services.Interfaces
{
    public interface ITransactionService
    {
        Task<TransactionResponseDTO> CreateAsync(CreateTransactionDTO dto, string userId);
        Task<TransactionResponseDTO> UpdateAsync(int id, CreateTransactionDTO dto, string userId);
        Task<bool> DeleteAsync(int id, string userId);
        Task<TransactionResponseDTO?> GetByIdAsync(int id, string userId);
        Task<List<TransactionResponseDTO>> GetAllAsync(string userId);
        Task<List<TransactionResponseDTO>> GetByUserIdAsync(string targetUserId);
        Task<List<TransactionResponseDTO>> GetByTypeAsync(TransactionType type, string userId);
        Task<List<TransactionResponseDTO>> GetByCategoryAsync(TransactionCategory category, string userId);
        Task<List<TransactionResponseDTO>> GetByDateRangeAsync(DateTime startDate, DateTime endDate, string userId);
        Task<PaginatedTransactionResponseDTO> GetFilteredAsync(string userId, TransactionFilterDTO filters);
    }
}
