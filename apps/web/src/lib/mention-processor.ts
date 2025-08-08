import { FileNode } from '@/stores/workspace-store'
import { FileMention } from '@/types'
import { 
  loadFileContent, 
  findFileInTree, 
  isFileSupported, 
  isFileSizeAcceptable, 
  formatFileSize 
} from './file-mention-loader'

export interface MentionProcessingResult {
  processedText: string
  mentions: FileMention[]
  errors: string[]
  warnings: string[]
}

/**
 * Process mentions in a message text and load file content
 */
export async function processMentions(
  messageText: string, 
  fileTree: FileNode[]
): Promise<MentionProcessingResult> {
  const mentions: FileMention[] = []
  const errors: string[] = []
  const warnings: string[] = []
  
  console.log('🔍 processMentions 호출됨:', { messageText, fileTreeCount: fileTree.length })
  
  // Find all @ mentions in the text
  const mentionRegex = /@([^\s@]+)/g
  let match
  const foundMentions: Array<{ match: string; startIndex: number; endIndex: number }> = []
  
  while ((match = mentionRegex.exec(messageText)) !== null) {
    foundMentions.push({
      match: match[1], // The filename/path without @
      startIndex: match.index,
      endIndex: match.index + match[0].length
    })
  }
  
  console.log('🔍 발견된 멘션들:', foundMentions)
  
  // Process each mention
  for (const mentionMatch of foundMentions) {
    try {
      const mention = await processSingleMention(
        mentionMatch.match,
        mentionMatch.startIndex,
        mentionMatch.endIndex,
        fileTree
      )
      
      if (mention.error) {
        errors.push(`@${mentionMatch.match}: ${mention.error}`)
      } else if (mention.fileSize && mention.isBase64 !== undefined) {
        const sizeCheck = isFileSizeAcceptable(mention.fileSize, mention.isBase64)
        if (!sizeCheck.acceptable) {
          warnings.push(`@${mentionMatch.match}: ${sizeCheck.reason}`)
          mention.error = sizeCheck.reason
          mention.loadingState = 'error'
        }
      }
      
      mentions.push(mention)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errors.push(`@${mentionMatch.match}: ${errorMessage}`)
      
      // Create a mention with error state
      mentions.push({
        id: crypto.randomUUID(),
        name: mentionMatch.match,
        path: mentionMatch.match,
        type: 'file',
        startIndex: mentionMatch.startIndex,
        endIndex: mentionMatch.endIndex,
        displayText: `@${mentionMatch.match}`,
        loadingState: 'error',
        error: errorMessage
      })
    }
  }
  
  return {
    processedText: messageText,
    mentions,
    errors,
    warnings
  }
}

/**
 * Process a single mention and load its content
 */
