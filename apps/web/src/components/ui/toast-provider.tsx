'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import * as Toast from '@radix-ui/react-toast'
import { X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
  persistent?: boolean
}

interface ToastContextType {
  addToast: (toast: Omit<ToastItem, 'id'>) => void
  removeToast: (id: string) => void
  toasts: ToastItem[]
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: React.ReactNode
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: ToastItem = {
      id,
      duration: 5000,
      ...toast,
    }
    setToasts(prev => [...prev, newToast])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const getToastStyles = (type: ToastType) => {
    const baseStyles = 'rounded-md p-4 shadow-lg border transition-all duration-300'
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-50 border-green-200 text-green-800`
      case 'error':
        return `${baseStyles} bg-red-50 border-red-200 text-red-800`
      case 'warning':
        return `${baseStyles} bg-yellow-50 border-yellow-200 text-yellow-800`
      case 'info':
        return `${baseStyles} bg-blue-50 border-blue-200 text-blue-800`
      default:
        return `${baseStyles} bg-gray-50 border-gray-200 text-gray-800`
    }
  }

  return (
    <ToastContext.Provider value={{ addToast, removeToast, toasts }}>
      <Toast.Provider swipeDirection="right">
        {children}
        {toasts.map((toast) => (
          <Toast.Root
            key={toast.id}
            className={getToastStyles(toast.type)}
            duration={toast.persistent ? Infinity : toast.duration}
            onOpenChange={(open) => {
              if (!open) {
                removeToast(toast.id)
              }
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Toast.Title className="font-semibold text-sm">
                  {toast.title}
                </Toast.Title>
                {toast.description && (
                  <Toast.Description className="text-sm mt-1 opacity-90">
                    {toast.description}
                  </Toast.Description>
                )}
              </div>
              <Toast.Close asChild>
                <button
                  className="ml-3 p-1 hover:bg-black/10 rounded-full transition-colors"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </Toast.Close>
            </div>
          </Toast.Root>
        ))}
        <Toast.Viewport className="fixed bottom-0 right-0 flex flex-col p-6 gap-2 w-96 max-w-[100vw] m-0 list-none z-50 outline-none" />
      </Toast.Provider>
    </ToastContext.Provider>
  )
}