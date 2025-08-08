'use client'
import { useUIStore } from '@/stores/ui-store'
import { NavigatorPane } from '@/components/navigator/navigator-pane'
import { ChatWorkspace } from '@/components/chat/ChatWorkspace'
import { ActivityPane, ActivityPaneRef } from '@/components/activity/activity-pane'
import { useWebSocket } from '@/lib/websocket-manager'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { designTokens } from '@/lib/design-tokens'
import { cn } from '@/lib/utils'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { Button } from '@/components/ui/button'
import { PanelLeft, PanelRight, Activity } from 'lucide-react'
import { useEffect, useRef } from 'react'

export function AgentWorkspaceLayout() {
  const { 
    leftPanelVisible, 
    rightPanelVisible, 
    toggleLeftPanel, 
    toggleRightPanel
  } = useUIStore()
  
  const { connect } = useWebSocket()
  const { isConnected } = useWorkspaceStore()
  
  // ActivityPane의 ref 생성
  const activityPaneRef = useRef<ActivityPaneRef>(null as any)
  
  // Connect to WebSocket on mount
  useEffect(() => {
    connect()
  }, [connect])

  return (
    <div className="h-screen bg-background flex flex-col">
      <header className="h-14 border-b bg-card px-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <img 
            src="/sungboon_logo.png" 
            alt="Pixell Agent Framework" 
            className="h-8 w-auto"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLeftPanel}
            className={cn("h-8 w-8 p-0", leftPanelVisible && "bg-accent")}
            title="Toggle Navigator Panel"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleRightPanel}
            className={cn("h-8 w-8 p-0", rightPanelVisible && "bg-accent")}
            title="Toggle Activity Panel"
          >
            <Activity className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-border mx-2" />
          <span className="text-sm text-muted-foreground">v0.1.0</span>
        </div>
      </header>
      
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Left Panel - Navigator */}
          {leftPanelVisible && (
            <>
              <Panel 
                defaultSize={18} 
                minSize={15} 
                maxSize={30}
                className="bg-muted/10 border-r"
              >
                <NavigatorPane />
              </Panel>
              <PanelResizeHandle className="w-px bg-border hover:bg-blue-500 hover:w-1 transition-all duration-200 active:bg-blue-600" />
            </>
          )}
          
          {/* Center Panel - Chat Workspace */}
          <Panel 
            defaultSize={leftPanelVisible && rightPanelVisible ? 50 : leftPanelVisible || rightPanelVisible ? 70 : 100}
            minSize={30}
            className="min-w-0"
          >
            <ChatWorkspace activityPaneRef={activityPaneRef} />
          </Panel>
          
          {/* Right Panel - Activity Pane */}
          {rightPanelVisible && (
            <>
              <PanelResizeHandle className="w-px bg-border hover:bg-blue-500 hover:w-1 transition-all duration-200 active:bg-blue-600" />
              <Panel 
                defaultSize={32} 
                minSize={25} 
                maxSize={45}
                className="bg-muted/10 border-l"
              >
                <div className="h-full overflow-y-auto">
                  <ActivityPane ref={activityPaneRef} />
                </div>
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>
    </div>
  );
} 