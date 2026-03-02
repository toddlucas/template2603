import React from 'react';
import { ErrorBoundary, useErrorHandler, withErrorBoundary } from './ErrorBoundary';

// Example component that might throw an error
const BuggyComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('This is a simulated error for testing the error boundary!');
  }

  return (
    <div className="p-4 bg-green-100 border border-green-300 rounded-md">
      <p className="text-green-800">This component is working correctly!</p>
    </div>
  );
};

// Example using the hook
const ComponentWithErrorHandler = () => {
  const { error, handleError, clearError } = useErrorHandler();

  const simulateError = () => {
    try {
      throw new Error('Error handled by hook!');
    } catch (err) {
      handleError(err as Error);
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-300 rounded-md">
        <p className="text-red-800 mb-2">Error: {error.message}</p>
        <button
          onClick={clearError}
          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
        >
          Clear Error
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-100 border border-blue-300 rounded-md">
      <p className="text-blue-800 mb-2">Component with error handler</p>
      <button
        onClick={simulateError}
        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
      >
        Simulate Error
      </button>
    </div>
  );
};

// Component wrapped with HOC
const WrappedComponent = withErrorBoundary(BuggyComponent, {
  showDetails: true,
  onError: (error, errorInfo) => {
    console.log('HOC Error Boundary caught:', error, errorInfo);
  }
});

// Main example component
export const ErrorBoundaryExample = () => {
  const [shouldThrow, setShouldThrow] = React.useState(false);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Error Boundary Examples</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Example 1: Basic Error Boundary */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Basic Error Boundary</h2>
          <ErrorBoundary>
            <BuggyComponent shouldThrow={shouldThrow} />
          </ErrorBoundary>
          <div className="mt-4">
            <button
              onClick={() => setShouldThrow(!shouldThrow)}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              {shouldThrow ? 'Reset' : 'Trigger Error'}
            </button>
          </div>
        </div>

        {/* Example 2: Custom Fallback UI */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Custom Fallback UI</h2>
          <ErrorBoundary
            fallback={(error) => (
              <div className="p-4 bg-yellow-100 border border-yellow-300 rounded-md">
                <p className="text-yellow-800 font-medium">Custom Error UI</p>
                <p className="text-yellow-700 text-sm mt-1">{error.message}</p>
              </div>
            )}
          >
            <BuggyComponent shouldThrow={true} />
          </ErrorBoundary>
        </div>

        {/* Example 3: Hook-based Error Handling */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Hook-based Error Handling</h2>
          <ComponentWithErrorHandler />
        </div>

        {/* Example 4: HOC Wrapper */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">HOC Wrapper</h2>
          <WrappedComponent shouldThrow={false} />
          <div className="mt-4">
            <button
              onClick={() => setShouldThrow(!shouldThrow)}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              {shouldThrow ? 'Reset' : 'Trigger HOC Error'}
            </button>
          </div>
        </div>
      </div>

      {/* Example 5: Error Boundary with Reset Key */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">Error Boundary with Reset Key</h2>
        <ErrorBoundary
          resetKey={shouldThrow ? 'error' : 'working'}
          showDetails={true}
        >
          <BuggyComponent shouldThrow={shouldThrow} />
        </ErrorBoundary>
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">
            The resetKey changes when toggling, which automatically resets the error boundary.
          </p>
          <button
            onClick={() => setShouldThrow(!shouldThrow)}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            {shouldThrow ? 'Reset' : 'Trigger Error'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundaryExample;
