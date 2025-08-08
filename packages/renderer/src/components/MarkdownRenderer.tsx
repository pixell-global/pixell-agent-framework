import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { sanitizeContent } from '../security/Sanitizer';
import { MarkdownRendererProps, SecurityLevel } from '../types';
import { CodeBlock } from './CodeBlock';
import { BlockRenderer } from './BlockRenderer';
import { EnhancedTableWrapper } from './EnhancedTableWrapper';

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  isStreaming = false,
  enableMath = true,
  enableCodeHighlight = true,
  securityLevel = 'safe',
  className = ''
}) => {
  // ChatGPT-style content processing with memoization for performance
  const processedContent = useMemo(() => {
    // Check if content looks like HTML (contains HTML tags)
    const htmlTagRegex = /<[^>]*>/;
    const isHtmlContent = htmlTagRegex.test(content);
    
    if (isHtmlContent) {
      // Only sanitize if it's HTML content
      return sanitizeContent(content, securityLevel);
    } else {
      // For markdown content, pass through without sanitization
      return content;
    }
  }, [content, securityLevel]);

  // Memoize sanitized content to avoid re-processing
  const memoizedContent = useMemo(() => {
    return processedContent;
  }, [processedContent]);

  const remarkPlugins = useMemo(() => [
    remarkGfm,
    ...(enableMath ? [remarkMath] : [])
  ], [enableMath]);

  const rehypePlugins = useMemo(() => [
    ...(enableMath ? [rehypeKatex] : []),
    ...(enableCodeHighlight ? [rehypeHighlight] : []),
    rehypeRaw
  ], [enableMath, enableCodeHighlight]);

  const components = useMemo(() => ({
    // Enhanced code block component with raw content preservation for copy
    code: ({ node, inline, className, children, ...props }: any) => {
      if (!inline && children) {
        const match = /language-(\w+)/.exec(className || '');
        const language = match ? match[1] : '';
        const codeString = String(children).replace(/\n$/, '');
        
        return (
          <CodeBlock
            code={codeString}
            language={language}
            showLineNumbers={codeString.split('\n').length > 10}
            {...props}
          />
        );
      }
      
      // Inline code with copy capability
      return (
        <code 
          className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" 
          onClick={() => navigator.clipboard?.writeText(String(children))}
          title="Click to copy"
          {...props}
        >
          {children}
        </code>
      );
    },

    // Enhanced math rendering with layout stability
    span: ({ node, className, children, ...props }: any) => {
      // Handle KaTeX inline math spans
      if (className?.includes('katex')) {
        return (
          <span 
            className={`math-container ${className}`} 
            data-latex={children}
            {...props}
          >
            <span className="math-inline">
              {children}
            </span>
            <button 
              className="math-copy-button"
              onClick={() => navigator.clipboard?.writeText(props['data-latex'] || String(children))}
              title="Copy LaTeX"
            >
              📋
            </button>
          </span>
        );
      }
      return <span className={className} {...props}>{children}</span>;
    },

    // Enhanced div handling for math display blocks
    div: ({ node, className, children, ...props }: any) => {
      // Handle KaTeX display math
      if (className?.includes('katex-display')) {
        return (
          <div className={`math-block ${className}`} {...props}>
            {children}
          </div>
        );
      }
      
      if (className?.includes('pixell-block')) {
        return <BlockRenderer node={node} {...props} />;
      }
      return <div className={className} {...props}>{children}</div>;
    },

    // Fix paragraph nesting - don't wrap block elements in paragraphs
    p: ({ node, children, ...props }: any) => {
      // Simple check: if any child contains code blocks or block elements, use div
      const childrenString = React.Children.toArray(children).join('');
      const hasBlockContent = /```|<div|<pre|<table|<ul|<ol|<blockquote|<h[1-6]/.test(childrenString);
      
      // Also check if we have CodeBlock components
      const hasCodeBlock = React.Children.toArray(children).some((child: any) => {
        if (React.isValidElement(child)) {
          const type = child.type;
          if (typeof type === 'function' && type.name === 'CodeBlock') {
            return true;
          }
          // Check for divs that look like block components
          if (type === 'div') {
            const className = (child.props as any)?.className || '';
            if (className.includes('relative') || className.includes('overflow-') || className.includes('bg-')) {
              return true;
            }
          }
        }
        return false;
      });

      // If it has block content or CodeBlock components, use div
      if (hasBlockContent || hasCodeBlock) {
        return <div className="my-2" {...props}>{children}</div>;
      }

      // Normal paragraph
      return (
        <p className="text-gray-700 leading-relaxed my-2" {...props}>
          {children}
        </p>
      );
    },
    
    // Enhanced table styling with scroll and CSV download
    table: ({ children, ...props }: any) => (
      <EnhancedTableWrapper className="my-4">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg" {...props}>
          {children}
        </table>
      </EnhancedTableWrapper>
    ),
    
    thead: ({ children, ...props }: any) => (
      <thead className="bg-gray-50" {...props}>
        {children}
      </thead>
    ),
    
    th: ({ children, ...props }: any) => (
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" {...props}>
        {children}
      </th>
    ),
    
    tbody: ({ children, ...props }: any) => (
      <tbody className="bg-white divide-y divide-gray-200" {...props}>
        {children}
      </tbody>
    ),
    
    tr: ({ children, ...props }: any) => (
      <tr className="hover:bg-gray-50" {...props}>
        {children}
      </tr>
    ),
    
    td: ({ children, ...props }: any) => (
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" {...props}>
        {children}
      </td>
    ),


    
    // Enhanced list styling
    ul: ({ children, ...props }: any) => (
      <ul className="list-disc list-inside space-y-1 my-2" {...props}>
        {children}
      </ul>
    ),
    
    ol: ({ children, ...props }: any) => (
      <ol className="list-decimal list-inside space-y-1 my-2" {...props}>
        {children}
      </ol>
    ),
    
    li: ({ children, ...props }: any) => (
      <li className="text-gray-700" {...props}>
        {children}
      </li>
    ),
    
    // Enhanced quote styling
    blockquote: ({ children, ...props }: any) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 my-4 italic text-gray-600 bg-blue-50 py-2" {...props}>
        {children}
      </blockquote>
    ),
    
    // Enhanced heading styles
    h1: ({ children, ...props }: any) => (
      <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-4 border-b border-gray-200 pb-2" {...props}>
        {children}
      </h1>
    ),
    
    h2: ({ children, ...props }: any) => (
      <h2 className="text-xl font-semibold text-gray-900 mt-5 mb-3" {...props}>
        {children}
      </h2>
    ),
    
    h3: ({ children, ...props }: any) => (
      <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2" {...props}>
        {children}
      </h3>
    )
  }), []);

  if (!content && !isStreaming) {
    return <div className={`text-gray-400 italic ${className}`}>No content</div>;
  }

  return (
    <div className={`prose prose-sm max-w-none dark:prose-invert ${className}`}>
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={components}
      >
        {memoizedContent}
      </ReactMarkdown>
      
      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-1 bg-blue-500 animate-pulse" />
      )}
    </div>
  );
}; 