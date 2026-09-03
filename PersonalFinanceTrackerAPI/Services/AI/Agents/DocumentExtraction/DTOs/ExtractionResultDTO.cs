namespace PersonalFinanceTrackerAPI.Services.AI.Agents.DocumentExtraction.DTOs
{
    /// <summary>
    /// Internal DTO for the result of a document extraction operation from a single provider.
    /// </summary>
    public class ExtractionResultDTO
    {
        public bool Success { get; set; }
        public string ExtractedText { get; set; } = string.Empty;
        public string ProviderUsed { get; set; } = string.Empty;
        public string? ErrorMessage { get; set; }
    }
}