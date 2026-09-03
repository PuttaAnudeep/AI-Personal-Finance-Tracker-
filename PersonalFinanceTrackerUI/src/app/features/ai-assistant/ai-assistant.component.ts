import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AiService, NlpTransactionResponse, DocumentProcessingResponse, SUPPORTED_DOCUMENT_FORMATS, SupportedDocumentFormat, DOCUMENT_EXTRACTION_USE_GEMINI_ONLY } from '../../core/services/ai.service';
import { ToastService } from '../../core/services/toast.service';
import { TransactionService } from '../../core/services/transaction.service';
import { IconComponent } from '../../shared/icon/icon.component';
import { Transaction, CreateTransactionRequest } from '../../core/models/transaction.model';
import { categoryMeta } from '../../shared/meta/meta';

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IconComponent
  ],
  template: `
    <div class="space-y-6">

      <!-- Header Section -->
      <section class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 p-6 text-white shadow-lg">
        <div class="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
        <div class="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
        
        <div class="relative flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold font-display tracking-tight">Smart AI Entry</h2>
            <p class="mt-1 text-sm text-white/80">Use natural language or upload a document to add transactions</p>
          </div>
          <div class="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
        </div>
      </section>

      <!-- Tabs -->
      <div class="flex gap-1 p-1 bg-gray-100 rounded-xl">
        <button 
          class="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200"
          [class.bg-white]="activeTab === 'text'"
          [class.text-primary]="activeTab === 'text'"
          [class.shadow-sm]="activeTab === 'text'"
          [class.text-muted]="activeTab !== 'text'"
          (click)="activeTab = 'text'">
          <span class="inline-flex items-center justify-center gap-2">
            <app-icon name="message" [size]="16" />
            Text Entry
          </span>
        </button>
        <button 
          class="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200"
          [class.bg-white]="activeTab === 'document'"
          [class.text-primary]="activeTab === 'document'"
          [class.shadow-sm]="activeTab === 'document'"
          [class.text-muted]="activeTab !== 'document'"
          (click)="activeTab = 'document'">
          <span class="inline-flex items-center justify-center gap-2">
            <app-icon name="upload" [size]="16" />
            Upload Document
          </span>
        </button>
      </div>

      <!-- Text Entry Tab -->
      @if (activeTab === 'text') {
        <div class="card p-6 space-y-4">

          <div>
            <label class="text-sm font-medium text-gray-700 mb-2 block">
              Describe your transaction
            </label>
            <div class="relative">
              <input
                class="input pr-24 py-3"
                [(ngModel)]="text"
                placeholder="e.g. spent ₹500 on pizza yesterday"
                (keyup.enter)="parse()"
                [disabled]="loading"/>

              <button
                class="absolute right-2 top-1/2 -translate-y-1/2 btn-primary !py-2 !px-4 text-sm shadow-md hover:shadow-lg transition-all duration-200 z-10 cursor-pointer"
                (click)="parse(); $event.stopPropagation()"
                [disabled]="loading"
                type="button">

                @if (loading) {
                  <span class="inline-flex items-center gap-2">
                    <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Parsing...
                  </span>
                } @else {
                  <span class="inline-flex items-center gap-2">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    Parse
                  </span>
                }

              </button>
            </div>
          </div>

          <div class="rounded-xl bg-gradient-to-br from-primary-50 to-primary-100/50 p-5 border border-primary-200/50">
            <div class="flex items-start gap-3">
              <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900 mb-2">Try these examples:</p>
                <div class="flex flex-wrap gap-2">
                  <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg text-xs font-medium text-gray-700 border border-gray-200 shadow-sm">
                    "spent ₹1200 on groceries"
                  </span>
                  <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg text-xs font-medium text-gray-700 border border-gray-200 shadow-sm">
                    "earned ₹50000 salary"
                  </span>
                  <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg text-xs font-medium text-gray-700 border border-gray-200 shadow-sm">
                    "paid ₹800 for uber ride"
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      }

      <!-- Document Upload Tab -->
      @if (activeTab === 'document') {
        <div class="card p-6 space-y-5">

          <!-- Extraction Mode Toggle -->
          <div class="rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 p-4 border border-gray-200">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <svg class="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <span class="text-sm font-semibold text-gray-900">Extraction Mode</span>
              </div>
              <div class="flex gap-1 bg-white p-1 rounded-lg border border-gray-200">
                <button
                  type="button"
                  class="px-3 py-1.5 text-xs font-medium rounded-md transition-all"
                  [class.btn-primary]="extractionMode === 'puter'"
                  [class.btn-ghost]="extractionMode !== 'puter'"
                  [disabled]="documentProcessing"
                  (click)="extractionMode = 'puter'">
                  Puter OCR
                </button>
                <button
                  type="button"
                  class="px-3 py-1.5 text-xs font-medium rounded-md transition-all"
                  [class.btn-primary]="extractionMode === 'gemini'"
                  [class.btn-ghost]="extractionMode !== 'gemini'"
                  [disabled]="documentProcessing"
                  (click)="extractionMode = 'gemini'">
                  Gemini Vision
                </button>
              </div>
            </div>
          </div>

          <!-- Upload Zone -->
          @if (!selectedFile) {
            <div 
              class="ai-upload-zone relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200"
              [class.border-primary]="isDragging"
              [class.bg-primary-50]="isDragging"
              [class.border-gray-300]="!isDragging"
              (dragover)="onDragOver($event)"
              (dragleave)="onDragLeave($event)"
              (drop)="onDrop($event)"
              (click)="fileInput.click()">
              
              <input 
                type="file" 
                #fileInput 
                [accept]="acceptedFormats"
                (change)="onFileSelected($event)"
                class="hidden" />

              <div class="w-16 h-16 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center mx-auto mb-4">
                <svg class="h-8 w-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
              </div>
              
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Drop your bill or receipt here</h3>
              <p class="text-sm text-gray-600 mb-4">or click to browse from your device</p>
              
              <div class="flex items-center justify-center gap-2 text-xs">
                <span class="text-gray-500">Supported formats:</span>
                @for (format of supportedFormats; track format) {
                  <span class="px-2.5 py-1 bg-white border border-gray-200 rounded-md font-medium text-gray-700">{{ format.toUpperCase() }}</span>
                }
              </div>
            </div>
          }

          <!-- Selected File Preview -->
          @if (selectedFile) {
            <div class="rounded-xl bg-[var(--surface-2)] p-4">
              <div class="flex items-start gap-4">
                
                <!-- File Icon/Preview -->
                <div class="w-20 h-20 rounded-lg bg-white flex items-center justify-center shrink-0 overflow-hidden">
                  @if (filePreviewUrl) {
                    <img [src]="filePreviewUrl" class="w-full h-full object-cover" />
                  } @else {
                    <div class="text-center">
                      <app-icon name="file-text" [size]="32" class="text-muted mx-auto mb-1" />
                      <span class="text-[10px] text-muted">PDF</span>
                    </div>
                  }
                </div>

                <!-- File Info -->
                <div class="flex-1 min-w-0">
                  <h4 class="font-medium text-sm mb-1">{{ selectedFile.name }}</h4>
                  <p class="text-xs text-muted mb-3">
                    {{ formatFileSize(selectedFile.size) }} · {{ selectedFile.type || 'Unknown type' }}
                  </p>
                  
                  <div class="flex gap-2">
                    <button 
                      class="btn-primary !py-1.5 !px-3 text-xs"
                      (click)="processDocument()"
                      [disabled]="documentProcessing">
                      
                      @if (documentProcessing) {
                        <span class="inline-flex items-center gap-2">
                          <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </span>
                      } @else {
                        <span class="inline-flex items-center gap-2">
                          <app-icon name="zap" [size]="14" />
                          Extract Transactions
                        </span>
                      }
                    </button>

                    <button 
                      class="btn-ghost !py-1.5 !px-3 text-xs"
                      (click)="clearFile()"
                      [disabled]="documentProcessing">
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Processing Error -->
          @if (documentError) {
            <div class="rounded-lg bg-red-100 text-red-800 p-3 text-sm">
              {{ documentError }}
            </div>
          }
        </div>
      }

      <!-- Messages -->
      <div *ngIf="errorMessage" class="rounded-lg bg-red-100 text-red-800 p-3">
        {{errorMessage}}
      </div>

      <div *ngIf="successMessage" class="rounded-lg bg-green-100 text-green-800 p-3">
        {{successMessage}}
      </div>

      <!-- Saved Transactions (editable) -->
      @if (savedTransactions.length > 0) {
        <div class="card overflow-hidden">
          <div class="p-5 border-b border-gray-100 bg-gradient-to-r from-green-50 to-white">
            <div class="flex items-center gap-2">
              <div class="h-8 w-8 rounded-lg bg-green-600 flex items-center justify-center text-white">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <div>
                <h3 class="font-semibold text-gray-900">
                  Saved Transactions
                </h3>
                <p class="text-xs text-muted">{{ savedTransactions.length }} transaction(s) — click <app-icon name="edit" [size]="12" class="inline" /> to edit</p>
              </div>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="text-left bg-gray-50/50">
                  <th class="pb-3 pl-5 pr-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                  <th class="pb-3 pr-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                  <th class="pb-3 pr-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                  <th class="pb-3 pr-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                  <th class="pb-3 pr-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th class="pb-3 pr-2 w-20"></th>
                </tr>
              </thead>
              <tbody>
                @for (t of savedTransactions; track t.id) {
                  @if (editingTransactionId === t.id) {
                    <!-- Edit Mode Row -->
                    <tr class="border-b last:border-b-0 bg-blue-50/50">
                      <td class="py-3 pl-5 pr-2">
                        <input 
                          type="text" 
                          class="input !py-1.5 !px-3 text-xs w-full"
                          [(ngModel)]="editForm.description"
                          placeholder="Description" />
                      </td>
                      <td class="py-3 pr-2">
                        <select class="input !py-1.5 !px-3 text-xs w-full" [(ngModel)]="editForm.category">
                          @for (c of categories; track c) {
                            <option [value]="c">{{ c }}</option>
                          }
                        </select>
                      </td>
                      <td class="py-3 pr-2">
                        <select class="input !py-1.5 !px-3 text-xs w-full" [(ngModel)]="editForm.type">
                          <option value="Income">Income</option>
                          <option value="Expense">Expense</option>
                        </select>
                      </td>
                      <td class="py-3 pr-2">
                        <input 
                          type="number" 
                          class="input !py-1.5 !px-3 text-xs w-full"
                          [(ngModel)]="editForm.amount"
                          min="0.01"
                          step="0.01" />
                      </td>
                      <td class="py-3 pr-2">
                        <input 
                          type="date" 
                          class="input !py-1.5 !px-3 text-xs w-full"
                          [(ngModel)]="editForm.date" />
                      </td>
                      <td class="py-3 pr-2">
                        <div class="flex items-center gap-1">
                          <button 
                            class="btn-primary !p-1.5 text-xs"
                            (click)="saveEdit(t.id)"
                            [disabled]="savingEdit"
                            title="Save">
                            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                          </button>
                          <button 
                            class="btn-ghost !p-1.5 text-xs"
                            (click)="cancelEdit()"
                            title="Cancel">
                            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  } @else {
                    <!-- View Mode Row -->
                    <tr class="border-b last:border-b-0 hover:bg-gray-50/50 transition-colors">
                      <td class="py-3 pl-5 pr-2 text-sm">{{ t.description || '-' }}</td>
                      <td class="py-3 pr-2">
                        <span class="inline-flex px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                          {{ t.category }}
                        </span>
                      </td>
                      <td class="py-3 pr-2">
                        <span class="inline-flex px-2.5 py-1 rounded-md text-xs font-medium"
                              [class.bg-green-100]="t.type === 'Income'"
                              [class.text-green-700]="t.type === 'Income'"
                              [class.bg-red-100]="t.type === 'Expense'"
                              [class.text-red-700]="t.type === 'Expense'">
                          {{ t.type }}
                        </span>
                      </td>
                      <td class="py-3 pr-2 text-sm font-medium">₹{{ t.amount }}</td>
                      <td class="py-3 pr-2 text-xs text-muted">{{ formatDate(t.date) }}</td>
                      <td class="py-3 pr-2">
                        <div class="flex items-center gap-1">
                          <button 
                            class="btn-ghost !p-1.5 text-primary-600 hover:bg-primary-50"
                            (click)="startEdit(t)"
                            title="Edit">
                            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                          </button>
                          <button 
                            class="btn-ghost !p-1.5 text-red-600 hover:bg-red-50"
                            (click)="deleteTransaction(t.id)"
                            [disabled]="deletingId === t.id"
                            title="Delete">
                            @if (deletingId === t.id) {
                              <svg class="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            } @else {
                              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                            }
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>
      }

    </div>
  `
})
export class AiAssistantComponent implements OnInit {

