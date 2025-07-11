'use client'
import { create } from 'zustand'
import { subscribeWithSelector, persist } from 'zustand/middleware'
import { z } from 'zod'

// CLI Configuration Schema
export const CLIConfigSchema = z.object({
  defaultTemplate: z.string().default('multi-agent'),
  preferredRuntime: z.enum(['aws-strand', 'langgraph', 'openai-assistants']).default('aws-strand'),
  deploymentTargets: z.array(z.enum(['docker', 'kubernetes', 'vercel', 'aws'])).default(['docker']),
  extensionRegistry: z.string().url().default('https://registry.pixell.dev'),
  telemetryEnabled: z.boolean().default(true),
  lastUpdate: z.string().optional(),
  installedExtensions: z.array(z.string()).default([]),
  storageLimit: z.number().int().min(1).max(1000).default(10), // Storage limit in GB
  
  // AI Configuration - Multi-Provider Support
  aiConfig: z.object({
    defaultProvider: z.enum(['openai', 'anthropic', 'aws-bedrock', 'azure-openai', 'google']).default('openai'),
    providers: z.object({
      openai: z.object({
        apiKey: z.string().optional(),
        defaultModel: z.string().default('gpt-4o'),
        organization: z.string().optional(),
        baseUrl: z.string().optional(), // For custom endpoints
        enabled: z.boolean().default(true)
      }).optional(),
      anthropic: z.object({
        apiKey: z.string().optional(),
        defaultModel: z.string().default('claude-3-5-sonnet-20241022'),
        enabled: z.boolean().default(false)
      }).optional(),
      awsBedrock: z.object({
        accessKeyId: z.string().optional(),
        secretAccessKey: z.string().optional(),
        region: z.string().default('us-east-1'),
        defaultModel: z.string().default('anthropic.claude-3-5-sonnet-20241022-v2:0'),
        enabled: z.boolean().default(false)
      }).optional(),
      azureOpenai: z.object({
        apiKey: z.string().optional(),
        endpoint: z.string().optional(),
        deploymentName: z.string().optional(),
        apiVersion: z.string().default('2024-02-01'),
        enabled: z.boolean().default(false)
      }).optional(),
      google: z.object({
        apiKey: z.string().optional(),
        defaultModel: z.string().default('gemini-1.5-pro'),
        enabled: z.boolean().default(false)
      }).optional()
    }).default({}),
    configured: z.boolean().default(false),
    lastConfigured: z.string().optional()
  }).default({
    defaultProvider: 'openai',
    providers: {},
    configured: false
  })
})

export type CLIConfig = z.infer<typeof CLIConfigSchema>

interface ProjectState {
  name: string
  path: string
  template: string
  runtime: string
  plugins: string[]
  createdAt: string
}

interface CLIStore {
  // Configuration
  config: CLIConfig
  
  // Current project state
  currentProject: ProjectState | null
  
  // Supabase setup state
  supabaseSetup: {
    configured: boolean
    type: string
    lastConfigured: string
  } | null
  
  // Plugin management
  availablePlugins: Array<{
    id: string
    name: string
    description: string
    version: string
    type: 'runtime' | 'worker' | 'ui' | 'tool'
    verified: boolean
    downloads: number
  }>
  
  // Loading states
  isLoading: boolean
  isGenerating: boolean
  isDeploying: boolean
  
  // Actions
  setConfig: (config: Partial<CLIConfig>) => void
  setCurrentProject: (project: ProjectState | null) => void
  setSupabaseSetup: (setup: { configured: boolean; type: string; lastConfigured: string } | null) => void
  addInstalledPlugin: (pluginId: string) => void
  removeInstalledPlugin: (pluginId: string) => void
  fetchAvailablePlugins: () => Promise<void>
  setLoading: (loading: boolean) => void
  setGenerating: (generating: boolean) => void
  setDeploying: (deploying: boolean) => void
  
  // Getters
  getInstalledPlugins: () => string[]
  getPluginsByType: (type: string) => Array<any>
  isPluginInstalled: (pluginId: string) => boolean
}

export const useCLIStore = create<CLIStore>()(
  persist(
    subscribeWithSelector((set, get) => ({
      // Initial state
      config: CLIConfigSchema.parse({}),
      currentProject: null,
      supabaseSetup: null,
      availablePlugins: [],
      isLoading: false,
      isGenerating: false,
      isDeploying: false,
      
      // Actions
      setConfig: (newConfig) => set((state) => ({
        config: { ...state.config, ...newConfig }
      })),
      
      setCurrentProject: (project) => set({ currentProject: project }),
      
      setSupabaseSetup: (setup) => set({ supabaseSetup: setup }),
      
      addInstalledPlugin: (pluginId) => set((state) => ({
        config: {
          ...state.config,
          installedExtensions: [...state.config.installedExtensions, pluginId]
        }
      })),
      
      removeInstalledPlugin: (pluginId) => set((state) => ({
        config: {
          ...state.config,
          installedExtensions: state.config.installedExtensions.filter(id => id !== pluginId)
        }
      })),
      
      fetchAvailablePlugins: async () => {
        set({ isLoading: true })
        try {
          // Mock plugin data - in real implementation, fetch from registry
          const plugins = [
            {
              id: 'reddit-agent-pro',
              name: 'Reddit Agent Pro',
              description: 'Advanced Reddit automation with sentiment analysis',
              version: '1.2.0',
              type: 'worker' as const,
              verified: true,
              downloads: 15420
            },
            {
              id: 'langgraph-runtime',
              name: 'LangGraph Runtime',
              description: 'LangGraph runtime adapter for Pixell',
              version: '0.8.1',
              type: 'runtime' as const,
              verified: true,
              downloads: 8930
            },
            {
              id: 'slack-notifications',
              name: 'Slack Notifications',
              description: 'Send task notifications to Slack channels',
              version: '2.1.0',
              type: 'tool' as const,
              verified: true,
              downloads: 12500
            },
            {
              id: 'chart-ui-components',
              name: 'Chart UI Components',
              description: 'Additional chart components for Activity Pane',
              version: '1.0.3',
              type: 'ui' as const,
              verified: false,
              downloads: 450
            }
          ]
          
          set({ availablePlugins: plugins })
        } catch (error) {
          console.error('Failed to fetch plugins:', error)
        } finally {
          set({ isLoading: false })
        }
      },
      
      setLoading: (isLoading) => set({ isLoading }),
      setGenerating: (isGenerating) => set({ isGenerating }),
      setDeploying: (isDeploying) => set({ isDeploying }),
      
      // Getters
      getInstalledPlugins: () => get().config.installedExtensions,
      
      getPluginsByType: (type) => 
        get().availablePlugins.filter(plugin => plugin.type === type),
      
      isPluginInstalled: (pluginId) => 
        get().config.installedExtensions.includes(pluginId),
    })),
    {
      name: 'pixell-cli-storage', // unique name for localStorage
      partialize: (state) => ({ 
        config: state.config,
        currentProject: state.currentProject,
        supabaseSetup: state.supabaseSetup
      })
    }
  )
) 