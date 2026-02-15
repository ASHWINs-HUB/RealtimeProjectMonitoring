import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error: error,
      errorInfo: error.stack
    }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      hasError: true,
      error: error,
      errorInfo: errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full">
            <h2 className="text-xl font-bold text-red-600 mb-4">Something went wrong</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="font-medium text-red-800">Error: {this.state.error?.message || 'Unknown error occurred'}</p>
              <details className="mt-2">
                <summary className="cursor-pointer font-medium text-blue-600">Error Details</summary>
                <pre className="mt-2 p-4 bg-gray-100 rounded text-sm overflow-auto max-h-40">
                  {this.state.errorInfo}
                </pre>
              </details>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null })
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
