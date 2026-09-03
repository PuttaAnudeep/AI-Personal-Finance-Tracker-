using System.Threading.Tasks;
using PersonalFinanceTrackerAPI.Services.AI.Agents.SpendingAnomalyDetection.DTOs;

namespace PersonalFinanceTrackerAPI.Services.Interfaces.AI
{
    public interface ISpendingAnomalyDetectionService
    {
        Task<AnomalyDetectionResponseDTO> DetectAnomaliesAsync(string userId, int months = 3, double? threshold = null);
    }
}