async function processSingleMention(
  mentionText: string,
  startIndex: number,
  endIndex: number,
  fileTree: FileNode[]
): Promise<FileMention> {
  console.log('🔍 processSingleMention 호출됨:', { mentionText, fileTreeCount: fileTree.length })
  
  // Find the file in the tree
  const fileNode = findFileInTree(mentionText, fileTree)
  
  console.log('🔍 findFileInTree 결과:', { mentionText, fileNode: fileNode ? { name: fileNode.name, path: fileNode.path } : null })
  
  if (!fileNode) {
    console.log('❌ 파일을 찾을 수 없음:', mentionText)
    return {
      id: crypto.randomUUID(),
      name: mentionText,
      path: mentionText,
      type: 'file',
      startIndex,
      endIndex,
      displayText: `@${mentionText}`,
      loadingState: 'error',
      error: 'File not found in workspace'
    }
  }
  
  // Check if it's a folder
  if (fileNode.type === 'folder') {
    return {
      id: crypto.randomUUID(),
      name: fileNode.name,
      path: fileNode.path,
      type: 'folder',
      startIndex,
      endIndex,
      displayText: `@${mentionText}`,
      loadingState: 'error',
      error: 'Cannot mention folders, only files are supported'
    }
  }
  
  // Check if file type is supported
  if (!isFileSupported(fileNode.name)) {
    return {
      id: crypto.randomUUID(),
      name: fileNode.name,
      path: fileNode.path,
      type: 'file',
      startIndex,
      endIndex,
      displayText: `@${mentionText}`,
      fileSize: fileNode.size,
      loadingState: 'error',
      error: 'File type not supported for mentions'
    }
  }
  
  // Create base mention object
  const baseMention: FileMention = {
    id: crypto.randomUUID(),
    name: fileNode.name,
    path: fileNode.path,
    type: 'file',
    startIndex,
    endIndex,
    displayText: `@${mentionText}`,
    fileSize: fileNode.size,
    lastModified: fileNode.lastModified,
    loadingState: 'loading'
  }
  
  try {
    // Load file content
    const fileContent = await loadFileContent(fileNode.path)
    
    return {
      ...baseMention,
      content: fileContent.content,
      fileType: fileContent.fileType,
      fileSize: fileContent.fileSize,
      isBase64: fileContent.isBase64,
      lastModified: fileContent.lastModified,
      loadingState: 'loaded'
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load file'
    
    return {
      ...baseMention,
      loadingState: 'error',
      error: errorMessage
    }
  }
}

/**
 * Find partial matches for autocomplete suggestions
 */
export function findPartialMatches(
  searchTerm: string,
  fileTree: FileNode[],
  maxResults: number = 10
): FileNode[] {
  const searchLower = searchTerm.toLowerCase()
  const matches: Array<{ node: FileNode; score: number }> = []
  
  function search(nodes: FileNode[]) {
    for (const node of nodes) {
      // Only include files, not folders for mentions
      if (node.type === 'file') {
        let score = 0
        
        // Exact name match gets highest score
        if (node.name.toLowerCase() === searchLower) {
          score = 100
        }
        // Name starts with search term
        else if (node.name.toLowerCase().startsWith(searchLower)) {
          score = 80
        }
        // Name contains search term
        else if (node.name.toLowerCase().includes(searchLower)) {
          score = 60
        }
        // Path contains search term
        else if (node.path.toLowerCase().includes(searchLower)) {
          score = 40
        }
        
        // Bonus for supported file types
        if (score > 0 && isFileSupported(node.name)) {
          score += 10
        }
        
        if (score > 0) {
          matches.push({ node, score })
        }
      }
      
      // Search in children
      if (node.children) {
        search(node.children)
      }
    }
  }
  
  search(fileTree)
  
  // Sort by score (highest first) and return top results
  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(match => match.node)
}

/**
 * Validate mention text for autocomplete
 */
export function isValidMentionText(text: string): boolean {
  // Must be non-empty and not contain spaces or special characters
  if (!text || text.length === 0) return false
  if (text.includes(' ')) return false
  if (text.includes('\n') || text.includes('\t')) return false
  
  // Reasonable length limit
  if (text.length > 100) return false
  
  return true
}

/**
 * Extract file names from mention objects for display
 */
export function extractMentionFileNames(mentions: FileMention[]): string[] {
  return mentions
    .filter(mention => mention.loadingState === 'loaded' && mention.content)
    .map(mention => mention.name)
}

/**
 * Get mention loading summary for UI display
 */
export function getMentionLoadingSummary(mentions: FileMention[]): {
  total: number
  loaded: number
  loading: number
  errors: number
  totalSize: number
} {
  let loaded = 0
  let loading = 0
  let errors = 0
  let totalSize = 0
  
  for (const mention of mentions) {
    switch (mention.loadingState) {
      case 'loaded':
        loaded++
        if (mention.fileSize) totalSize += mention.fileSize
        break
      case 'loading':
        loading++
        break
      case 'error':
        errors++
        break
    }
  }
  
  return {
    total: mentions.length,
    loaded,
    loading,
    errors,
    totalSize
  }
}

/**
 * Format mention loading status for user display
 */
export function formatMentionStatus(mentions: FileMention[]): string {
  const summary = getMentionLoadingSummary(mentions)
  
  if (summary.total === 0) return ''
  
  const parts: string[] = []
  
  if (summary.loaded > 0) {
    parts.push(`${summary.loaded} loaded`)
    if (summary.totalSize > 0) {
      parts.push(`(${formatFileSize(summary.totalSize)})`)
    }
  }
  
  if (summary.loading > 0) {
    parts.push(`${summary.loading} loading`)
  }
  
  if (summary.errors > 0) {
    parts.push(`${summary.errors} errors`)
  }
  
  return parts.length > 0 ? `Files: ${parts.join(', ')}` : ''
} 