  private ai = inject(AiService);
  private txnService = inject(TransactionService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  text = '';
  loading = false;
  errorMessage = '';
  successMessage = '';

  activeTab: 'text' | 'document' = 'text';

  // Document upload state
  selectedFile: File | null = null;
  filePreviewUrl: string | null = null;
  isDragging = false;
  documentProcessing = false;
  documentError: string | null = null;

  // Confirmed/saved transactions shown in editable history
  savedTransactions: Array<{id: number; description: string; category: string; type: string; amount: number; date: string}> = [];

  // Edit state
  editingTransactionId: number | null = null;
  editForm: {description: string; category: string; type: string; amount: number; date: string} = {description: '', category: 'Other', type: 'Expense', amount: 0, date: ''};
  savingEdit = false;
  deletingId: number | null = null;

  categories = ['Food','Dining','Groceries','Shopping','Travel','Fuel','Rent','Medical','Entertainment','Utilities','Bills','Salary','Bonus','Freelance','Investment','Education','Gifts','Savings','Other'];
  catMeta = categoryMeta;
  supportedFormats: string[] = [];
  get acceptedFormats(): string {
    return this.supportedFormats.map(f => '.' + f).join(',');
  }

  // Document extraction mode toggle
  extractionMode: 'puter' | 'gemini' = 'puter';
  puterOcr: any = null;

  ngOnInit() {
    this.supportedFormats = Array.from(SUPPORTED_DOCUMENT_FORMATS);
    this.initializePuter();
  }

  /**
   * Initialize Puter.js SDK v2 for frontend OCR.
   * The SDK is loaded via CDN script in index.html (`https://js.puter.com/v2/`).
   * Falls back to Gemini Vision if Puter is not available.
   */
  async initializePuter() {
    try {
      const puterGlobal = (window as any).puter;
      if (!puterGlobal) {
        console.warn('[SmartEntry] Puter SDK global not found. Gemini Vision fallback will be used.');
        return;
      }
      if (puterGlobal.ai && typeof puterGlobal.ai.img2txt === 'function') {
        this.puterOcr = puterGlobal;
        console.log('[SmartEntry] Puter SDK v2 loaded and initialized successfully');
      } else {
        console.warn('[SmartEntry] Puter SDK loaded but ai.img2txt not available. Gemini Vision fallback will be used.');
      }
    } catch (err) {
      console.warn('[SmartEntry] Puter SDK initialization failed:', err);
    }
  }

  // Text Entry — parsed via backend NLP, auto-saved to DB, shown in editable saved transactions

  parse() {
    this.errorMessage='';
    this.successMessage='';

    if(!this.text.trim()){
      this.errorMessage='Please enter a transaction';
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    console.log('[SmartEntry] Sending NLP parse request:', this.text);

    this.ai.createTransactionFromNlp(this.text).subscribe({
      next: (results) => {
        this.loading = false;

        console.log('[SmartEntry] API response received:', results);

        // Map to saved transactions format (they already have IDs since backend saved them)
        const newSaved = results.map(r => ({
          id: r.id,
          description: r.description || '',
          category: r.category as string,
          type: r.type as string,
          amount: r.amount,
          date: r.date.split('T')[0]
        }));

        // Prepend to saved transactions (newest first, max 20 shown)
        this.savedTransactions = [...newSaved, ...this.savedTransactions].slice(0, 20);

        this.successMessage = `${results.length} transaction(s) parsed and saved automatically`;
        this.toast.success('Auto-Saved', this.successMessage);

        this.cdr.detectChanges();

        // Scroll to saved transactions section
        setTimeout(() => {
          const el = document.querySelector('.card.overflow-hidden');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      },
      error: (err) => {
        this.loading = false;

        console.error('[SmartEntry] API error:', err);

        this.errorMessage = err.message || 'Failed to create transaction. Please try again.';
        this.toast.error('Error', this.errorMessage);

        this.cdr.detectChanges();
      }
    });
  }

  // Document Upload Methods

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  handleFile(file: File) {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase() as SupportedDocumentFormat;
    const validExtensions = Array.from(SUPPORTED_DOCUMENT_FORMATS) as SupportedDocumentFormat[];
    
    if (!validExtensions.includes(extension)) {
      this.documentError = `Invalid file format. Supported formats: ${validExtensions.join(', ')}`;
      return;
    }

    this.selectedFile = file;
    this.documentError = null;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.filePreviewUrl = e.target?.result as string;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    } else {
      this.filePreviewUrl = null;
    }
  }

  clearFile() {
    this.selectedFile = null;
    this.filePreviewUrl = null;
    this.documentError = null;
  }

  processDocument() {
    if (!this.selectedFile) return;

    this.documentProcessing = true;
    this.documentError = null;

    console.log('[SmartEntry] Processing document:', this.selectedFile.name);

    const useGeminiOnly = this.extractionMode === 'gemini';
    const modeLabel = useGeminiOnly ? 'Gemini Vision (direct)' : 'Puter OCR (primary)';
    console.log('[SmartEntry] Extraction mode:', modeLabel);

    this.ai.processDocumentWithFallback(this.selectedFile, this.puterOcr, useGeminiOnly).subscribe({
      next: (response) => {
        this.documentProcessing = false;

        console.log('[SmartEntry] Document processing response:', response);

        let transactions: NlpTransactionResponse[] = [];

        // Handle Puter OCR path (returns NlpTransactionResponse[] directly)
        if (Array.isArray(response)) {
          transactions = response as NlpTransactionResponse[];
        } 
        // Handle Gemini Vision backend path (returns DocumentProcessingResponse)
        else {
          const docResponse = response as DocumentProcessingResponse;
          if (!docResponse.success) {
            this.documentError = docResponse.errorMessage || 'Failed to process document';
            this.toast.error('Processing Failed', this.documentError ?? undefined);
            return;
          }
          transactions = docResponse.transactions || [];
        }

        if (transactions.length === 0) {
          this.documentError = 'No transactions found in the document';
          this.toast.warning('No Transactions Found', 'Could not extract any transactions from the document');
          return;
        }

        try {
          // Map to saved transactions format (they already have IDs since backend saved them)
          const newSaved = transactions.map((t: NlpTransactionResponse) => ({
            id: t.id,
            description: t.description || '',
            category: t.category as string,
            type: t.type as string,
            amount: t.amount,
            date: t.date.split('T')[0]
          }));

          // Prepend to saved transactions (newest first, max 20 shown)
          this.savedTransactions = [...newSaved, ...this.savedTransactions].slice(0, 20);

          this.successMessage = `${transactions.length} transaction(s) extracted and saved automatically`;
          this.toast.success('Auto-Saved', this.successMessage);

          this.cdr.detectChanges();

          // Scroll to saved transactions section
          setTimeout(() => {
            const el = document.querySelector('.card.overflow-hidden');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        } catch (error) {
          console.error('[SmartEntry] Error processing response:', error);
          this.documentError = 'Failed to process extracted transactions. Please try again.';
          this.toast.error('Processing Error', this.documentError ?? undefined);
        }
      },
      error: (err) => {
        this.documentProcessing = false;

        console.error('[SmartEntry] Document processing error:', err);

        this.documentError = err.message || 'Failed to process document. Please try again.';
        this.toast.error('Processing Error', this.documentError ?? undefined);
      }
    });
  }

  // Editable Saved Transactions - Edit/Delete

  startEdit(t: {id: number; description: string; category: string; type: string; amount: number; date: string}) {
    this.editingTransactionId = t.id;
    this.editForm = {
      description: t.description,
      category: t.category,
      type: t.type,
      amount: t.amount,
      date: typeof t.date === 'string' && t.date.includes('T') ? t.date.split('T')[0] : t.date
    };
  }

  cancelEdit() {
    this.editingTransactionId = null;
  }

  saveEdit(id: number) {
    this.savingEdit = true;

    const dto: CreateTransactionRequest = {
      date: new Date(this.editForm.date).toISOString(),
      type: this.editForm.type as 'Income' | 'Expense',
      category: this.editForm.category as any,
      amount: Number(this.editForm.amount),
      description: this.editForm.description || '',
    };

    this.txnService.update(id, dto).subscribe({
      next: (updated) => {
        this.savingEdit = false;
        this.editingTransactionId = null;

        // Update in local array
        const idx = this.savedTransactions.findIndex(t => t.id === id);
        if (idx >= 0) {
          this.savedTransactions[idx] = {
            id: updated.id,
            description: updated.description || '',
            category: updated.category,
            type: updated.type,
            amount: updated.amount,
            date: updated.date.split('T')[0]
          };
        }

        this.successMessage = 'Transaction updated successfully';
        this.toast.success('Updated', this.successMessage);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.savingEdit = false;
        console.error('[SmartEntry] Failed to update transaction:', err);
        this.toast.error('Update Failed', 'Could not update the transaction. Please try again.');
      }
    });
  }

  deleteTransaction(id: number) {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    this.deletingId = id;

    this.txnService.delete(id).subscribe({
      next: () => {
        this.deletingId = null;
        
        // Remove from local array
        this.savedTransactions = this.savedTransactions.filter(t => t.id !== id);

        this.successMessage = 'Transaction deleted successfully';
        this.toast.success('Deleted', this.successMessage);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.deletingId = null;
        console.error('[SmartEntry] Failed to delete transaction:', err);
        this.toast.error('Delete Failed', 'Could not delete the transaction. Please try again.');
      }
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}