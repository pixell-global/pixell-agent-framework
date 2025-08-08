import { FileNode } from '@/stores/workspace-store'

export interface FileMentionContent {
  name: string
  path: string
  content: string
  fileType: string
  fileSize: number
  isBase64: boolean
  lastModified: string
}

/**
 * Load file content from workspace-files directory
 */
export async function loadFileContent(filePath: string): Promise<FileMentionContent> {
  try {
    // Normalize path (remove leading slash if present)
    const normalizedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath
    
    // Determine if this is a binary file that needs base64 encoding
    const fileName = normalizedPath.split('/').pop() || ''
    const shouldUseBase64 = shouldEncodeAsBase64(fileName)
    
    // Build API URL with appropriate format
    const apiUrl = `/api/files/content?path=${encodeURIComponent(normalizedPath)}${shouldUseBase64 ? '&format=base64' : ''}`
    
    const response = await fetch(apiUrl)
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`File not found: ${fileName}`)
      } else if (response.status === 400) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Invalid file request: ${fileName}`)
      } else {
        throw new Error(`Failed to load file: ${response.status} ${response.statusText}`)
      }
    }
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Unknown error loading file')
    }
    
    // Get MIME type from file extension
    const mimeType = getMimeType(fileName)
    
    return {
      name: fileName,
      path: filePath,
      content: data.content,
      fileType: mimeType,
      fileSize: data.size || data.content.length,
      isBase64: shouldUseBase64,
      lastModified: data.lastModified || new Date().toISOString()
    }
  } catch (error) {
    console.error(`Error loading file content for ${filePath}:`, error)
    throw error
  }
}

/**
 * Check if a file type is supported for mentions
 */
export function isFileSupported(fileName: string): boolean {
  const ext = getFileExtension(fileName).toLowerCase()
  
  // Supported text files
  const textExtensions = [
    'txt', 'md', 'json', 'csv', 'tsv', 'log',
    'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'h',
    'html', 'htm', 'css', 'scss', 'sass', 'less',
    'xml', 'yml', 'yaml', 'toml', 'ini', 'conf', 'env',
    'sql', 'sh', 'bash', 'ps1', 'bat', 'dockerfile'
  ]
  
  // Supported binary files
  const binaryExtensions = [
    'xlsx', 'xls', 'xlsm', 'xlsb', // Excel
    'pdf', // PDF documents
    'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg', // Images
    'docx', 'doc', 'pptx', 'ppt', // Office documents
    'zip', 'tar', 'gz', // Archives (for analysis)
  ]
  
  return textExtensions.includes(ext) || binaryExtensions.includes(ext)
}

/**
 * Determine if file should be encoded as base64
 */
export function shouldEncodeAsBase64(fileName: string): boolean {
  const ext = getFileExtension(fileName).toLowerCase()
  
  // Binary file extensions that need base64 encoding
  const binaryExtensions = [
    'xlsx', 'xls', 'xlsm', 'xlsb', // Excel files
    'pdf', // PDF documents
    'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', // Images (not SVG - it's text)
    'docx', 'doc', 'pptx', 'ppt', // Office documents
    'zip', 'tar', 'gz', 'rar', '7z', // Archives
    'exe', 'bin', 'dll', 'so', // Executables
    'mp3', 'wav', 'mp4', 'avi', 'mov', // Media files
  ]
  
  return binaryExtensions.includes(ext)
}

/**
 * Get MIME type from file extension
 */
function getMimeType(fileName: string): string {
  const ext = getFileExtension(fileName).toLowerCase()
  
  const mimeTypes: Record<string, string> = {
    // Text files
    'txt': 'text/plain',
    'md': 'text/markdown',
    'json': 'application/json',
    'csv': 'text/csv',
    'tsv': 'text/tab-separated-values',
    'log': 'text/plain',
    
    // Code files
    'js': 'application/javascript',
    'jsx': 'application/javascript',
    'ts': 'application/typescript',
    'tsx': 'application/typescript',
    'py': 'text/x-python',
    'java': 'text/x-java-source',
    'c': 'text/x-c',
    'cpp': 'text/x-c++',
    'h': 'text/x-c',
    
    // Web files
    'html': 'text/html',
    'htm': 'text/html',
    'css': 'text/css',
    'scss': 'text/x-scss',
    'sass': 'text/x-sass',
    'less': 'text/x-less',
    
    // Config files
    'xml': 'application/xml',
    'yml': 'application/x-yaml',
    'yaml': 'application/x-yaml',
    'toml': 'application/toml',
    'ini': 'text/plain',
    'conf': 'text/plain',
    'env': 'text/plain',
    
    // Database
    'sql': 'application/sql',
    
    // Scripts
    'sh': 'application/x-sh',
    'bash': 'application/x-sh',
    'ps1': 'application/x-powershell',
    'bat': 'application/x-msdos-program',
    
    // Excel files
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xls': 'application/vnd.ms-excel',
    'xlsm': 'application/vnd.ms-excel.sheet.macroEnabled.12',
    'xlsb': 'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
    
    // Office documents
    'pdf': 'application/pdf',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'doc': 'application/msword',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'ppt': 'application/vnd.ms-powerpoint',
    
    // Images
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'bmp': 'image/bmp',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    
    // Archives
    'zip': 'application/zip',
    'tar': 'application/x-tar',
    'gz': 'application/gzip',
    'rar': 'application/vnd.rar',
    '7z': 'application/x-7z-compressed',
  }
  
  return mimeTypes[ext] || 'application/octet-stream'
}

/**
 * Get file extension from filename
 */
function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.')
  if (lastDot === -1 || lastDot === fileName.length - 1) {
    return ''
  }
  return fileName.substring(lastDot + 1)
}

/**
 * Find a file in the file tree by name or path
 */
export function findFileInTree(searchTerm: string, fileTree: FileNode[]): FileNode | null {
  const searchLower = searchTerm.toLowerCase()
  
  console.log('🔍 findFileInTree 시작:', { searchTerm, searchLower, fileTreeLength: fileTree.length })
  
  // 디버깅을 위해 전체 파일 트리 구조를 출력
  console.log('🔍 전체 파일 트리:', JSON.stringify(fileTree.map(node => ({
    name: node.name,
    path: node.path,
    type: node.type,
    hasChildren: !!node.children,
    childrenCount: node.children?.length || 0
  })), null, 2))
  
  function search(nodes: FileNode[]): FileNode | null {
    for (const node of nodes) {
      console.log('🔍 검사 중인 노드:', { name: node.name, path: node.path, type: node.type })
      
      // Check exact name match first
      if (node.name.toLowerCase() === searchLower) {
        console.log('✅ 파일명 매칭 성공:', node.name)
        return node
      }
      
      // Check if path ends with search term
      if (node.path.toLowerCase().endsWith(searchLower)) {
        console.log('✅ 경로 매칭 성공:', node.path)
        return node
      }
      
      // Search in children
      if (node.children) {
        console.log('🔍 자식 노드 검색 중:', { nodePath: node.path, childrenCount: node.children.length })
        const found = search(node.children)
        if (found) return found
      }
    }
    return null
  }
  
  const result = search(fileTree)
  console.log('🔍 findFileInTree 결과:', result ? { name: result.name, path: result.path } : null)
  return result
}

/**
 * Resolve a mention to a full file path
 */
export function resolveMentionPath(mention: string, fileTree: FileNode[]): string | null {
  // Remove @ prefix if present
  const searchTerm = mention.startsWith('@') ? mention.substring(1) : mention
  
  const found = findFileInTree(searchTerm, fileTree)
  return found ? found.path : null
}

/**
 * Get file size as human readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

/**
 * Check if file size is within acceptable limits for mentions
 */
export function isFileSizeAcceptable(fileSize: number, isBase64: boolean): { acceptable: boolean; reason?: string } {
  // Different limits for text vs binary files
  const maxTextSize = 10 * 1024 * 1024 // 10MB for text files
  const maxBinarySize = 100 * 1024 * 1024 // 100MB for binary files (mainly Excel)
  
  const limit = isBase64 ? maxBinarySize : maxTextSize
  
  if (fileSize > limit) {
    return {
      acceptable: false,
      reason: `File too large (${formatFileSize(fileSize)}). Maximum allowed: ${formatFileSize(limit)}`
    }
  }
  
  return { acceptable: true }
} 