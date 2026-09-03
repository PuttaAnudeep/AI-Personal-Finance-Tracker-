using Microsoft.Extensions.Options;
using PersonalFinanceTrackerAPI.Services.AI.Agents.DocumentExtraction.DTOs;

namespace PersonalFinanceTrackerAPI.Services.AI.Agents.DocumentExtraction
{
    /// <summary>
    /// Orchestrates document text extraction by selecting and prioritizing providers
    /// based on configuration. Supports primary/fallback provider patterns,
    /// forced provider selection, and fallback testing via configuration flags.
    /// </summary>
    public class DocumentExtractionOrchestrator
    {
        private readonly IEnumerable<IDocumentExtractionProvider> _providers;
        private readonly IOptions<DocumentExtractionConfiguration> _config;
        private readonly ILogger<DocumentExtractionOrchestrator> _logger;

        public DocumentExtractionOrchestrator(
            IEnumerable<IDocumentExtractionProvider> providers,
            IOptions<DocumentExtractionConfiguration> config,
            ILogger<DocumentExtractionOrchestrator> logger)
        {
            _providers = providers;
            _config = config;
            _logger = logger;
        }

        /// <summary>
        /// Extracts text from a document by trying providers in priority order.
        /// Provider selection is driven entirely by configuration.
        /// </summary>
        public async Task<ExtractionResultDTO> ExtractTextAsync(byte[] fileBytes, string fileName, string contentType)
        {
            var cfg = _config.Value;
            var orderedProviders = GetOrderedProviders(cfg);

            if (orderedProviders.Count == 0)
            {
                _logger.LogWarning("No extraction providers available");
                return new ExtractionResultDTO
                {
                    Success = false,
                    ErrorMessage = "No extraction providers are configured."
                };
            }

            foreach (var provider in orderedProviders)
            {
                _logger.LogInformation(
                    "Attempting extraction using provider: {Provider} (primary: {IsPrimary})",
                    provider.ProviderName,
                    provider.ProviderName == cfg.PrimaryProvider);

                // If fallback testing is enabled, skip the primary provider
                if (cfg.EnableFallbackTesting && provider.ProviderName == cfg.PrimaryProvider)
                {
                    _logger.LogInformation(
                        "Fallback testing enabled: Skipping primary provider {Provider}",
                        provider.ProviderName);
                    continue;
                }

                try
                {
                    var result = await provider.ExtractTextAsync(fileBytes, fileName, contentType);

                    if (result.Success)
                    {
                        _logger.LogInformation(
                            "Extraction successful using provider: {Provider}",
                            provider.ProviderName);
                        return result;
                    }

                    _logger.LogWarning(
                        "Provider {Provider} failed: {ErrorMessage}",
                        provider.ProviderName,
                        result.ErrorMessage);
                }
                catch (Exception ex)
                {
                    _logger.LogError(
                        ex,
                        "Provider {Provider} threw an exception during extraction",
                        provider.ProviderName);
                }
            }

            // All providers failed
            _logger.LogError("All extraction providers failed for document: {FileName}", fileName);
            return new ExtractionResultDTO
            {
                Success = false,
                ErrorMessage = "All extraction providers failed to extract text from the document."
            };
        }

        /// <summary>
        /// Orders providers based on configuration settings.
        /// - If ForceProvider is set, only that provider is returned.
        /// - Otherwise, the primary provider is tried first, followed by all others.
        /// </summary>
        private List<IDocumentExtractionProvider> GetOrderedProviders(DocumentExtractionConfiguration cfg)
        {
            var providerList = _providers.ToList();

            if (!string.IsNullOrWhiteSpace(cfg.ForceProvider))
            {
                var forced = providerList
                    .Where(p => p.ProviderName.Equals(cfg.ForceProvider, StringComparison.OrdinalIgnoreCase))
                    .ToList();

                if (forced.Count == 0)
                {
                    _logger.LogWarning(
                        "ForceProvider '{Provider}' not found among registered providers. Available: {Available}",
                        cfg.ForceProvider,
                        string.Join(", ", providerList.Select(p => p.ProviderName)));
                }

                return forced;
            }

            // Normal mode: Primary provider first, then all others
            var ordered = new List<IDocumentExtractionProvider>();
            var primary = providerList.FirstOrDefault(
                p => p.ProviderName.Equals(cfg.PrimaryProvider, StringComparison.OrdinalIgnoreCase));

            if (primary != null)
            {
                ordered.Add(primary);
                ordered.AddRange(providerList.Where(p => p != primary));
            }
            else
            {
                _logger.LogWarning(
                    "PrimaryProvider '{Provider}' not found. Using all providers in registration order.",
                    cfg.PrimaryProvider);
                ordered.AddRange(providerList);
            }

            return ordered;
        }
    }
}