import { Link } from 'react-router-dom'
import { useAuthentication } from '$/hooks/AuthHooks';
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const { isAuthenticated, loading } = useAuthentication();

  return (
    <div className="text-center">
      <div className="logo-container">
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Product Name</h1>
      <div>
        <Link to="/auth-test" className="text-blue-600 hover:text-blue-800">Auth test</Link>
        <span> &middot; </span>
        {!loading && (
          isAuthenticated ? (
            <Link to="/signout" className="text-blue-600 hover:text-blue-800">Sign out</Link>
          ) : (
            <Link to="/signin" className="text-blue-600 hover:text-blue-800">Sign in</Link>
          )
        )}
        {loading && (
          <span className="text-gray-500">Checking authentication...</span>
        )}
      </div>
      <div>
        <Link to="/mail/overview" className="text-blue-600 hover:text-blue-800">Dashboard</Link>
      </div>
    </div>
  )
}

export default App
