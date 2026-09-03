using PersonalFinanceTrackerAPI.Services.AI.Agents.DocumentExtraction.DTOs;
using PersonalFinanceTrackerAPI.Services.AI.SharedInfrastructure.Gemini;
using System.Text;

namespace PersonalFinanceTrackerAPI.Services.AI.Agents.DocumentExtraction.Providers
{
    /// <summary>
    /// Document text extraction provider using Gemini Vision API.
    /// Acts as the backend extraction provider (and fallback when other providers are added).
    /// Uses the existing GeminiClient infrastructure for vision-based extraction.
    /// </summary>
    public class GeminiVisionExtractionProvider : IDocumentExtractionProvider
    {
        private readonly GeminiClient _geminiClient;
        private readonly ILogger<GeminiVisionExtractionProvider> _logger;

        public string ProviderName => "GeminiVision";

        public GeminiVisionExtractionProvider(
            GeminiClient geminiClient,
            ILogger<GeminiVisionExtractionProvider> logger)
        {
            _geminiClient = geminiClient;
            _logger = logger;
        }

        /// <summary>
        /// Extracts plain text from a document using Gemini Vision.
        /// Maps the file extension to the appropriate MIME type for Gemini's inline data API.
        /// </summary>
        public async Task<ExtractionResultDTO> ExtractTextAsync(byte[] fileBytes, string fileName, string contentType)
        {
            try
            {
                var mimeType = ResolveMimeType(fileName, contentType);
                if (mimeType == null)
                {
                    return new ExtractionResultDTO
                    {
                        Success = false,
                        ProviderUsed = ProviderName,
                        ErrorMessage = $"Unsupported file format: {Path.GetExtension(fileName)}"
                    };
                }

                var isPdf = mimeType.Equals("application/pdf", StringComparison.OrdinalIgnoreCase);

                string extractedText;
                if (isPdf && fileBytes.Length > 500_000) // Large PDFs get page-by-page processing
                {
                    extractedText = await ExtractPdfPagesAsync(fileBytes);
                }
                else
                {
                    extractedText = await _geminiClient.GetVisionResponseAsync(
                        fileBytes,
                        mimeType,
                        GetSystemPrompt(),
                        maxOutputTokens: isPdf ? 4096 : 2048);
                }

                if (string.IsNullOrWhiteSpace(extractedText))
                {
                    return new ExtractionResultDTO
                    {
                        Success = false,
                        ProviderUsed = ProviderName,
                        ErrorMessage = "Gemini Vision returned empty text."
                    };
                }

                _logger.LogInformation("GeminiVision extraction successful: {Length} characters extracted", extractedText.Length);
                return new ExtractionResultDTO
                {
                    Success = true,
                    ExtractedText = extractedText,
                    ProviderUsed = ProviderName
                };
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Gemini Vision API request failed");
                return new ExtractionResultDTO
                {
                    Success = false,
                    ProviderUsed = ProviderName,
                    ErrorMessage = $"Gemini Vision API error: {ex.Message}"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in GeminiVision extraction");
                return new ExtractionResultDTO
                {
                    Success = false,
                    ProviderUsed = ProviderName,
                    ErrorMessage = $"Unexpected error: {ex.Message}"
                };
            }
        }

        /// <summary>
        /// Multi-pass PDF extraction for large/multi-page bank statements.
        /// Splits the request into string slices and merges results.
        /// </summary>
        private async Task<string> ExtractPdfPagesAsync(byte[] fileBytes)
        {
            var combinedText = new StringBuilder();
            var passes = 4; // Multiple sliced passes improve recall across PDF pages
            var basePrompt = GetSystemPrompt();

            for (var slice = 0; slice < passes; slice++)
            {
                var prompt = $@"{basePrompt}

This is attempt {slice + 1} of {passes}. Focus especially on any tables, line items, dates, amounts, merchant names, and transaction rows you may have missed. If you already extracted data, do not repeat it. Extract only NEW content from different pages or sections.";

                try
                {
                    var partial = await _geminiClient.GetVisionResponseAsync(
                        fileBytes,
                        "application/pdf",
                        prompt,
                        maxOutputTokens: 4096);

                    if (!string.IsNullOrWhiteSpace(partial))
                    {
                        combinedText.AppendLine(partial);
                        combinedText.AppendLine();
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "GeminiVision PDF extraction slice {Slice} failed.", slice + 1);
                }
            }

            return combinedText.ToString();
        }

        private static string GetSystemPrompt()
        {
            return @"Extract ALL text from this document. Return the complete text content exactly as written, preserving all numbers, dates, amounts, item names, and any financial information. Do not summarize, interpret, or modify the content. Do not add any explanations. Just return the raw extracted text.

If this appears to be a receipt, invoice, bill, or bank statement, extract every line item, total amount, date, merchant name, and any other visible text.

If the document contains no readable text, return an empty string.";
        }

        /// <summary>
        /// Resolves the MIME type for Gemini's inline_data API based on file extension.
        /// Falls back to the provided contentType if available.
        /// </summary>
        private static string? ResolveMimeType(string fileName, string contentType)
        {
            var extension = Path.GetExtension(fileName)?.ToLowerInvariant();

            return extension switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".webp" => "image/webp",
                ".pdf" => "application/pdf",
                _ => !string.IsNullOrWhiteSpace(contentType) && contentType.StartsWith("image/")
                    ? contentType
                    : null
            };
        }

        /// <summary>
        /// Placeholder for future true PDF-to-images conversion.
        /// Currently not used; preferred extraction path is string-based OCR prompts.
        /// </summary>
        [Obsolete("PDF text extraction now uses multi-pass OCR on the raw PDF file.")]
        private static List<byte[]> ConvertPdfPagesToImages(byte[] pdfBytes)
        {
            throw new NotSupportedException("PDF processing now uses direct OCR on the PDF file.");
        }
    }
}