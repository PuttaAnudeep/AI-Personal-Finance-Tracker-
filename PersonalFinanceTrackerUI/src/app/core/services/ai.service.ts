import { Injectable, inject } from '@angular/core';
import { from, Observable } from 'rxjs';
import { AuthService } from '../authentication/auth.service';
import { API_CONFIG } from '../config/api.config';
import { SpendingInsight, AnomalyDetectionResponse, BudgetGoalResponse, BudgetGoalRequest, InsightHistoryResponse, BudgetGoalHistoryResponse, AnomalyHistoryResponse, AnalysisRunHistory } from '../models/models';

export interface NlpTransactionRequest {
  text: string;
}

export interface NlpTransactionResponse {
  id: number;
  date: string;
  type: string;
  category: string;
  amount: number;
  description: string;
  userId: string;
}

export interface BudgetGoalRequestDTO {
  targetSavings: number;
  months: number;
  planType?: string;
}

/**
 * Response from POST /api/ai/process-document (Gemini Vision fallback)
 */
export interface DocumentProcessingResponse {
  success: boolean;
  providerUsed: string | null;
  transactionCount: number;
  transactions: NlpTransactionResponse[];
  errorMessage?: string;
  extractedText?: string;
}

/** Supported file formats for document upload */
export const SUPPORTED_DOCUMENT_FORMATS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'] as const;
export type SupportedDocumentFormat = typeof SUPPORTED_DOCUMENT_FORMATS[number];

/**
 * Default toggle for document extraction mode.
 * Set to true to force Gemini Vision backend processing (skip Puter OCR).
 * Set to false to use Puter OCR as primary with Gemini Vision fallback.
 * The component can override this at runtime via the UI toggle button.
 */
export const DOCUMENT_EXTRACTION_USE_GEMINI_ONLY = false;

@Injectable({ providedIn: 'root' })
export class AiService {
  private auth = inject(AuthService);

