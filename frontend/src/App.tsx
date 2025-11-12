import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn, useAuth } from '@clerk/clerk-react'
import { ThemeProvider } from './components/ThemeProvider'
import { Home } from './pages/Home'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Accounts } from './pages/Accounts'
import { Transactions } from './pages/Transactions'
import { Budgets } from './pages/Budgets'
import { Insights } from './pages/Insights'
import { setTokenGetter } from './lib/api'
import './index.css'

// Component to set up token getter
function ClerkTokenSetup() {
  const { getToken } = useAuth()
  
  React.useEffect(() => {
    setTokenGetter(async () => {
      try {
        return await getToken()
      } catch {
        return null
      }
    })
  }, [getToken])
  
  return null
}

const clerkPubKey = (import.meta as any).env.VITE_CLERK_PUBLISHABLE_KEY || ''

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/dashboard',
    element: (
      <>
        <SignedIn>
          <Layout />
        </SignedIn>
        <SignedOut>
          <RedirectToSignIn />
        </SignedOut>
      </>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'accounts',
        element: <Accounts />,
      },
      {
        path: 'transactions',
        element: <Transactions />,
      },
      {
        path: 'budgets',
        element: <Budgets />,
      },
      {
        path: 'insights',
        element: <Insights />,
      },
    ],
  },
])

function App() {
  // If Clerk key is missing, show a helpful message
  if (!clerkPubKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Clerk Configuration Required</h1>
          <p className="text-gray-600 mb-4">
            Please add your Clerk Publishable Key to <code className="bg-gray-100 px-2 py-1 rounded">frontend/.env</code>
          </p>
          <p className="text-sm text-gray-500">
            Add: <code className="bg-gray-100 px-2 py-1 rounded">VITE_CLERK_PUBLISHABLE_KEY=pk_test_...</code>
          </p>
        </div>
      </div>
    )
  }

  return (
    <ThemeProvider defaultTheme="system" storageKey="ai-finance-ui-theme">
      <ClerkProvider publishableKey={clerkPubKey}>
        <ClerkTokenSetup />
        <RouterProvider router={router} />
      </ClerkProvider>
    </ThemeProvider>
  )
}

export default App