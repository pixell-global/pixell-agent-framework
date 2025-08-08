import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Activity, CheckCircle, Clock, Zap, AlertCircle, Wifi, WifiOff, Wand2 } from 'lucide-react'
import { useWorkspaceStore, selectKPIMetrics, selectRecentJobs } from '@/stores/workspace-store'
import { useWebSocket } from '@/lib/websocket-manager'
import { useRealtimeKPI } from '@/hooks/use-realtime-kpi'
import { useSupabase } from '@/hooks/use-supabase'
import { KPIWidget, ActiveJobsKPI, SuccessRateKPI, AverageRuntimeKPI, QueuedJobsKPI } from '@/components/kpi/KPIWidget'
import { A2ATableDemo } from '@/components/a2a_task/a2a_task'
import { JobsTable } from '@/components/kpi/JobsTable'
import { cn } from '@/lib/utils'
import { coreAgentService } from '@/services/coreAgentService'

export interface ActivityPaneRef {
  triggerUIGeneration: (data: any) => void
}

export const ActivityPane = forwardRef<ActivityPaneRef>((props, ref) => {
  const { 
    liveMetrics, 
    tasks, 
    isConnected,
    agents,
    setKPIMetrics,
    setRecentJobs
  } = useWorkspaceStore()
  
  const { user } = useSupabase()
  const { connect } = useWebSocket()
  
  // UI 생성 관련 상태
  const [uiQuery, setUiQuery] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedUI, setGeneratedUI] = useState<{
    title: string
    html: string
  } | null>(null)
  
  // Use realtime KPI data
  const kpiData = useRealtimeKPI(user?.id || 'demo-user')
  const kpiMetrics = useWorkspaceStore(selectKPIMetrics)
  const recentJobs = useWorkspaceStore(selectRecentJobs)

  // Connect to WebSocket on mount
  useEffect(() => {
    connect()
  }, [connect])
  
  // ref를 통해 외부에서 호출할 수 있는 함수들 노출
  useImperativeHandle(ref, () => ({
    triggerUIGeneration: handleGenerateUI
  }))
  
  // UI 생성 함수
  const handleGenerateUI = async (data?: any) => {
    // 버튼 클릭 시에는 uiQuery 체크, 직접 호출 시에는 스킵
    if (!data && !uiQuery.trim()) return
    
    setIsGenerating(true)
    try {
      // ChatWorkspace에서 직접 받은 데이터를 사용하거나, 없으면 API 호출
      let result = data
      
      if (!result) {
        const apiResult = await coreAgentService.getActivity()
        console.log('🔍 API에서 받은 데이터:', apiResult)
        
        if (Array.isArray(apiResult) && apiResult.length > 0) {
          result = apiResult[apiResult.length - 1]
        }
      }
      
      console.log('🔍 ActivityPane에서 처리할 result:', result)
      
      if (result && result.contents && result.contents.data) {
        console.log('✅ UI 데이터 파싱 성공')
        setGeneratedUI({
          title: result.contents.data.title || 'Generated UI',
          html: result.contents.data.html || ''
        })
      } else {
        console.log('❌ UI 데이터 파싱 실패 - 예상 구조와 다름')
        console.log('기대하는 구조: result.contents.data.{html, title}')
        console.log('실제 구조:', result)
      }
    } catch (error) {
      console.error('UI 생성 실패:', error)
    } finally {
      setIsGenerating(false)
    }
  }
  
  // Update workspace store with KPI data
  useEffect(() => {
    if (kpiData.metrics) {
      setKPIMetrics(kpiData.metrics)
    }
    if (kpiData.recentJobs) {
      setRecentJobs(kpiData.recentJobs)
    }
  }, [kpiData.metrics, kpiData.recentJobs, setKPIMetrics, setRecentJobs])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-yellow-500'
      case 'succeeded': return 'bg-green-500'
      case 'failed': return 'bg-red-500'
      case 'queued': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600'
      case 'degraded': return 'text-yellow-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Connection Status */}
      <div className="flex items-center gap-2 p-3 border-b">
        {isConnected ? (
          <>
            <Wifi className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-600">Connected</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-600">Disconnected</span>
          </>
        )}
      </div>

      <div className="flex-1 p-4">
        {/* UI Generation */}
        <Card className="h-full">
          <CardContent className="pt-0 h-full overflow-auto">
            <div className="h-full">                
              {/* 생성된 UI 표시 */}
              {generatedUI && (
                <div className="h-full flex flex-col">
                  <div className="text-sm font-medium mb-2 flex-shrink-0">{generatedUI.title}</div>
                  <div className="bg-white border rounded p-3 flex-1 overflow-hidden">
                    <iframe 
                      srcDoc={generatedUI.html}
                      className="w-full h-full border-0"
                      sandbox="allow-scripts allow-same-origin"
                      title={generatedUI.title}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
})

ActivityPane.displayName = 'ActivityPane' 