  private requestJson<T>(url: string, init?: RequestInit): Observable<T> {
    const token = this.auth.getToken();

    const method = init?.method ?? 'GET';
    const bodyStr = init?.body ? JSON.stringify(JSON.parse(init.body as string), null, 2) : 'none';

    console.log(`[AI Service] ${method} ${url}`);
    if (init?.body) {
      console.log(`[AI Service] Request body:`, JSON.parse(init.body as string));
    }

    return from(
      fetch(url, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(init?.headers ?? {}),
        },
      }).then(async response => {
        const text = await response.text();
        console.log(`[AI Service] Response status: ${response.status}`);
        
        if (!response.ok) {
          console.error(`[AI Service] Error response:`, text);
          throw new Error(text || `Request failed with status ${response.status}`);
        }

        if (text) {
          const parsed = JSON.parse(text) as T;
          console.log(`[AI Service] Response data:`, parsed);
          return parsed;
        }
        
        console.log(`[AI Service] Response: empty body`);
        return undefined as T;
      })
    );
  }

  /** POST /api/ai/create-transaction — Parse natural language and create transactions */
  createTransactionFromNlp(text: string): Observable<NlpTransactionResponse[]> {
    return this.requestJson<NlpTransactionResponse[]>(
      `${API_CONFIG.baseUrl}/ai/create-transaction`,
      {
        method: 'POST',
        body: JSON.stringify({ text } satisfies NlpTransactionRequest),
      }
    );
  }

  /**
   * PRIMARY PATH: Process document text extracted by Puter OCR in the browser.
   * Sends the extracted text to the existing NLP endpoint to create transactions.
   * Reuses POST /api/ai/create-transaction
   */
  processDocumentText(extractedText: string): Observable<NlpTransactionResponse[]> {
    return this.requestJson<NlpTransactionResponse[]>(
      `${API_CONFIG.baseUrl}/ai/create-transaction`,
      {
        method: 'POST',
        body: JSON.stringify({ text: extractedText } satisfies NlpTransactionRequest),
      }
    );
  }

  /**
   * FALLBACK PATH: Upload document file to backend for Gemini Vision extraction.
   * Used when Puter OCR fails, times out, or returns empty text.
   * Uses POST /api/ai/process-document with multipart/form-data.
   */
  processDocumentFile(file: File): Observable<DocumentProcessingResponse> {
    const token = this.auth.getToken();
    const formData = new FormData();
    formData.append('file', file, file.name);

    const filename = file.name;
    const filesize = file.size;

    console.log(`[AI Service] POST ${API_CONFIG.baseUrl}/ai/process-document`);
    console.log(`[AI Service] File: ${filename} (${filesize} bytes, type: ${file.type})`);

    return from(
      fetch(`${API_CONFIG.baseUrl}/ai/process-document`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          // Note: Do NOT set Content-Type. Browser sets it automatically with boundary for FormData.
        },
        body: formData,
      }).then(async response => {
        const text = await response.text();
        console.log(`[AI Service] Response status: ${response.status}`);

        if (!response.ok) {
          console.error(`[AI Service] Error response:`, text);
          throw new Error(text || `Request failed with status ${response.status}`);
        }

        const parsed = JSON.parse(text) as DocumentProcessingResponse;
        console.log(`[AI Service] Response data:`, parsed);
        if (parsed.extractedText) {
          console.log('[AI Service] Extracted Text:', parsed.extractedText);
        }
        return parsed;
      })
    );
  }

  /** GET /api/ai/insights — Generate spending insights */
  getInsights(months = 3): Observable<SpendingInsight[]> {
    return this.requestJson<SpendingInsight[]>(
      `${API_CONFIG.baseUrl}/ai/insights?months=${months}`
    );
  }

  /** POST /api/ai/budget-goal — Get budget recommendations */
  getBudgetGoal(request: BudgetGoalRequest): Observable<BudgetGoalResponse> {
    const dto: BudgetGoalRequestDTO = {
      targetSavings: request.targetSavings,
      months: request.months,
      planType: request.planType ?? 'Focused',
    };
    return this.requestJson<BudgetGoalResponse>(
      `${API_CONFIG.baseUrl}/ai/budget-goal`,
      {
        method: 'POST',
        body: JSON.stringify(dto),
      }
    );
  }

  /** GET /api/ai/detect-anomalies — Detect spending anomalies (threshold fixed at 150 on backend) */
  detectAnomalies(months = 3): Observable<AnomalyDetectionResponse> {
    return this.requestJson<AnomalyDetectionResponse>(
      `${API_CONFIG.baseUrl}/ai/detect-anomalies?months=${months}`
    );
  }

  // ================================================================
  // HISTORY & RETRIEVAL METHODS
  // ================================================================

  /** GET /api/ai/insights/history — Past AI insight sets */
  getInsightHistory(limit = 10, includeArchived = false): Observable<InsightHistoryResponse[]> {
    return this.requestJson<InsightHistoryResponse[]>(
      `${API_CONFIG.baseUrl}/ai/insights/history?limit=${limit}&includeArchived=${includeArchived}`
    );
  }

  /** GET /api/ai/budget-goal/history — Past budget goal recommendation sets */
  getBudgetGoalHistory(limit = 10, includeArchived = false): Observable<BudgetGoalHistoryResponse[]> {
    return this.requestJson<BudgetGoalHistoryResponse[]>(
      `${API_CONFIG.baseUrl}/ai/budget-goal/history?limit=${limit}&includeArchived=${includeArchived}`
    );
  }

  /** GET /api/ai/detect-anomalies/history — Past anomaly detection sets */
  getAnomalyHistory(limit = 10, includeArchived = false): Observable<AnomalyHistoryResponse[]> {
    return this.requestJson<AnomalyHistoryResponse[]>(
      `${API_CONFIG.baseUrl}/ai/detect-anomalies/history?limit=${limit}&includeArchived=${includeArchived}`
    );
  }

  /** GET /api/ai/analysis-runs — Central audit trail */
  getAnalysisRuns(agentType?: string, limit = 20): Observable<AnalysisRunHistory[]> {
    const typeParam = agentType ? `&agentType=${agentType}` : '';
    return this.requestJson<AnalysisRunHistory[]>(
      `${API_CONFIG.baseUrl}/ai/analysis-runs?limit=${limit}${typeParam}`
    );
  }

  /** GET /api/ai/budget-goal/active — Current active budget goal */
  getActiveBudgetGoal(): Observable<BudgetGoalHistoryResponse> {
    return this.requestJson<BudgetGoalHistoryResponse>(
      `${API_CONFIG.baseUrl}/ai/budget-goal/active`
    );
  }

  /** PUT /api/ai/budget-goal/{id}/activate — Set active budget goal */
  activateBudgetGoal(id: number): Observable<any> {
    return this.requestJson<any>(
      `${API_CONFIG.baseUrl}/ai/budget-goal/${id}/activate`,
      { method: 'PUT' }
    );
  }

  /** DELETE /api/ai/insights/{id}/archive — Soft-delete insight */
  archiveInsight(id: number): Observable<any> {
    return this.requestJson<any>(
      `${API_CONFIG.baseUrl}/ai/insights/${id}/archive`,
      { method: 'DELETE' }
    );
  }

  /** DELETE /api/ai/budget-goal/{id}/archive — Soft-delete budget goal */
  archiveBudgetGoal(id: number): Observable<any> {
    return this.requestJson<any>(
      `${API_CONFIG.baseUrl}/ai/budget-goal/${id}/archive`,
      { method: 'DELETE' }
    );
  }

  /** DELETE /api/ai/detect-anomalies/{id}/archive — Soft-delete anomaly result */
  archiveAnomalyResult(id: number): Observable<any> {
    return this.requestJson<any>(
      `${API_CONFIG.baseUrl}/ai/detect-anomalies/${id}/archive`,
      { method: 'DELETE' }
    );
  }

  /**
   * Complete document processing pipeline with fallback support.
   * Primary: Puter OCR in browser → existing NLP endpoint
   * Fallback: Backend Gemini Vision → NLP endpoint
   *
   * @param file The uploaded document file
   * @param puterOcr The Puter.js SDK instance (pass null to force Gemini Vision)
   * @param useGeminiOnly When true, skips Puter OCR and uses Gemini Vision directly.
   *                      When false (default), Puter OCR is attempted first with Gemini Vision fallback.
   * @returns Observable that emits the final processing response
   */
  processDocumentWithFallback(
    file: File,
    puterOcr: any = null,
    useGeminiOnly: boolean = DOCUMENT_EXTRACTION_USE_GEMINI_ONLY
  ): Observable<DocumentProcessingResponse | NlpTransactionResponse[]> {
    if (useGeminiOnly || !puterOcr) {
      console.log('[DocumentExtraction] Skipping Puter OCR, using Gemini Vision fallback directly');
      return this.processDocumentFile(file);
    }

    console.log('[DocumentExtraction] Attempting Puter OCR (primary path)');
    return new Observable(observer => {
      puterOcr.ai.img2txt(file)
        .then((result: any) => {
          console.log("Puter OCR Raw Result:", result);
          console.log("Type:", typeof result);
          console.log('PUTER RAW RESPONSE:', result);
          console.log('Response Type:', typeof result);
          if (result && typeof result === 'object') {
            console.log('Object Keys:', Object.keys(result));
          }
          let text = '';
          if (typeof result === 'string') {
            text = result.trim();
            }
          else if (result?.text) {
            text = result.text.trim();
            }
          console.log('Final extracted text:', text);
          if (text && text.length > 0) {
            console.log(text);
            console.log('[DocumentExtraction] Puter OCR succeeded, sending text to NLP');
            this.processDocumentText(text).subscribe({
              next: observer.next.bind(observer),
              error: observer.error.bind(observer),
              complete: observer.complete.bind(observer)
            });
          } else {
            console.log('[DocumentExtraction] Puter OCR returned empty text, falling back to Gemini Vision');
            this.processDocumentFile(file).subscribe({
              next: observer.next.bind(observer),
              error: observer.error.bind(observer),
              complete: observer.complete.bind(observer)
            });
          }
        })
        .catch((err: any) => {
          console.warn('[DocumentExtraction] Puter OCR failed:', err);
          this.processDocumentFile(file).subscribe({
            next: observer.next.bind(observer),
            error: observer.error.bind(observer),
            complete: observer.complete.bind(observer)
          });
        });
    });
  }
}
