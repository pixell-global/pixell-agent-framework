'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Send, Paperclip, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { FileReference, FileAttachment, FileMention, FileNode } from '@/types'
import { useChatStore } from '@/stores/chat-store'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { FileAttachmentPreview } from './FileAttachmentPreview'
import { FileMentionAutocomplete } from './FileMentionAutocomplete'
import { processMentions } from '@/lib/mention-processor'

interface ChatInputProps {
  onSendMessage: (message: string, files: FileReference[], attachments: FileAttachment[], mentions: FileMention[]) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function ChatInput({ 
  onSendMessage, 
  disabled = false,
  placeholder = "Type a message... Use @ to mention files",
  className = ''
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')
  const [mentionAutocomplete, setMentionAutocomplete] = useState<{
    visible: boolean
    searchTerm: string
    position: { top: number; left: number }
    startIndex: number
  }>({
    visible: false,
    searchTerm: '',
    position: { top: 0, left: 0 },
    startIndex: -1
  })
  
  const selectedFiles = useWorkspaceStore(state => state.selectedFiles)
  const pendingAttachments = useChatStore(state => state.pendingAttachments)
  const removeFileReference = useWorkspaceStore(state => state.removeFileReference)
  const clearFileReferences = useWorkspaceStore(state => state.clearFileReferences)
  const addAttachment = useChatStore(state => state.addAttachment)
  const removeAttachment = useChatStore(state => state.removeAttachment)
  const updateAttachment = useChatStore(state => state.updateAttachment)
  const clearAttachments = useChatStore(state => state.clearAttachments)
  const isLoading = useChatStore(state => state.isLoading)
  const agentHealth = useChatStore(state => state.agentHealth)

  // Handle attachment removal
  const handleAttachmentRemove = (id: string) => {
    removeAttachment(id)
    setFileReferences(prev => {
      const newMap = new Map(prev)
      newMap.delete(id)
      return newMap
    })
  }

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  // Store File objects to maintain reference for actual upload
  const [fileReferences, setFileReferences] = useState<Map<string, File>>(new Map())

  // Handle file selection for attachments
  const handleFileSelect = (files: FileList) => {
    Array.from(files).forEach(file => {
      const attachment: FileAttachment = {
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadStatus: 'pending',
        uploadProgress: 0
      }

      // Store the actual File object
      setFileReferences(prev => new Map(prev.set(attachment.id, file)))

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          updateAttachment(attachment.id, {
            preview: e.target?.result as string
          })
        }
        reader.readAsDataURL(file)
      }

      addAttachment(attachment)
    })
  }

  // Handle mention detection
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setMessage(value)

    // Check for @ mentions
    const cursorPosition = e.target.selectionStart
    const textUpToCursor = value.substring(0, cursorPosition)
    const lastAtIndex = textUpToCursor.lastIndexOf('@')
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textUpToCursor.substring(lastAtIndex + 1)
      
