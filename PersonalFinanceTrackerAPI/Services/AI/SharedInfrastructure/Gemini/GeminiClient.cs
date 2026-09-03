using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
namespace PersonalFinanceTrackerAPI.Services.AI.SharedInfrastructure.Gemini
{
    /// <summary>
    /// Shared HTTP client for making Gemini API calls.
    /// Handles model fallback, error handling, and response extraction.
    /// </summary>
    public class GeminiClient
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<GeminiClient> _logger;

        public GeminiClient(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<GeminiClient> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
        }

        /// <summary>
        /// Sends a prompt to Gemini and returns the raw text response.
        /// Handles model fallback and error logging automatically.
        /// </summary>
        public async Task<string> GetTextResponseAsync(string systemPrompt, int maxOutputTokens = 16384)
        {
            var apiKey = _configuration["Gemini:ApiKey"];
            var primaryModel = _configuration["Gemini:ModelName"] ?? "gemini-2.5-flash";
            var fallbackModel = _configuration["Gemini:FallbackModelName"];

            var modelNamesToTry = new[]
            {
                primaryModel,
                fallbackModel
            }
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Distinct()
            .ToArray();

            HttpResponseMessage? response = null;
            string? jsonResponse = null;

            foreach (var tryModel in modelNamesToTry)
            {
                try
                {
                    var endpoint = $"https://generativelanguage.googleapis.com/v1beta/models/{tryModel}:generateContent?key={apiKey}";

                    var requestBody = new
                    {
                        contents = new[]
                        {
                            new
                            {
                                parts = new[]
                                {
                                    new { text = systemPrompt }
                                }
                            }
                        },
                        generationConfig = new
                        {
                            temperature = 0.3,
                            maxOutputTokens
                        }
                    };

                    var jsonRequest = JsonSerializer.Serialize(requestBody);
                    var httpContent = new StringContent(jsonRequest, Encoding.UTF8, "application/json");

                    _logger.LogInformation("Calling Gemini model {Model}", tryModel);

                    response = await _httpClient.PostAsync(endpoint, httpContent);
                    jsonResponse = await response.Content.ReadAsStringAsync();

                    if (response.IsSuccessStatusCode)
                    {
                        _logger.LogInformation("Gemini success using model {Model}", tryModel);
                        break;
                    }

                    _logger.LogWarning("Gemini model {Model} failed: {Response}", tryModel, jsonResponse);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error calling Gemini model {Model}", tryModel);
                }
            }

            if (response == null || !response.IsSuccessStatusCode)
            {
                throw new HttpRequestException($"Gemini API failed. Status: {response?.StatusCode}. Response: {jsonResponse}");
            }

            var geminiResponse = JsonSerializer.Deserialize<GeminiResponse>(jsonResponse!);

            if (geminiResponse?.Candidates == null || geminiResponse.Candidates.Count == 0)
            {
                throw new InvalidOperationException("No candidates returned by Gemini.");
            }

            var textContent = geminiResponse.Candidates[0].Content?.Parts?.FirstOrDefault()?.Text;

            if (string.IsNullOrWhiteSpace(textContent))
            {
                throw new InvalidOperationException("Gemini returned empty text.");
            }

            return CleanJsonResponse(textContent);
        }

        /// <summary>
        /// Sends a prompt with an image to Gemini and returns the raw text response.
        /// The image is sent as inline base64 data.
        /// Handles model fallback and error logging automatically.
        /// </summary>
        /// <param name="fileBytes">Raw file bytes (image or PDF)</param>
        /// <param name="mimeType">MIME type of the file (e.g., "image/jpeg", "application/pdf")</param>
        /// <param name="systemPrompt">Text prompt to accompany the image</param>
        /// <param name="maxOutputTokens">Maximum tokens in the response (default: 1024 for vision)</param>
        /// <returns>Extracted text response from Gemini</returns>
        public async Task<string> GetVisionResponseAsync(
            byte[] fileBytes,
            string mimeType,
            string systemPrompt,
            int maxOutputTokens = 1024)
        {
            var apiKey = _configuration["Gemini:ApiKey"];
            var primaryModel = _configuration["Gemini:ModelName"] ?? "gemini-2.5-flash";
            var fallbackModel = _configuration["Gemini:FallbackModelName"];

            var modelNamesToTry = new[]
            {
                primaryModel,
                fallbackModel
            }
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Distinct()
            .ToArray();

            HttpResponseMessage? response = null;
            string? jsonResponse = null;
            var base64Data = Convert.ToBase64String(fileBytes);

            foreach (var tryModel in modelNamesToTry)
            {
                try
                {
                    var endpoint = $"https://generativelanguage.googleapis.com/v1beta/models/{tryModel}:generateContent?key={apiKey}";

                    var requestBody = new
                    {
                        contents = new[]
                        {
                            new
                            {
                                parts = new object[]
                                {
                                    new { text = systemPrompt },
                                    new
                                    {
                                        inline_data = new
                                        {
                                            mime_type = mimeType,
                                            data = base64Data
                                        }
                                    }
                                }
                            }
                        },
                        generationConfig = new
                        {
                            temperature = 0.1,
                            maxOutputTokens
                        }
                    };

                    var jsonRequest = JsonSerializer.Serialize(requestBody);
                    var httpContent = new StringContent(jsonRequest, Encoding.UTF8, "application/json");

                    _logger.LogInformation("Calling Gemini vision model {Model} with {MimeType} ({Size} bytes)",
                        tryModel, mimeType, fileBytes.Length);

                    response = await _httpClient.PostAsync(endpoint, httpContent);
                    jsonResponse = await response.Content.ReadAsStringAsync();

                    if (response.IsSuccessStatusCode)
                    {
                        _logger.LogInformation("Gemini vision success using model {Model}", tryModel);
                        break;
                    }

                    _logger.LogWarning("Gemini vision model {Model} failed: {Response}", tryModel, jsonResponse);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error calling Gemini vision model {Model}", tryModel);
                }
            }

            if (response == null || !response.IsSuccessStatusCode)
            {
                throw new HttpRequestException($"Gemini Vision API failed. Status: {response?.StatusCode}. Response: {jsonResponse}");
            }

            var geminiResponse = JsonSerializer.Deserialize<GeminiResponse>(jsonResponse!);

            if (geminiResponse?.Candidates == null || geminiResponse.Candidates.Count == 0)
            {
                throw new InvalidOperationException("No candidates returned by Gemini vision.");
            }

            var textContent = geminiResponse.Candidates[0].Content?.Parts?.FirstOrDefault()?.Text;

            if (string.IsNullOrWhiteSpace(textContent))
            {
                throw new InvalidOperationException("Gemini vision returned empty text.");
            }

            return CleanJsonResponse(textContent);
        }

        private static string CleanJsonResponse(string text)
        {
            text = text.Trim();
            if (text.StartsWith("```json"))
            {
                text = text.Substring(7);
                var endIndex = text.LastIndexOf("```");
                if (endIndex >= 0)
                    text = text.Substring(0, endIndex);
            }
            else if (text.StartsWith("```"))
            {
                text = text.Substring(3);
                var endIndex = text.LastIndexOf("```");
                if (endIndex >= 0)
                    text = text.Substring(0, endIndex);
            }
            return text.Trim();
        }
    }
}