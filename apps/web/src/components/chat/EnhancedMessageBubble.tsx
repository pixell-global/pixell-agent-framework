'use client'

import React from 'react'
import { User, Bot, AlertTriangle, FileText, Code2, Paperclip, Copy, Check } from 'lucide-react'
import { ChatMessage } from '@/types'
import { HybridStreamingRenderer } from '@pixell/renderer'
import { ThinkingIndicator } from './ThinkingIndicator'
import { FileAttachmentPreview } from './FileAttachmentPreview'
import { useChatStore } from '@/stores/chat-store'

interface EnhancedMessageBubbleProps {
  message: ChatMessage
  isStreaming?: boolean
  className?: string
}

export function EnhancedMessageBubble({ 
  message, 
  isStreaming = false,
  className = '' 
}: EnhancedMessageBubbleProps) {
  const [copied, setCopied] = React.useState(false)
  
  // Don't render empty messages at all
  if (!message.content.trim()) {
    return null;
  }
  
  // const settings = useChatStore(state => state.settings) // Unused for now

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy message:', error)
    }
  }

  const getMessageIcon = () => {
    switch (message.role) {
      case 'user':
        return <User size={20} className="text-white" />
      case 'assistant':
        return <Bot size={20} className="text-white" />
      case 'system':
        return <AlertTriangle size={20} className="text-white" />
      default:
        return null
    }
  }

  const getMessageTypeIcon = () => {
    switch (message.messageType) {
      case 'alert':
        return <AlertTriangle size={16} className="text-red-500" />
      case 'file_context':
        return <FileText size={16} className="text-blue-500" />
      case 'code':
        return <Code2 size={16} className="text-purple-500" />
      default:
        return null
    }
  }

  const isUser = message.role === 'user'
  const isAlert = message.messageType === 'alert'

  return (
    <div className={`group w-full text-gray-800 ${isUser ? 'bg-gray-50' : 'bg-white'} ${className}`}>
      <div className="flex gap-4 mx-auto p-4">
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-sm flex items-center justify-center ${
          isUser ? 'bg-green-500' : isAlert ? 'bg-red-500' : 'bg-blue-500'
        }`}>
          {getMessageIcon()}
        </div>

        {/* Message Content */}
        <div className="flex-1 space-y-2 relative">
          {/* Copy Button - Only show for assistant messages */}
          {!isUser && (
            <button
              onClick={copyToClipboard}
              className="absolute top-0 right-0 p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
              title="Copy message"
            >
              {copied ? (
                <Check size={16} className="text-green-500" />
              ) : (
                <Copy size={16} />
              )}
            </button>
          )}

          {/* Message Header - Only show for system messages or when there are attachments */}
          {(message.messageType && message.messageType !== 'text') || 
           (message.attachments && message.attachments.length > 0) || 
           (message.fileReferences && message.fileReferences.length > 0) ? (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {getMessageTypeIcon()}
              {message.messageType === 'alert' && <span>System Alert</span>}
              {message.messageType === 'file_context' && <span>File Context</span>}
              {message.messageType === 'code' && <span>Code</span>}
              <span className="text-xs text-gray-400">
                {new Date(message.createdAt).toLocaleTimeString()}
              </span>
            </div>
          ) : null}

          {/* Thinking Indicator */}
          {!isUser && message.thinkingSteps && message.thinkingSteps.length > 0 && (
            <ThinkingIndicator
              messageId={message.id}
              steps={message.thinkingSteps}
              isStreamingActive={isStreaming && message.isThinking}
              className="mb-4"
            />
          )}

          {/* File Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mb-3">
              <FileAttachmentPreview
                attachments={message.attachments}
                onRemove={() => {}} // Read-only for sent messages
              />
            </div>
          )}

          {/* File Context Display */}
          {message.fileReferences && message.fileReferences.length > 0 && (
            <div className="mb-3 text-xs text-blue-600 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded">
              <Paperclip size={12} />
              {message.fileReferences.length} file(s) referenced
            </div>
          )}

          {/* Message Content with Enhanced Renderer */}
          <div className="max-w-none overflow-x-auto message-content-scroll" style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#CBD5E1 #F1F5F9'
          }}>
            <style>{`
              .message-content-scroll::-webkit-scrollbar {
                height: 6px;
              }
              .message-content-scroll::-webkit-scrollbar-track {
                background: #f1f5f9;
                border-radius: 3px;
              }
              .message-content-scroll::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 3px;
              }
              .message-content-scroll::-webkit-scrollbar-thumb:hover {
                background: #94a3b8;
              }
            `}</style>
            <HybridStreamingRenderer
              content={message.content}
              isStreaming={isStreaming}
              messageId={message.id}
              className=""
            />
          </div>

          {/* Message Metadata */}
          {message.metadata && (
            <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
              {message.taskId && (
                <span className="bg-gray-100 px-2 py-1 rounded-full">
                  Task: {message.taskId.slice(0, 8)}
                </span>
              )}
              {message.updatedAt && message.updatedAt !== message.createdAt && (
                <span>
                  Updated: {new Date(message.updatedAt).toLocaleTimeString()}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 