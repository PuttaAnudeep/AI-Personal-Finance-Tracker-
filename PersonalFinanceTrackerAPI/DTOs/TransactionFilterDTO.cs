using System.ComponentModel.DataAnnotations;

namespace PersonalFinanceTrackerAPI.DTOs
{
    public class TransactionFilterDTO
    {
        [Range(1, int.MaxValue, ErrorMessage = "Page must be at least 1")]
        public int Page { get; set; } = 1;

        [Range(1, 100, ErrorMessage = "Page size must be between 1 and 100")]
        public int PageSize { get; set; } = 10;

        public string? Type { get; set; }
        public string? Category { get; set; }
        
        private string? _startDate;
        public string? StartDate 
        { 
            get => _startDate;
            set => _startDate = string.IsNullOrWhiteSpace(value) ? null : value;
        }
        
        private string? _endDate;
        public string? EndDate 
        { 
            get => _endDate;
            set => _endDate = string.IsNullOrWhiteSpace(value) ? null : value;
        }
        
        public string? Search { get; set; }
        public string? SortBy { get; set; } = "Date";
        public string? SortOrder { get; set; } = "desc";
    }
}
