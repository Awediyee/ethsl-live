import { useState } from 'react'
import './Modal.css'
import ApiService from '../../services/api'

function ApiTestModal({ onClose }) {
  const [testResults, setTestResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('test@example.com')
  const [password, setPassword] = useState('password123')

  const addResult = (test, result) => {
    setTestResults(prev => [...prev, { test, result, timestamp: new Date().toISOString() }])
  }

  const clearResults = () => {
    setTestResults([])
  }

  const testConnection = async () => {
    setIsLoading(true)
    try {
      const result = await ApiService.testConnection()
      addResult('Connection Test', { 
        success: result.success, 
        message: result.success ? `API is accessible via: ${result.endpoint} (${result.status})` : result.error,
        endpoint: result.endpoint,
        status: result.status
      })
    } catch (error) {
      addResult('Connection Test', { success: false, error: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  const testCORS = async () => {
    setIsLoading(true)
    try {
      const result = await ApiService.testCORS()
      addResult('CORS Test', result)
    } catch (error) {
      addResult('CORS Test', { success: false, error: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  const testRegistration = async () => {
    setIsLoading(true)
    try {
      const result = await ApiService.register(email, password)
      addResult('Registration Test', { success: true, data: result })
    } catch (error) {
      addResult('Registration Test', { 
        success: false, 
        error: error.message, 
        status: error.status,
        data: error.data 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testLogin = async () => {
    setIsLoading(true)
    try {
      const result = await ApiService.login(email, password)
      addResult('Login Test', { success: true, data: result })
    } catch (error) {
      addResult('Login Test', { 
        success: false, 
        error: error.message, 
        status: error.status,
        data: error.data 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testOTPResend = async () => {
    setIsLoading(true)
    try {
      const result = await ApiService.resendOTP(email)
      addResult('OTP Resend Test', { success: true, data: result })
    } catch (error) {
      addResult('OTP Resend Test', { 
        success: false, 
        error: error.message, 
        status: error.status,
        data: error.data 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testOTPVerify = async () => {
    setIsLoading(true)
    try {
      const result = await ApiService.verifyOTP(email, '123456')
      addResult('OTP Verify Test (/accounts/verify-email)', { success: true, data: result })
    } catch (error) {
      addResult('OTP Verify Test (/accounts/verify-email)', { 
        success: false, 
        error: error.message, 
        status: error.status,
        data: error.data 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testCompleteFlow = async () => {
    setIsLoading(true)
    
    try {
      // Step 1: Register
      addResult('Complete Flow - Step 1: Registration', { status: 'starting', message: 'Attempting registration...' })
      
      const registerResult = await ApiService.register(email, password)
      addResult('Complete Flow - Step 1: Registration', { 
        success: true, 
        message: 'Registration successful! OTP should be sent to email.',
        data: registerResult 
      })
      
      // Step 2: Wait a moment
      addResult('Complete Flow - Step 2: Wait', { status: 'waiting', message: 'Waiting 2 seconds before OTP verification...' })
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Step 3: Try OTP verification (this will fail with test OTP, but should show proper error)
      addResult('Complete Flow - Step 3: OTP Verification', { status: 'starting', message: 'Attempting OTP verification with test code...' })
      
      try {
        const otpResult = await ApiService.verifyOTP(email, '123456')
        addResult('Complete Flow - Step 3: OTP Verification', { 
          success: true, 
          message: 'OTP verification successful!',
          data: otpResult 
        })
      } catch (otpError) {
        addResult('Complete Flow - Step 3: OTP Verification', { 
          success: false, 
          message: 'OTP verification failed (expected with test code)',
          error: otpError.message,
          status: otpError.status,
          data: otpError.data,
          note: 'This is expected to fail with a test OTP code. Use a real OTP from your email.'
        })
      }
      
    } catch (error) {
      addResult('Complete Flow - Registration Failed', { 
        success: false, 
        error: error.message, 
        status: error.status,
        data: error.data 
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2 className="modal-title">API Test Console</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <div className="form-group">
            <label>Test Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label>Test Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <button 
              onClick={testCompleteFlow}
              disabled={isLoading}
              className="btn-primary"
              style={{ fontSize: '12px', backgroundColor: '#4caf50' }}
            >
              Test Complete Flow
            </button>
            
            <button 
              onClick={testConnection}
              disabled={isLoading}
              className="btn-primary"
              style={{ fontSize: '12px' }}
            >
              Test Connection
            </button>
            
            <button 
              onClick={testCORS}
              disabled={isLoading}
              className="btn-secondary"
              style={{ fontSize: '12px', backgroundColor: '#ff6b35' }}
            >
              Test CORS
            </button>
            
            <button 
              onClick={testRegistration}
              disabled={isLoading}
              className="btn-secondary"
              style={{ fontSize: '12px' }}
            >
              Test Registration
            </button>
            
            <button 
              onClick={testLogin}
              disabled={isLoading}
              className="btn-secondary"
              style={{ fontSize: '12px' }}
            >
              Test Login
            </button>
            
            <button 
              onClick={testOTPResend}
              disabled={isLoading}
              className="btn-secondary"
              style={{ fontSize: '12px' }}
            >
              Test OTP Resend
            </button>
            
            <button 
              onClick={testOTPVerify}
              disabled={isLoading}
              className="btn-secondary"
              style={{ fontSize: '12px' }}
            >
              Test OTP Verify
            </button>
            
            <button 
              onClick={clearResults}
              disabled={isLoading}
              className="btn-secondary"
              style={{ fontSize: '12px', backgroundColor: '#666' }}
            >
              Clear Results
            </button>
          </div>
        </div>

        <div>
          <h3>Test Results</h3>
          <div style={{ 
            background: '#f5f5f5', 
            padding: '15px', 
            borderRadius: '4px', 
            fontSize: '12px',
            overflow: 'auto',
            maxHeight: '400px',
            fontFamily: 'monospace'
          }}>
            {testResults.length === 0 ? (
              <p>No test results yet. Click a test button above to start testing.</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} style={{ 
                  marginBottom: '15px', 
                  padding: '10px', 
                  background: result.result.success ? '#e8f5e8' : '#ffe8e8',
                  borderRadius: '4px',
                  border: `1px solid ${result.result.success ? '#4caf50' : '#f44336'}`
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                    {result.test} - {result.result.success ? '✅ SUCCESS' : '❌ FAILED'}
                  </div>
                  <div style={{ fontSize: '10px', color: '#666', marginBottom: '5px' }}>
                    {result.timestamp}
                  </div>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(result.result, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ApiTestModal