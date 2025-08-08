import { ChatMessage, FileReference, StreamingResponse, ChatUISettings, AgentHealth, FileAttachment, FileMention } from '@/types'
import { getPafCoreAgentUrl, getPafCoreAgentHealthUrl } from '@/lib/paf-core-agent-config'

interface SendMessageRequest {
  message: string
  history?: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
  fileReferences?: FileReference[]
  fileAttachments?: FileAttachment[]
  fileMentions?: FileMention[]
  settings: ChatUISettings
}

export class CoreAgentService {
  private baseUrl: string

  constructor() {
    this.baseUrl = getPafCoreAgentUrl()
  }

  /**
   * Send message to Core Agent and handle streaming response
   */
  async sendMessage(
    request: SendMessageRequest,
    onStream: (chunk: StreamingResponse) => void,
    onComplete: (finalResponse: ChatMessage) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      // Process file attachments to create FileContent objects per API spec
      const files: Array<{
        file_name: string
        content: string
        file_type: string
        file_size: number
        file_path?: string
      }> = []
      
      // Add file references (@ mentions) 
      if (request.fileReferences) {
        for (const fileRef of request.fileReferences) {
          if (fileRef.content) {
            files.push({
              file_name: fileRef.name,
              content: fileRef.content,
              file_type: 'text/plain', // Default for @ mentions
              file_size: fileRef.size || fileRef.content.length,
              file_path: fileRef.path
            })
          }
        }
      }
      
      // Add file mentions with loaded content
      if (request.fileMentions) {
        for (const mention of request.fileMentions) {
          if (mention.content && mention.loadingState === 'loaded') {
            files.push({
              file_name: mention.name,
              content: mention.content,
              file_type: mention.fileType || 'text/plain',
              file_size: mention.fileSize || mention.content.length,
              file_path: mention.path
            })
          }
        }
      }
      
      // Add file attachments with base64 content
      if (request.fileAttachments) {
        for (const attachment of request.fileAttachments) {
          try {
            if (attachment.tempPath && attachment.uploadStatus === 'completed') {
              // Determine if it's a binary file that needs base64 encoding
              const isBinaryFile = attachment.type.includes('excel') || 
                                 attachment.type.includes('spreadsheet') ||
                                 attachment.type.includes('pdf') ||
                                 attachment.type.includes('image') ||
                                 attachment.type.includes('application/')
              
              let content: string
              
              if (isBinaryFile) {
                // Read binary file as base64
                const binaryResponse = await fetch(`/api/files/content?path=${encodeURIComponent(attachment.tempPath)}&format=base64`)
                if (binaryResponse.ok) {
                  const binaryData = await binaryResponse.json()
                  content = binaryData.content
                } else {
                  console.error(`Failed to read binary content for ${attachment.name}`)
                  continue
                }
              } else {
                // Read text file as plain text
                const textResponse = await fetch(`/api/files/content?path=${encodeURIComponent(attachment.tempPath)}`)
                if (textResponse.ok) {
                  const textData = await textResponse.json()
                  content = textData.content
                } else {
                  console.error(`Failed to read text content for ${attachment.name}`)
                  continue
                }
              }
              
              // Create FileContent object per API spec
              files.push({
                file_name: attachment.name,
                content: content,
                file_type: attachment.type,
                file_size: attachment.size,
                file_path: attachment.tempPath
              })
            }
          } catch (error) {
            console.error(`Failed to process attachment ${attachment.name}:`, error)
          }
        }
      }

      // Use local API route which forwards to orchestrator
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
          message: request.message,
          history: request.history,
          files: files, // Using correct 'files' field per API spec
          show_thinking: request.settings.showThinking !== 'never',
          model: 'gpt-4o', // Add model per API spec
          temperature: 0.7
          // Removed max_tokens to allow natural completion without cutoffs
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      // Handle Server-Sent Events streaming
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      
      if (!reader) {
        throw new Error('No response stream available')
      }

      try {
        let buffer = ''
        
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          buffer += chunk
          
          // Process complete lines
          const lines = buffer.split('\n')
          buffer = lines.pop() || '' // Keep incomplete line in buffer

          for (const line of lines) {
            const trimmed = line.trim()
            if (trimmed === '') continue
            
            // Handle orchestrator's direct JSON format
            if (trimmed.startsWith('data: ')) {
              const jsonData = trimmed.slice(6).trim()
              
              // Skip [DONE] signals
              if (jsonData === '[DONE]') {
                console.log('📤 Received [DONE] signal')
                continue
              }
              
              try {
                const eventData = JSON.parse(jsonData)
                console.log('📤 Received SSE event:', eventData)
                
                // Handle different event types from orchestrator
                if (eventData.type === 'content') {
                  const chunk: StreamingResponse = {
                    type: 'content',
                    delta: { content: eventData.delta?.content || '' },
                    accumulated: eventData.accumulated || ''
                  }
                  onStream(chunk)
                } else if (eventData.type === 'thinking') {
                  const chunk: StreamingResponse = {
                    type: 'thinking',
                    context: eventData.context || { thoughts: [] }
                  }
                  onStream(chunk)
                } else if (eventData.type === 'complete') {
                  const chunk: StreamingResponse = {
                    type: 'complete'
                  }
                  onStream(chunk)
                } else if (eventData.type === 'error') {
                  const chunk: StreamingResponse = {
                    type: 'error',
                    error: eventData.error || 'Unknown error'
                  }
                  onStream(chunk)
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', parseError, jsonData)
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }

    } catch (error) {
      console.error('Core Agent Service Error:', error)
      onError(error instanceof Error ? error.message : 'AI service error')
    }
  }

  /**
   * Get Core Agent health status
   */
  async getHealthStatus(): Promise<AgentHealth> {
    try {
      // Use local API route which forwards to orchestrator
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      // If the service responds with a non-2xx status, treat it as an unavailable
      // agent but **do not** throw an error. This prevents noisy console errors
      // when the Core Agent or orchestrator is not running.
      if (!response.ok) {
        return {
          healthy: false,
          runtime: 'unavailable',
          model: undefined,
          status: 'disconnected',
          lastCheck: new Date().toISOString()
        }
      }

      const data = await response.json()
      
      return {
        healthy: data.status === 'healthy' || data.status === 'ok',
        runtime: data.runtime?.provider || data.orchestrator?.status || 'unknown',
        model: data.runtime?.model,
        status: data.status === 'healthy' || data.status === 'ok' ? 'connected' : 'error',
        lastCheck: new Date().toISOString()
      }
      
    } catch (error) {
      // Log the error but don't throw - return a safe default state
      console.debug('Health check failed (expected if services are not running):', error)
      
      return {
        healthy: false,
        runtime: 'unavailable',
        model: undefined,
        status: 'disconnected',
        lastCheck: new Date().toISOString()
      }
    }
  }

  /**
   * Acitivity 큐 가져오기
   */
  async getActivity(): Promise<{
    message: string
    payload: any
  }> {
    try {
      const response = await fetch(`http://localhost:8000/api/activity-manager/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Activity API error: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Activity Error:', error)
      throw error
    }
  }
}

export const coreAgentService = new CoreAgentService() 