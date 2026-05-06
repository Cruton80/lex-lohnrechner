/**
 * Module Index
 * Zentrale Export-Stelle für alle Berechnungs- und Analyse-Module
 */

// Phase 1-2: Kern-Berechnungslogik
export { TaxCalculator } from './TaxCalculator'
export { SocialSecurityCalculator } from './SocialSecurityCalculator'
export { InputValidator } from './InputValidator'

// Phase 3: Audit und Reporting
export { AuditLogger } from './AuditLogger'
export { ResultsFormatter } from './ResultsFormatter'

// Phase 4: Versionsverwaltung und Referenzen
export { VersionManager } from './VersionManager'
export { ReferenceRegistry } from './ReferenceRegistry'

// Phase 5: PDF-Analyse und Parameter-Management
export { PAPAnalyzer } from './PAPAnalyzer'
export { PDFExporter } from './PDFExporter'
export { ClaudeParameterExtractor } from './ClaudeParameterExtractor'
export { PDFUploadManager } from './PDFUploadManager'

// Type Exports
export type {
  PDFExportOptions,
  PDFContent,
  PDFSection,
  PDFTable,
} from './PDFExporter'

export type {
  ParameterExtractionRequest,
  ParameterExtractionResult,
  ExtractedParam,
  ParameterChange,
} from './ClaudeParameterExtractor'

export type {
  PDFUploadProgress,
  UpdateSuggestion,
  UpdateProposal,
} from './PDFUploadManager'
