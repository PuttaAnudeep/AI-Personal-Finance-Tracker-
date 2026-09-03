using PersonalFinanceTrackerAPI.DTOs;
using PersonalFinanceTrackerAPI.Models;

namespace PersonalFinanceTrackerAPI.Services.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponseDTO> RegisterAsync(RegisterModel model);
        Task<AuthResponseDTO> LoginAsync(LoginModel model);
    }
}