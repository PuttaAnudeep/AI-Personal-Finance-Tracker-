using PersonalFinanceTrackerAPI.DTOs;

namespace PersonalFinanceTrackerAPI.Services.AI.Agents.DocumentExtraction.DTOs
{
    /// <summary>
    /// API response DTO for the document processing endpoint.
    /// Contains the final result including created transactions.
    /// </summary>
    public class DocumentProcessingResponseDTO
    {
        public bool Success { get; set; }
        public string? ProviderUsed { get; set; }
        public int TransactionCount { get; set; }
        public List<TransactionResponseDTO> Transactions { get; set; } = new();
        public string? ErrorMessage { get; set; }

        /// <summary>
        /// Raw extracted text from the document.
        /// Only populated when IncludeExtractedTextInResponse configuration is enabled (for debugging).
        /// </summary>
        public string? ExtractedText { get; set; }
    }
}