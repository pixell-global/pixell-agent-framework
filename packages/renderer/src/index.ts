// Core hooks for improved rendering architecture
export { useContentBuffer, useIncrementalParser, useRenderEngine } from './hooks';

// Main rendering components
export { MarkdownRenderer } from './components/MarkdownRenderer';
export { CodeBlock } from './components/CodeBlock';
export { ChartRenderer } from './components/ChartRenderer';
export { TableRenderer } from './components/TableRenderer';
export { EnhancedTableWrapper } from './components/EnhancedTableWrapper';
export { BlockRenderer } from './components/BlockRenderer';
export { MathSkeleton } from './components/MathSkeleton';

// Streaming renderers
export { StreamingRenderer } from './components/StreamingRenderer';
export { SimpleStreamingRenderer } from './components/SimpleStreamingRenderer';
export { HybridStreamingRenderer } from './components/HybridStreamingRenderer';

// Demo components
export { StreamingDemo } from './components/StreamingDemo';

// Utility functions
export { ContentParser } from './utils/ContentParser';
export { ContentPostProcessor } from './utils/ContentPostProcessor';
export { sanitizeContent, validateBlockPayload, sanitizeUrl, escapeHtml } from './security/Sanitizer';

// Chart utility functions
export { 
  createBarChart, 
  createLineChart, 
  createScatterPlot, 
  createPieChart 
} from './components/ChartRenderer';

// Types
export type {
  RenderBlock,
  StreamingToken,
  RendererPlugin,
  SecurityLevel,
  MarkdownRendererProps,
  StreamingRendererProps,
  ContentBuffer,
  DelimiterState,
  ParserState,
  RendererComponent,
  RendererRegistry
} from './types';

// Security utilities
export * from './security/Sanitizer';

// Components (Phase 2 - Complete)
export * from './components/StreamingRenderer';

// Utils
export * from './utils/ContentParser';

// Registry (to be implemented in Phase 3)
// export * from './registry/RendererRegistry';

// Utilities (to be implemented in Phase 4)
// export * from './utils/StreamProcessor';
// export * from './utils/TokenHandler';

// Version info
export const VERSION = '0.1.0';

// Default export for convenience
export type { 
  RenderBlock as Block,
  StreamingToken as Token 
} from './types'; 