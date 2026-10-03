/**
 * context/SocketContext.jsx
 *
 * Provides the current Socket.io connection status to any component in the
 * tree without prop-drilling through App → Header.
 *
 * Usage:
 *   // Wrap the app (already done in App.jsx):
 *   <SocketProvider status={socketStatus}><App /></SocketProvider>
 *
 *   // Consume anywhere:
 *   import { useSocketContext } from '../context/SocketContext'
 *   const { socketStatus } = useSocketContext()
 */
import { createContext, useContext } from 'react'

export const SocketContext = createContext({ socketStatus: 'connecting' })

export function SocketProvider({ status, children }) {
  return (
    <SocketContext.Provider value={{ socketStatus: status }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocketContext() {
  return useContext(SocketContext)
}
