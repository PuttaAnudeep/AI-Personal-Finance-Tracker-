using Microsoft.Extensions.Options;
using PersonalFinanceTrackerAPI.Services.AI.Agents.DocumentExtraction.DTOs;
using PersonalFinanceTrackerAPI.Services.Interfaces;
using PersonalFinanceTrackerAPI.Services.Interfaces.AI;

namespace PersonalFinanceTrackerAPI.Services.AI.Agents.DocumentExtraction
{
    /// <summary>
    /// Main service for the Document Extraction Agent.
    /// Orchestrates the full flow: file validation → text extraction → NLP transaction creation.
    /// Reuses NaturalLanguageTransactionCreationService for transaction parsing.
    /// </summary>
    public class DocumentExtractionService : IDocumentExtractionService
    {
        private readonly DocumentExtractionOrchestrator _orchestrator;
        private readonly INaturalLanguageTransactionCreationService _nlpService;
        private readonly IOptions<DocumentExtractionConfiguration> _config;
        private readonly ILogger<DocumentExtractionService> _logger;

        public DocumentExtractionService(
            DocumentExtractionOrchestrator orchestrator,
            INaturalLanguageTransactionCreationService nlpService,
            IOptions<DocumentExtractionConfiguration> config,
            ILogger<DocumentExtractionService> logger)
        {
            _orchestrator = orchestrator;
            _nlpService = nlpService;
            _config = config;
            _logger = logger;
        }

        /// <summary>
        /// Processes an uploaded document through the full pipeline:
        /// 1. Validates file format and size
        /// 2. Extracts text using configured providers
        /// 3. Creates transactions via NLP service
        /// 4. Returns the processing result
        /// </summary>
        public async Task<DocumentProcessingResponseDTO> ProcessDocumentAsync(
            byte[] fileBytes,
            string fileName,
            string contentType,
            string userId)
        {
            var cfg = _config.Value;

            // Step 1: Validate file extension
            var extension = Path.GetExtension(fileName)?.TrimStart('.').ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(extension) || !cfg.SupportedFormats.Contains(extension))
            {
                _logger.LogWarning("Unsupported file format: {FileName}", fileName);
                return new DocumentProcessingResponseDTO
                {
                    Success = false,
                    ErrorMessage = $"Unsupported file format '.{extension}'. Supported formats: {string.Join(", ", cfg.SupportedFormats)}"
                };
            }

            // Step 2: Validate file size
            var maxSizeBytes = cfg.FileSizeLimitMb * 1024 * 1024;
            if (fileBytes.Length > maxSizeBytes)
            {
                _logger.LogWarning("File too large: {Size} bytes (max: {MaxSize} MB)", fileBytes.Length, cfg.FileSizeLimitMb);
                return new DocumentProcessingResponseDTO
                {
                    Success = false,
                    ErrorMessage = $"File size exceeds the maximum allowed size of {cfg.FileSizeLimitMb} MB."
                };
            }

            _logger.LogInformation(
                "Processing document: {FileName} ({Size} bytes, format: {Format})",
                fileName,
                fileBytes.Length,
                extension);

            // Step 3: Extract text using orchestrator
            var extractionResult = await _orchestrator.ExtractTextAsync(fileBytes, fileName, contentType);

            if (!extractionResult.Success)
            {
                _logger.LogError("Text extraction failed: {Error}", extractionResult.ErrorMessage);
                return new DocumentProcessingResponseDTO
                {
                    Success = false,
                    ProviderUsed = extractionResult.ProviderUsed,
                    ErrorMessage = extractionResult.ErrorMessage ?? "Failed to extract text from document."
                };
            }

            _logger.LogInformation(
                "Text extraction successful using {Provider}. Extracted {Length} characters.",
                extractionResult.ProviderUsed,
                extractionResult.ExtractedText.Length);

            // Step 4: Create transactions via NLP service (reused)
            try
            {
                var transactions = await _nlpService.CreateTransactionsFromNlpAsync(
                    extractionResult.ExtractedText,
                    userId);

                _logger.LogInformation(
                    "Created {Count} transactions from extracted text using NLP service.",
                    transactions.Count);

                var response = new DocumentProcessingResponseDTO
                {
                    Success = true,
                    ProviderUsed = extractionResult.ProviderUsed,
                    TransactionCount = transactions.Count,
                    Transactions = transactions
                };

                // Optionally include extracted text for debugging
                if (cfg.IncludeExtractedTextInResponse)
                {
                    response.ExtractedText = extractionResult.ExtractedText;
                }

                return response;
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, "NLP transaction creation failed: No transactions could be parsed from extracted text.");
                return new DocumentProcessingResponseDTO
                {
                    Success = false,
                    ProviderUsed = extractionResult.ProviderUsed,
                    ErrorMessage = $"Text was extracted but no transactions could be parsed: {ex.Message}",
                    ExtractedText = cfg.IncludeExtractedTextInResponse ? extractionResult.ExtractedText : null
                };
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "NLP service unavailable during document processing.");
                return new DocumentProcessingResponseDTO
                {
                    Success = false,
                    ProviderUsed = extractionResult.ProviderUsed,
                    ErrorMessage = $"AI service unavailable: {ex.Message}"
                };
            }
        }
    }
}