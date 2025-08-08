'use client'

import React, { useEffect, useRef } from 'react'
import { ChatMessage, FileReference, FileAttachment, FileMention } from '@/types'
import { EnhancedMessageBubble } from './EnhancedMessageBubble'
import { ChatInput } from './ChatInput'
import { useChatStore, selectMessages, selectIsLoading, selectStreamingMessage } from '@/stores/chat-store'
import { coreAgentService } from '@/services/coreAgentService'
import { ActivityPaneRef } from '@/components/activity/activity-pane'
import { RefObject } from 'react'

interface ChatWorkspaceProps {
  className?: string
  activityPaneRef?: RefObject<ActivityPaneRef>
}

export function ChatWorkspace({ className = '', activityPaneRef }: ChatWorkspaceProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  
  // Zustand store selectors
  const messages = useChatStore(selectMessages)
  const isLoading = useChatStore(selectIsLoading)
  const streamingMessage = useChatStore(selectStreamingMessage)
  
  // Debug logging removed - rendering now working
  
  const settings = useChatStore(state => state.settings)
  const agentHealth = useChatStore(state => state.agentHealth)
  
  // Store actions
  const addMessage = useChatStore(state => state.addMessage)
  const getRecentHistory = useChatStore(state => state.getRecentHistory)
  
  // Remove test message - rendering confirmed to work
  const setStreamingMessage = useChatStore(state => state.setStreamingMessage)
  const handleStreamingChunk = useChatStore(state => state.handleStreamingChunk)
  const setLoading = useChatStore(state => state.setLoading)
  const setAgentHealth = useChatStore(state => state.setAgentHealth)

  // Auto-scroll to bottom when new messages arrive or during streaming
  useEffect(() => {
    if (settings.autoScrollEnabled && scrollAreaRef.current) {
      // Use requestAnimationFrame to ensure the DOM has updated
      requestAnimationFrame(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
        }
      })
    }
  }, [messages, streamingMessage, settings.autoScrollEnabled])

  // Additional effect to handle streaming content updates
  useEffect(() => {
    if (streamingMessage && settings.autoScrollEnabled && scrollAreaRef.current) {
      // Smooth scroll during streaming
      requestAnimationFrame(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
        }
      })
    }
  }, [streamingMessage, settings.autoScrollEnabled])

  // Check AI health on mount and clear temp folder
  useEffect(() => {
    const checkHealth = async () => {
      const health = await coreAgentService.getHealthStatus()
      setAgentHealth(health)
    }
    
    const clearTempFolder = async () => {
      try {
        // Simply ensure .temp folder exists, but don't try to clear it on app start
        // This was causing deletion of wrong files
        await fetch('/api/files/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: '.temp',
            type: 'folder'
          })
        }).catch(() => {
          // Ignore error if folder already exists
        })
        
        console.log('.temp folder ensured to exist')
      } catch (error) {
        console.error('Failed to ensure temp folder exists:', error)
      }
    }
    
    checkHealth()
    clearTempFolder()
    
    // Check health every 30 seconds
    const healthInterval = setInterval(checkHealth, 30000)
    return () => clearInterval(healthInterval)
  }, [setAgentHealth])

  const handleSendMessage = async (content: string, fileReferences: FileReference[], attachments: FileAttachment[], mentions: FileMention[]) => {
    if (!content.trim() || isLoading) return

    // Add user message
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content,
      messageType: 'text',
      fileReferences: fileReferences.length > 0 ? fileReferences : undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
      mentions: mentions.length > 0 ? mentions : undefined,
      createdAt: new Date().toISOString()
    }
    
    addMessage(userMessage)

    // Create assistant message for streaming
    const assistantMessage: ChatMessage = {
      id: `assistant_${Date.now()}`,
      role: 'assistant',
      content: '',
      messageType: 'text',
      streaming: true,
      createdAt: new Date().toISOString()
    }
    addMessage(assistantMessage)
    setStreamingMessage(assistantMessage.id)
    setLoading(true)

    // Send to Core Agent
    try {
      // Get recent message history for context (last 10 exchanges)
      const history = getRecentHistory(10)
      
      // Process file attachments - combine file references and attachments
      const allFileReferences: FileReference[] = [...fileReferences]
      
      // Add attachment data that was passed from ChatInput component
      // Note: We need to get the actual file content from the ChatInput component
      // For now, we'll use the attachment metadata and fetch content later
      
      await coreAgentService.sendMessage(
        {
          message: content,
          history,
          fileReferences: allFileReferences,
          fileAttachments: attachments, // Pass attachments separately so service can handle them
          fileMentions: mentions, // Pass file mentions with loaded content
          settings
        },
        // On streaming chunk
        (chunk) => {
          handleStreamingChunk(chunk)
        },
        // On complete
        (finalResponse) => {
          setStreamingMessage(null)
          setLoading(false)
        },
        // On error
        (error) => {
          console.error('Chat error:', error)
          
          // Add error message
          const errorMessage: ChatMessage = {
            id: `error_${Date.now()}`,
            role: 'assistant',
            content: `Sorry, I encountered an error: ${error}`,
            messageType: 'alert',
            createdAt: new Date().toISOString()
          }
          
          addMessage(errorMessage)
          setStreamingMessage(null)
          setLoading(false)
        }
      )

	  // Get Data for Generate UI
	  const data = await coreAgentService.getActivity()
	  console.log('🔍 getActivity 반환 데이터:', data)
	  
	  // API가 배열을 직접 반환하므로 마지막 항목을 가져옴
	  let itemToPass = null
	  
	  if (Array.isArray(data) && data.length > 0) {
	    itemToPass = data[data.length - 1]
	  }
	  
	  console.log('🔍 전달할 아이템:', itemToPass)
	  
	  if (itemToPass && activityPaneRef?.current) {
	    activityPaneRef.current.triggerUIGeneration(itemToPass)
	  }

    } catch (error) {
      console.error('Failed to send message:', error)
      setStreamingMessage(null)
      setLoading(false)
    }
  }

  const renderWelcomeMessage = () => {
    if (messages.length > 0) return null

    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="max-w-md">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Welcome to Pixell Agent Framework
          </h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Start a conversation with our AI agents. They can help you with various tasks and workflows.
          </p>
          
          {!agentHealth?.healthy && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-amber-800 mb-2">AI Configuration Needed</h3>
              <p className="text-sm text-amber-700 mb-3">
                To get real AI responses, configure your API keys using the CLI.
              </p>
              <code className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded font-mono">
                pixell config ai
              </code>
            </div>
          )}
          
          <div className="text-sm text-gray-500">
            <p className="font-medium mb-3">Try asking:</p>
            <ul className="space-y-2 text-left">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                "Help me analyze this project structure"
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                "Create a README for my application"
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                "Review my code for improvements"
              </li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`chat-workspace flex flex-col h-full bg-white ${className}`}>
      <style>{`
        .chat-workspace-scroll::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        .chat-workspace-scroll::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .chat-workspace-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .chat-workspace-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
      {/* Messages Area - Following Design Guide */}
      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto overflow-x-auto px-4 py-6 chat-workspace-scroll">
        {messages.length === 0 ? (
          renderWelcomeMessage()
        ) : (
          <div className="space-y-4 mx-auto max-w-4xl">
            {messages.map((message) => (
              <EnhancedMessageBubble
                key={message.id}
                message={message}
                isStreaming={streamingMessage?.id === message.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* AI Status Indicator - Following Design Guide */}
      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
        <div className="max-w-3xl mx-auto flex items-center justify-center">
          {agentHealth?.healthy ? (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span>AI Ready ({agentHealth.runtime} - {agentHealth.model})</span>
            </div>
          ) : agentHealth?.status === 'error' ? (
            <div className="flex items-center space-x-2 text-sm text-red-600">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>AI Error - Check configuration</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-sm text-amber-600">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              <span>AI not available</span>
            </div>
          )}
        </div>
      </div>

      {/* Input Area - Following Design Guide */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="max-w-3xl mx-auto">
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  )
} 