      // Check if it's a valid mention context (no spaces, reasonable length)
      if (textAfterAt.length <= 50 && !textAfterAt.includes(' ')) {
        // Calculate position for autocomplete (using fixed positioning)
        const textarea = textareaRef.current!
        const rect = textarea.getBoundingClientRect()
        

        
        setMentionAutocomplete({
          visible: true,
          searchTerm: textAfterAt,
          position: {
            top: rect.top - 270, // Show above textarea (270px is dropdown height)
            left: rect.left
          },
          startIndex: lastAtIndex
        })
        return
      }
    }
    
    // Hide autocomplete if not in mention context
    if (mentionAutocomplete.visible) {
      setMentionAutocomplete(prev => ({ ...prev, visible: false }))
    }
  }

  // Handle mention selection
  const handleMentionSelect = (file: FileNode) => {
    const beforeMention = message.substring(0, mentionAutocomplete.startIndex)
    const afterMention = message.substring(textareaRef.current!.selectionStart)
    const mentionText = `@${file.name}`
    
    const newMessage = beforeMention + mentionText + afterMention
    setMessage(newMessage)
    
    // Set cursor position after the mention
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPosition = beforeMention.length + mentionText.length
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition)
        textareaRef.current.focus()
      }
    }, 0)
    
    setMentionAutocomplete(prev => ({ ...prev, visible: false }))
  }

  // State for tracking mention processing
  const [processingMentions, setProcessingMentions] = useState(false)
  const [mentionErrors, setMentionErrors] = useState<string[]>([])
  
  // Get file tree from workspace store
  const fileTree = useWorkspaceStore(state => state.fileTree)

  // Upload files to .temp folder
  const uploadAttachmentsToTemp = async (attachments: FileAttachment[]): Promise<FileAttachment[]> => {
    const uploadedAttachments: FileAttachment[] = []

    for (const attachment of attachments) {
      try {
        updateAttachment(attachment.id, { uploadStatus: 'uploading', uploadProgress: 0 })

        // Get the actual File object
        const file = fileReferences.get(attachment.id)
        if (!file) {
          throw new Error('File reference not found')
        }

        // Create FormData for upload
        const formData = new FormData()
        formData.append('file', file)
        formData.append('path', '.temp')

        // Upload with progress tracking
        const xhr = new XMLHttpRequest()
        
        const uploadPromise = new Promise<void>((resolve, reject) => {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const progress = (e.loaded / e.total) * 100
              updateAttachment(attachment.id, { uploadProgress: progress })
            }
          })
          
          xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
              resolve()
            } else {
              reject(new Error(`Upload failed: ${xhr.status}`))
            }
          })
          
          xhr.addEventListener('error', () => {
            reject(new Error('Upload failed'))
          })
          
          xhr.open('POST', '/api/files/create')
          xhr.send(formData)
        })

        await uploadPromise

        const uploadedAttachment = {
          ...attachment,
          uploadStatus: 'completed' as const,
          uploadProgress: 100,
          tempPath: `.temp/${attachment.name}`
        }
        
        updateAttachment(attachment.id, uploadedAttachment)
        uploadedAttachments.push(uploadedAttachment)
      } catch (error) {
        updateAttachment(attachment.id, { 
          uploadStatus: 'error', 
          error: error instanceof Error ? error.message : 'Upload failed'
        })
      }
    }

    return uploadedAttachments
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim() || disabled || isLoading) return

    setProcessingMentions(true)
    setMentionErrors([])
    
    try {
      // Process mentions and load file content
      const mentionResult = await processMentions(message, fileTree)
      
      if (mentionResult.errors.length > 0) {
        setMentionErrors(mentionResult.errors)
        // Still proceed with the message but show errors
      }
      
      // Upload attachments to .temp folder
      const uploadedAttachments = await uploadAttachmentsToTemp(pendingAttachments)
      
      onSendMessage(message.trim(), selectedFiles, uploadedAttachments, mentionResult.mentions)
      setMessage('')
      clearFileReferences()
      clearAttachments()
      setFileReferences(new Map()) // Clear file references
      setMentionErrors([])
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } catch (error) {
      console.error('Error processing mentions:', error)
      setMentionErrors(['Failed to process file mentions'])
    } finally {
      setProcessingMentions(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Don't handle Enter if autocomplete is open
    if (mentionAutocomplete.visible) {
      return
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const getHealthStatusIcon = () => {
    if (!agentHealth) {
      return <AlertCircle size={16} className="text-gray-400" />
    }

    switch (agentHealth.status) {
      case 'connected':
        return <CheckCircle size={16} className="text-green-500" />
      case 'disconnected':
        return <AlertCircle size={16} className="text-red-500" />
      case 'error':
        return <AlertCircle size={16} className="text-orange-500" />
      default:
        return <AlertCircle size={16} className="text-gray-400" />
    }
  }

  const getHealthStatusText = () => {
    if (!agentHealth) return 'Checking AI status...'
    
    switch (agentHealth.status) {
      case 'connected':
        return `AI Ready (${agentHealth.runtime}${agentHealth.model ? ` - ${agentHealth.model}` : ''})`
      case 'disconnected':
        return 'AI Disconnected - Run "pixell config-ai" to setup'
      case 'error':
        return 'AI Error - Check configuration'
      default:
        return 'AI Status Unknown'
    }
  }

  return (
    <div className={`chat-input ${className}`}>
      {/* AI Health Status */}
      <div className="flex items-center gap-2 mb-2 px-1">
        {getHealthStatusIcon()}
        <span className="text-xs text-gray-600">
          {getHealthStatusText()}
        </span>
        {agentHealth?.status === 'disconnected' && (
          <span className="text-xs text-blue-600 underline cursor-pointer">
            Setup Guide
          </span>
        )}
      </div>

      {/* File Attachments Preview */}
      {pendingAttachments.length > 0 && (
        <div className="mb-3">
          <FileAttachmentPreview
            attachments={pendingAttachments}
            onRemove={handleAttachmentRemove}
          />
        </div>
      )}

      {/* File References */}
      {selectedFiles.length > 0 && (
        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">
              Referenced Files ({selectedFiles.length})
            </span>
            <button
              onClick={clearFileReferences}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-1 bg-white border border-blue-200 rounded px-2 py-1 text-xs"
              >
                <span className="text-blue-900 font-medium">{file.name}</span>
                <button
                  onClick={() => removeFileReference(file.id)}
                  className="text-blue-600 hover:text-blue-800"
                  aria-label={`Remove ${file.name}`}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mention Processing Feedback */}
      {processingMentions && (
        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-yellow-800">
            <Loader2 size={16} className="animate-spin" />
            <span>Processing file mentions...</span>
          </div>
        </div>
      )}

      {/* Mention Errors */}
      {mentionErrors.length > 0 && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle size={16} className="text-red-500" />
            <span className="text-sm font-medium text-red-900">
              File Mention Issues
            </span>
          </div>
          <div className="text-xs text-red-700 space-y-1">
            {mentionErrors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2 relative">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className="min-h-[44px] max-h-32 resize-none pr-10"
            rows={1}
          />
          
          {/* File Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute right-2 top-2 p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
            aria-label="Attach files"
            disabled={disabled || isLoading}
          >
            <Paperclip size={16} />
          </button>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                handleFileSelect(e.target.files)
              }
            }}
          />
        </div>

        {/* Send Button */}
        <Button
          type="submit"
          disabled={!message.trim() || disabled || isLoading || agentHealth?.status !== 'connected'}
          className="h-11 px-4"
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
        </Button>

        {/* Mention Autocomplete */}
        <FileMentionAutocomplete
          searchTerm={mentionAutocomplete.searchTerm}
          onSelect={handleMentionSelect}
          onClose={() => setMentionAutocomplete(prev => ({ ...prev, visible: false }))}
          position={mentionAutocomplete.position}
          visible={mentionAutocomplete.visible}
        />
      </form>

      {/* Helper Text */}
      <div className="mt-2 text-xs text-gray-500">
        <span>Press Enter to send, Shift+Enter for new line</span>
        {agentHealth?.status !== 'connected' && (
          <span className="ml-2 text-red-600">
            • AI not available
          </span>
        )}
      </div>
    </div>
  )
} 