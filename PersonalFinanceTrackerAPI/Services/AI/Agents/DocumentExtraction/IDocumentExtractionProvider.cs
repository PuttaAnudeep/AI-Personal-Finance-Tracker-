using PersonalFinanceTrackerAPI.Services.AI.Agents.DocumentExtraction.DTOs;

namespace PersonalFinanceTrackerAPI.Services.AI.Agents.DocumentExtraction
{
    /// <summary>
    /// Interface for document text extraction providers.
    /// Implementations extract plain text from documents (images, PDFs, etc.)
    /// without performing any transaction parsing logic.
    /// </summary>
    public interface IDocumentExtractionProvider
    {
        /// <summary>
        /// Gets the display name of this provider (e.g., "GeminiVision", "Puter").
        /// Used in responses and for configuration-based provider selection.
        /// </summary>
        string ProviderName { get; }

        /// <summary>
        /// Extracts plain text from the provided document bytes.
        /// </summary>
        /// <param name="fileBytes">Raw file content as byte array</param>
        /// <param name="fileName">Original file name (used to determine format)</param>
        /// <param name="contentType">MIME type of the file</param>
        /// <returns>Extraction result containing the text or error details</returns>
        Task<ExtractionResultDTO> ExtractTextAsync(byte[] fileBytes, string fileName, string contentType);
    }
}