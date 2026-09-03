using System.Text;
using System.Text.Json;
using PersonalFinanceTrackerAPI.DTOs;
using PersonalFinanceTrackerAPI.Models;
using PersonalFinanceTrackerAPI.Services.AI.SharedInfrastructure.Gemini;
using PersonalFinanceTrackerAPI.Services.Interfaces;
using PersonalFinanceTrackerAPI.Services.Interfaces.AI;

namespace PersonalFinanceTrackerAPI.Services.AI.Agents.NaturalLanguageTransactionCreation
{
    public class NaturalLanguageTransactionCreationService : INaturalLanguageTransactionCreationService
    {
        private readonly GeminiClient _geminiClient;
        private readonly ITransactionService _transactionService;
        private readonly ILogger<NaturalLanguageTransactionCreationService> _logger;

        // Threshold for chunking: any text longer than this gets split into chunks
        private const int ChunkThreshold = 3000;
        // Maximum characters per chunk
        private const int MaxChunkSize = 1500;
        // Max transactions per chunk to avoid overwhelming the response
        private const int MaxTransactionsPerChunk = 15;

        public NaturalLanguageTransactionCreationService(
            GeminiClient geminiClient,
            ITransactionService transactionService,
            ILogger<NaturalLanguageTransactionCreationService> logger)
        {
            _geminiClient = geminiClient;
            _transactionService = transactionService;
            _logger = logger;
        }

        public async Task<List<TransactionResponseDTO>> CreateTransactionsFromNlpAsync(string text, string userId)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                throw new InvalidOperationException("No text provided for transaction extraction.");
            }

            text = text.Trim();
            _logger.LogInformation("Processing text for transaction extraction. Length: {Length} chars", text.Length);

            // Unified path: chunk if text is long, otherwise process directly
            List<CreateTransactionDTO> transactionDtos;
            if (text.Length > ChunkThreshold)
            {
                _logger.LogInformation("Text exceeds {Threshold} chars. Using chunked processing.", ChunkThreshold);
                transactionDtos = await ProcessWithChunkingAsync(text);
            }
            else
            {
                transactionDtos = await ProcessSinglePromptAsync(text);
            }

            if (transactionDtos == null || transactionDtos.Count == 0)
            {
                throw new InvalidOperationException("No valid transactions could be parsed from the provided text.");
            }

            // Save all transactions to database
            var results = new List<TransactionResponseDTO>();
            foreach (var dto in transactionDtos)
            {
                var result = await _transactionService.CreateAsync(dto, userId);
                results.Add(result);
            }

