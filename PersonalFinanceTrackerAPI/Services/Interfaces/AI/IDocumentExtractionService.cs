using PersonalFinanceTrackerAPI.Services.AI.Agents.DocumentExtraction.DTOs;

namespace PersonalFinanceTrackerAPI.Services.Interfaces.AI
{
    /// <summary>
    /// Service interface for the Document Extraction Agent.
    /// Handles extracting text from uploaded documents and creating transactions.
    /// </summary>
    public interface IDocumentExtractionService
    {
        /// <summary>
        /// Processes an uploaded document by extracting text and creating transactions.
        /// </summary>
        /// <param name="fileBytes">Raw file content as byte array</param>
        /// <param name="fileName">Original file name (used to determine format and type)</param>
        /// <param name="contentType">MIME type of the uploaded file</param>
        /// <param name="userId">The authenticated user's ID</param>
        /// <returns>Processing response with created transactions or error details</returns>
        Task<DocumentProcessingResponseDTO> ProcessDocumentAsync(
            byte[] fileBytes,
            string fileName,
            string contentType,
            string userId
        );
    }
}