namespace PersonalFinanceTrackerAPI.Services.AI.Agents.DocumentExtraction
{
    /// <summary>
    /// Configuration options for the Document Extraction Agent.
    /// Bound to the "DocumentExtraction" section in appsettings.json.
    /// </summary>
    public class DocumentExtractionConfiguration
    {
        /// <summary>
        /// The name of the primary extraction provider to use (e.g., "GeminiVision").
        /// </summary>
        public string PrimaryProvider { get; set; } = "GeminiVision";

        /// <summary>
        /// When set to a non-empty value, forces the orchestrator to use only this specific provider.
        /// Useful for testing specific providers or A/B comparisons.
        /// </summary>
        public string ForceProvider { get; set; } = string.Empty;

        /// <summary>
        /// When true, the orchestrator skips the primary provider to test the fallback path.
        /// Useful for validating fallback behavior without waiting for actual provider failures.
        /// </summary>
        public bool EnableFallbackTesting { get; set; } = false;

        /// <summary>
        /// List of allowed file extensions for document upload.
        /// </summary>
        public List<string> SupportedFormats { get; set; } = new()
        {
            "jpg", "jpeg", "png", "webp", "pdf"
        };

        /// <summary>
        /// Maximum allowed file size in megabytes.
        /// </summary>
        public int FileSizeLimitMb { get; set; } = 10;

        /// <summary>
        /// When true, the raw extracted text is included in the API response.
        /// Intended for debugging and development purposes only.
        /// </summary>
        public bool IncludeExtractedTextInResponse { get; set; } = false;
    }
}