            _logger.LogInformation("Successfully created {Count} transactions.", results.Count);
            return results;
        }

        /// <summary>
        /// Processes text in a single Gemini call.
        /// Uses natural language prompt for short text, or structured prompt for document-like text.
        /// </summary>
        private async Task<List<CreateTransactionDTO>> ProcessSinglePromptAsync(string text)
        {
            var isStructured = IsStructuredDocumentText(text);
            var prompt = isStructured 
                ? BuildStructuredDocumentPrompt(text, chunkIndex: null, totalChunks: null)
                : BuildNaturalLanguagePrompt(text);
            
            _logger.LogInformation("Using {PromptType} prompt for single text ({Length} chars)", 
                isStructured ? "structured" : "natural-language", text.Length);
            
            var rawResponse = await _geminiClient.GetTextResponseAsync(prompt);
            var parsedArray = TryParseJsonResponse(rawResponse);

            if (parsedArray == null || parsedArray.Count == 0)
            {
                _logger.LogWarning("No valid transactions found in Gemini response.");
                throw new InvalidOperationException("No valid transactions could be parsed from the AI response.");
            }

            _logger.LogInformation("Successfully parsed {Count} transactions.", parsedArray.Count);
            return ParseTransactionElements(parsedArray, text);
        }

        /// <summary>
        /// Processes long text by splitting into chunks and processing each separately.
        /// Always uses structured document prompt for chunked processing.
        /// </summary>
        private async Task<List<CreateTransactionDTO>> ProcessWithChunkingAsync(string text)
        {
            var allTransactions = new List<CreateTransactionDTO>();
            var chunks = ChunkText(text, MaxChunkSize);

            _logger.LogInformation("Text split into {Count} chunks for processing.", chunks.Count);

            for (var i = 0; i < chunks.Count; i++)
            {
                try
                {
                    _logger.LogInformation("Processing chunk {Index}/{Count} ({Length} chars)",
                        i + 1, chunks.Count, chunks[i].Length);

                    var prompt = BuildStructuredDocumentPrompt(chunks[i], chunkIndex: i + 1, totalChunks: chunks.Count);
                    var rawResponse = await _geminiClient.GetTextResponseAsync(prompt);
                    var parsedArray = TryParseJsonResponse(rawResponse);

                    if (parsedArray != null && parsedArray.Count > 0)
                    {
                        var chunkTransactions = ParseTransactionElements(parsedArray, chunks[i]);
                        allTransactions.AddRange(chunkTransactions);
                        _logger.LogInformation("Chunk {Index} produced {Count} transactions.", i + 1, chunkTransactions.Count);
                    }
                    else
                    {
                        _logger.LogWarning("Chunk {Index} returned no transactions.", i + 1);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Chunk {Index} failed, continuing with remaining chunks.", i + 1);
                }
            }

            return allTransactions;
        }

        /// <summary>
        /// Builds a prompt optimized for natural language text (short, conversational inputs).
        /// </summary>
        private static string BuildNaturalLanguagePrompt(string text)
        {
            var todayStr = DateTime.UtcNow.ToString("yyyy-MM-dd");
            var sb = new StringBuilder();

            sb.AppendLine("You are a financial transaction parser. Extract ALL transactions from the text below and return a JSON array.");
            sb.AppendLine();
            sb.AppendLine("Each object must have exactly these fields:");
            sb.AppendLine("{ \"date\": \"YYYY-MM-DD\", \"type\": \"Expense\" or \"Income\", \"category\": \"one of the categories below\", \"amount\": 123.45, \"description\": \"short merchant name\" }");
            sb.AppendLine("RULES:");
            sb.AppendLine("- Use today's date (" + todayStr + ") if the date cannot be determined");
            sb.AppendLine("- Type: \"Expense\" for money spent, \"Income\" for money received");
            sb.AppendLine("- Amount must be a positive number (use absolute value)");
            sb.AppendLine("- Description: short merchant/payee name only, max 30 characters");
            sb.AppendLine("- ALL strings must use double quotes");
            sb.AppendLine("- Escape any double quotes inside text with backslash");
            sb.AppendLine("- Remove commas, apostrophes, and special characters from descriptions");
            sb.AppendLine("- Never invent transactions that are not mentioned in the text");
            sb.AppendLine("- If a field is missing, use a sensible default (today's date for date, \"Other\" for category)");
            sb.AppendLine("CATEGORIES (use EXACTLY one):");
            sb.AppendLine("- Food: Restaurants, Swiggy/Zomato, groceries, snacks, ice cream");
            sb.AppendLine("- Travel: Cab, taxi, bus, train, flight, Uber/Ola");
            sb.AppendLine("- Shopping: Clothes, electronics, Amazon/Flipkart");
            sb.AppendLine("- Fuel: Petrol, diesel");
            sb.AppendLine("- Rent: House rent");
            sb.AppendLine("- Medical: Doctor, pharmacy, hospital");
            sb.AppendLine("- Entertainment: Movies, games, Netflix, Spotify");
            sb.AppendLine("- Bills: Electricity, water, internet, phone");
            sb.AppendLine("- Education: Courses, books, fees");
            sb.AppendLine("- Groceries: Supermarket, grocery store");          	
            sb.AppendLine("IMPORTANT MAPPING:");
            sb.AppendLine("- Swiggy/Zomato/KFC/restaurant → Food");
            sb.AppendLine("- Cab/taxi/uber/ola → Travel");
            sb.AppendLine("- Petrol/diesel → Fuel");
            sb.AppendLine("- Ice cream/snacks → Food");
            sb.AppendLine("- Amazon/Flipkart → Shopping");
            sb.AppendLine("- Netflix/Spotify → Entertainment");
            sb.AppendLine("- JIO/Airtel/Airtel bills → Bills");
            sb.AppendLine();
            sb.AppendLine("Text to parse:");
            sb.AppendLine(text);
            sb.AppendLine();
            sb.AppendLine("Return ONLY a valid JSON array. No markdown, no explanations, no extra text..");

            return sb.ToString();
        }

        /// <summary>
        /// Builds a detailed prompt optimized for structured financial documents (bank statements, invoices, bills).
        /// Based on the user's detailed specification.
        /// </summary>
        private static string BuildStructuredDocumentPrompt(string text, int? chunkIndex, int? totalChunks)
        {
            var todayStr = DateTime.UtcNow.ToString("yyyy-MM-dd");
            var sb = new StringBuilder();

            sb.AppendLine("You are a financial transaction parser. Extract ALL financial transactions from the text below and return a JSON array.");

            if (chunkIndex.HasValue && totalChunks.HasValue)
            {
                sb.AppendLine($"This is chunk {chunkIndex.Value} of {totalChunks.Value} from a longer document.");
            }

            sb.AppendLine();
            sb.AppendLine("==================================================");
            sb.AppendLine("TRANSACTION IDENTIFICATION RULES");
            sb.AppendLine("==================================================");
            sb.AppendLine("Identify every financial transaction present in the input.");
            sb.AppendLine();
            sb.AppendLine("Expense Transactions:");
            sb.AppendLine("- UPI DR, Debit, Withdrawal, Purchase, Payment");
            sb.AppendLine("- Wallet Spend, Bill Payment");
            sb.AppendLine("- Merchant names: Amazon, Reliance, Zepto, Metro, Restaurant, Shopping");
            sb.AppendLine();
            sb.AppendLine("Income Transactions:");
            sb.AppendLine("- UPI CR, Credit, Salary, Refund, Cash Deposit");
            sb.AppendLine("- Transfer Received, Interest Paid, Cashback, Incentive");
            sb.AppendLine();
            sb.AppendLine("IGNORE these lines completely:");
            sb.AppendLine("- Opening Balance, Closing Balance");
            sb.AppendLine("- Account Summary, Account Metadata");
            sb.AppendLine("- Advertisements, Terms & Conditions");
            sb.AppendLine("- Banking Notices, Customer Information");
            sb.AppendLine("- Branch Details, Signature Information");
            sb.AppendLine();
            sb.AppendLine("==================================================");
            sb.AppendLine("BANK STATEMENT RULES");
            sb.AppendLine("==================================================");
            sb.AppendLine("Withdrawal Amount → Expense Transaction");
            sb.AppendLine("Deposit Amount → Income Transaction");
            sb.AppendLine();
            sb.AppendLine("Example 1:");
            sb.AppendLine("Date: 02-Jun-2026");
            sb.AppendLine("Description: Amazon");
            sb.AppendLine("Withdrawal: 383.00");
            sb.AppendLine();
            sb.AppendLine("Output: { \"type\": \"Expense\", \"amount\": 383.00, \"description\": \"Amazon\", \"date\": \"2026-06-02\" }");
            sb.AppendLine();
            sb.AppendLine("Example 2:");
            sb.AppendLine("Date: 22-Jun-2026");
            sb.AppendLine("Description: PUTTA S");
            sb.AppendLine("Deposit: 1000.00");
            sb.AppendLine();
            sb.AppendLine("Output: { \"type\": \"Income\", \"amount\": 1000.00, \"description\": \"PUTTA S\", \"date\": \"2026-06-22\" }");
            sb.AppendLine();
            sb.AppendLine("==================================================");
            sb.AppendLine("MERCHANT EXTRACTION RULES");
            sb.AppendLine("==================================================");
            sb.AppendLine("Extract the most meaningful merchant or counterparty name.");
            sb.AppendLine();
            sb.AppendLine("Examples:");
            sb.AppendLine("Amazon I → Amazon");
            sb.AppendLine("ZEPTO MA → Zepto");
            sb.AppendLine("RELIANCE → Reliance");
            sb.AppendLine("HYDMETROINAPP → Hyderabad Metro");
            sb.AppendLine("cityflo → Cityflo");
            sb.AppendLine("Udemy → Udemy");
            sb.AppendLine();
            sb.AppendLine("Do NOT use raw UPI hashes as descriptions.");
            sb.AppendLine();
            sb.AppendLine("==================================================");
            sb.AppendLine("CATEGORY ASSIGNMENT");
            sb.AppendLine("==================================================");
            sb.AppendLine("CRITICAL: Always assign the most specific category. Only use 'Other' as a last resort if no other category fits.");
            sb.AppendLine();
            sb.AppendLine("Mappings (use these EXACTLY):");
            sb.AppendLine("- Cafe, Restaurant, Food, Dining, Mess, Cafe → Food");
            sb.AppendLine("- Swiggy, Zomato, Blinkit, Zepto, BigBasket, Grocery → Groceries");
            sb.AppendLine("- Amazon, Flipkart, Shopping, Retail → Shopping");
            sb.AppendLine("- Uber, Ola, Taxi, Cab, Metro, Bus, Train, Travel → Transportation");
            sb.AppendLine("- Petrol, Diesel, Fuel Station → Fuel");
            sb.AppendLine("- Rent, House Rent, Property Rent → Rent");
            sb.AppendLine("- Doctor, Pharmacy, Hospital, Medical → Medical");
            sb.AppendLine("- Netflix, Disney+, Hotstar, Movie, Games → Entertainment");
            sb.AppendLine("- Electricity, Water, Internet, Mobile, Phone, Jio, Airtel → Bills");
            sb.AppendLine("- Course, Book, Fee, Coaching, Education → Education");
            sb.AppendLine("- Salary, Income, Refund, Cashback, Interest → Income (or appropriate income type)");
            sb.AppendLine();
            sb.AppendLine("==================================================");
            sb.AppendLine("DUPLICATE PREVENTION");
            sb.AppendLine("==================================================");
            sb.AppendLine("Return exactly one transaction object per actual transaction.");
            sb.AppendLine("Do not create duplicates.");
            sb.AppendLine("Do not split a single transaction into multiple entries.");
            sb.AppendLine();
            sb.AppendLine("==================================================");
            sb.AppendLine("DATE HANDLING");
            sb.AppendLine("==================================================");
            sb.AppendLine("Preserve transaction dates whenever present.");
            sb.AppendLine("Convert dates into ISO format: YYYY-MM-DD");
            sb.AppendLine();
            sb.AppendLine("Example: 02-Jun-2026 → 2026-06-02");
            sb.AppendLine();
            sb.AppendLine("==================================================");
            sb.AppendLine("OUTPUT REQUIREMENT");
            sb.AppendLine("==================================================");
            sb.AppendLine("Return ONLY valid JSON.");
            sb.AppendLine("No markdown.");
            sb.AppendLine("No explanations.");
            sb.AppendLine("No comments.");
            sb.AppendLine("No additional text.");
            sb.AppendLine("The response must be a JSON array.");
            sb.AppendLine();
            sb.AppendLine("Example:");
            sb.AppendLine("[");
            sb.AppendLine("  {");
            sb.AppendLine("    \"type\": \"Expense\",");
            sb.AppendLine("    \"amount\": 383,");
            sb.AppendLine("    \"description\": \"Amazon\",");
            sb.AppendLine("    \"category\": \"Shopping\",");
            sb.AppendLine("    \"date\": \"2026-06-02\"");
            sb.AppendLine("  }");
            sb.AppendLine("]");
            sb.AppendLine();
            sb.AppendLine("==================================================");
            sb.AppendLine("FAILURE REQUIREMENT");
            sb.AppendLine("==================================================");
            sb.AppendLine("If no transactions can be identified:");
            sb.AppendLine("Return: []");
            sb.AppendLine("Do not explain why.");
            sb.AppendLine("Do not return narrative text.");
            sb.AppendLine();
            sb.AppendLine("==================================================");
            sb.AppendLine("TEXT TO PARSE:");
            sb.AppendLine("==================================================");
            sb.AppendLine(text);
            sb.AppendLine();
            sb.AppendLine($"Maximum {MaxTransactionsPerChunk} transactions per chunk.");
            sb.AppendLine("Return ONLY the JSON array now.");

            return sb.ToString();
        }

        /// <summary>
        /// Determines if the text appears to be from a structured document (bank statement, invoice, etc.)
        /// rather than natural language.
        /// </summary>
        private static bool IsStructuredDocumentText(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return false;

            text = text.Trim();

            // Structured documents are typically longer
            if (text.Length < 200)
                return false;

            // Count lines - structured docs have many short lines
            var lines = text.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            var avgLineLength = text.Length / (double)lines.Length;

            // Structured documents have shorter average line length (< 60 chars per line)
            if (avgLineLength > 80)
                return false;

            // Check for structured patterns: dates, amounts, tabular data
            var dateCount = 0;
            var amountCount = 0;
            foreach (var line in lines)
            {
                // Look for date patterns like "02-Jun-2026" or "06/02/2026"
                if (System.Text.RegularExpressions.Regex.IsMatch(line, @"\d{1,2}[-/]\w+[-/]\d{2,4}"))
                    dateCount++;

                // Look for currency amounts like ₹500 or amounts with decimals
                if (System.Text.RegularExpressions.Regex.IsMatch(line, @"[₹$€]?\s*\d+[\.,]\d{2}"))
                    amountCount++;
            }

            // If multiple dates and amounts found, it's likely structured
            return dateCount >= 2 || amountCount >= 3;
        }

        /// <summary>
        /// Splits text into chunks at line boundaries, respecting MaxChunkSize.
        /// </summary>
        private static List<string> ChunkText(string text, int maxChunkSize)
        {
            var chunks = new List<string>();
            var lines = text.Split('\n');

            var currentChunk = new StringBuilder();
            foreach (var line in lines)
            {
                if (currentChunk.Length + line.Length + 1 > maxChunkSize && currentChunk.Length > 0)
                {
                    chunks.Add(currentChunk.ToString().Trim());
                    currentChunk.Clear();
                }
                currentChunk.AppendLine(line);
            }

            if (currentChunk.Length > 0)
                chunks.Add(currentChunk.ToString().Trim());

            return chunks;
        }

        /// <summary>
        /// Parses JsonElement array items into CreateTransactionDTO objects.
        /// Shared across single and chunked processing paths.
        /// </summary>
        private static List<CreateTransactionDTO> ParseTransactionElements(List<JsonElement> parsedArray, string fallbackText)
        {
            var dtos = new List<CreateTransactionDTO>();

            foreach (var item in parsedArray)
            {
                var finalDate = DateTime.UtcNow;

                // Parse date
                if (item.TryGetProperty("date", out var dateEl) && !string.IsNullOrWhiteSpace(dateEl.GetString()))
                {
                    var dateStr = dateEl.GetString()!;
                    if (DateTime.TryParse(dateStr, out var parsedDate))
                    {
                        var oneYearAgo = DateTime.UtcNow.AddYears(-1);
                        var oneDayAhead = DateTime.UtcNow.AddDays(1);
                        if (parsedDate >= oneYearAgo && parsedDate <= oneDayAhead)
                            finalDate = parsedDate;
                    }
                }

                // Parse type
                var transactionType = TransactionType.Expense;
                if (item.TryGetProperty("type", out var typeEl))
                {
                    var typeStr = typeEl.GetString();
                    if (!string.IsNullOrWhiteSpace(typeStr) &&
                        Enum.TryParse<TransactionType>(typeStr, true, out var parsedType))
                        transactionType = parsedType;
                }

                // Parse category
                var transactionCategory = TransactionCategory.Other;
                if (item.TryGetProperty("category", out var categoryEl))
                {
                    var catStr = categoryEl.GetString();
                    if (!string.IsNullOrWhiteSpace(catStr) &&
                        Enum.TryParse<TransactionCategory>(catStr, true, out var parsedCategory))
                        transactionCategory = parsedCategory;
                }

                // Amount
                var amount = 0m;
                if (item.TryGetProperty("amount", out var amountEl))
                {
                    try { amount = Convert.ToDecimal(amountEl.GetDouble()); }
                    catch { amount = 0m; }
                }

                // Description
                var description = fallbackText;
                if (item.TryGetProperty("description", out var descEl))
                {
                    var rawDesc = descEl.GetString();
                    if (!string.IsNullOrWhiteSpace(rawDesc))
                        description = SanitizeDescription(rawDesc);
                }

                dtos.Add(new CreateTransactionDTO
                {
                    Date = finalDate,
                    Type = transactionType,
                    Category = transactionCategory,
                    Amount = amount,
                    Description = description
                });
            }

            return dtos;
        }

        /// <summary>
        /// Sanitizes a description string to remove problematic characters.
        /// </summary>
        private static string SanitizeDescription(string description)
        {
            if (string.IsNullOrWhiteSpace(description))
                return string.Empty;

            description = description.Trim();
            if (description.Length > 100)
                description = description[..100];

            var sanitized = new StringBuilder(description.Length);
            foreach (var c in description)
            {
                if (char.IsControl(c) && c != ' ')
                    continue;
                sanitized.Append(c);
            }

            return sanitized.ToString().Trim();
        }

        /// <summary>
        /// Attempts to parse a JSON array from the Gemini response with multiple strategies.
        /// </summary>
        private static List<JsonElement>? TryParseJsonResponse(string rawResponse)
        {
            if (string.IsNullOrWhiteSpace(rawResponse))
                return null;

            // Strategy 1: Direct parse
            try
            {
                var parsed = JsonSerializer.Deserialize<List<JsonElement>>(rawResponse);
                if (parsed != null && parsed.Count > 0)
                    return parsed;
            }
            catch (JsonException) { }

            // Strategy 2: Repair truncated JSON
            var repaired = AttemptJsonRepair(rawResponse);
            if (repaired != null)
            {
                try
                {
                    var parsed = JsonSerializer.Deserialize<List<JsonElement>>(repaired);
                    if (parsed != null && parsed.Count > 0)
                        return parsed;
                }
                catch (JsonException) { }
            }

            // Strategy 3: Extract JSON array by bracket matching
            try
            {
                var extracted = ExtractJsonArray(rawResponse);
                if (extracted != null)
                {
                    var parsed = JsonSerializer.Deserialize<List<JsonElement>>(extracted);
                    if (parsed != null && parsed.Count > 0)
                        return parsed;
                }
            }
            catch (JsonException) { }

            return null;
        }

        private static string? AttemptJsonRepair(string text)
        {
            text = text.Trim();
            var startIndex = text.IndexOf('[');
            if (startIndex < 0) return null;

            text = text[startIndex..];

            var depth = 0;
            var inString = false;
            var escaped = false;
            var repairedText = new StringBuilder();
            var lastGoodEndIndex = -1;

            for (var i = 0; i < text.Length; i++)
            {
                var c = text[i];

                if (escaped) { escaped = false; repairedText.Append(c); continue; }
                if (c == '\\' && inString) { escaped = true; repairedText.Append(c); continue; }
                if (c == '"') { inString = !inString; repairedText.Append(c); continue; }

                if (!inString)
                {
                    if (c == '[' || c == '{') depth++;
                    else if (c == ']') { depth--; if (depth == 0) lastGoodEndIndex = i; }
                    else if (c == '}') depth--;
                }

                repairedText.Append(c);
            }

            if (inString) repairedText.Append('"');
            while (depth > 0) { repairedText.Append(']'); depth--; }

            var result = repairedText.ToString();
            if (lastGoodEndIndex > 0 && lastGoodEndIndex < result.Length - 1)
                return result[..(lastGoodEndIndex + 1)];

            return result;
        }

        private static string? ExtractJsonArray(string text)
        {
            var start = text.IndexOf('[');
            if (start < 0) return null;

            text = text[start..];

            var depth = 0;
            var inString = false;
            var escaped = false;

            for (var i = 0; i < text.Length; i++)
            {
                var c = text[i];

                if (escaped) { escaped = false; continue; }
                if (c == '\\' && inString) { escaped = true; continue; }
                if (c == '"') { inString = !inString; continue; }

                if (!inString)
                {
                    if (c == '[' || c == '{') depth++;
                    else if (c == ']') depth--;
                    else if (c == '}') depth--;
                }

                if (depth == 0 && i > 0)
                    return text[..(i + 1)];
            }

            return null;
        }
    }
}