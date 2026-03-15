'use client'
import { useEffect, useRef, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1'

const formatSize = (size = 0) => {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(2)} MB`
}

export default function Reports() {
  const [reports, setReports] = useState([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [selectedType, setSelectedType] = useState('X-Ray')
  const [selectedFile, setSelectedFile] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const inputRef = useRef(null)

  const getToken = () => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem('token') || localStorage.getItem('medivault-token') || ''
  }

  const loadReports = async () => {
    try {
      setError('')
      const token = getToken()
      if (!token) {
        setError('Please login first. Token not found in localStorage.')
        return
      }

      const response = await fetch(`${API_BASE}/patient/reports`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch reports.')
      }

      setReports(data.reports || [])
    } catch (err) {
      setError(err.message || 'Failed to fetch reports.')
    }
  }

  useEffect(() => {
    loadReports()
  }, [])

  const onFileSelect = (file) => {
    if (!file) return
    setSelectedFile(file)
    setError('')
    setSuccess('')
  }

  const handleUpload = async () => {
    try {
      setError('')
      setSuccess('')

      if (!selectedFile) {
        setError('Please choose a file first.')
        return
      }

      const token = getToken()
      if (!token) {
        setError('Please login first. Token not found in localStorage.')
        return
      }

      const formData = new FormData()
      formData.append('report', selectedFile)
      formData.append('reportType', selectedType)

      setUploading(true)
      const response = await fetch(`${API_BASE}/patient/reports`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Upload failed.')
      }

      setSuccess('Report uploaded to Cloudinary successfully.')
      setSelectedFile(null)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
      await loadReports()
    } catch (err) {
      setError(err.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (reportId) => {
    try {
      setError('')
      setSuccess('')
      const token = getToken()
      if (!token) {
        setError('Please login first. Token not found in localStorage.')
        return
      }

      const response = await fetch(`${API_BASE}/patient/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Delete failed.')
      }

      setSuccess('Report deleted successfully.')
      await loadReports()
    } catch (err) {
      setError(err.message || 'Delete failed.')
    }
  }

  return (
    <div>
      <Sidebar role="patient" userName="Rahul Singh" userInitial="RS" />
      <div className="app-layout">
        <Navbar title="Reports & Tests" subtitle="Upload and manage your Cloudinary reports" />
        <main className="page-content">
          <div className="grid-sidebar animate-in">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="card">
                <div className="card-header">
                  <span className="card-title">📤 Upload Medical Report</span>
                </div>
                <div className="card-body">
                  <div className="form-group">
                    <label className="form-label">Report Type</label>
                    <select className="form-control form-select" value={selectedType} onChange={e => setSelectedType(e.target.value)}>
                      <option>X-Ray</option>
                      <option>Blood Test</option>
                      <option>MRI</option>
                      <option>CT Scan</option>
                      <option>Ultrasound</option>
                      <option>Prescription</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div
                    className="upload-zone"
                    style={{
                      borderColor: dragOver ? 'var(--primary)' : undefined,
                      background: dragOver ? 'var(--primary-soft)' : undefined,
                      cursor: 'pointer'
                    }}
                    onClick={() => inputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => {
                      e.preventDefault()
                      setDragOver(false)
                      const file = e.dataTransfer.files?.[0]
                      onFileSelect(file)
                    }}
                  >
                    <div className="upload-icon">📁</div>
                    <div className="upload-text">Drag & drop your file here</div>
                    <div className="upload-sub">Tap browse on phone to open gallery/camera (PDF, JPG, PNG, WEBP, max 10MB)</div>
                    <input
                      ref={inputRef}
                      type="file"
                      style={{ display: 'none' }}
                      accept=".pdf,.jpg,.jpeg,.png,.webp,image/*,application/pdf"
                      capture="environment"
                      onChange={e => onFileSelect(e.target.files?.[0])}
                    />
                    <button className="btn btn-outline" style={{ marginTop: 16 }} type="button">
                      Browse Files / Gallery
                    </button>
                  </div>

                  {selectedFile && (
                    <div style={{ marginTop: 12, padding: 10, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--text-muted)' }}>
                      Selected: <strong>{selectedFile.name}</strong> ({formatSize(selectedFile.size)})
                    </div>
                  )}

                  <div className="divider" />

                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={handleUpload}
                    disabled={uploading}
                  >
                    {uploading ? '⏳ Uploading to Cloudinary...' : '🚀 Upload Report'}
                  </button>

                  {error && (
                    <div style={{ marginTop: 12, padding: 10, borderRadius: 'var(--radius-sm)', background: 'var(--danger-soft)', color: 'var(--danger)', fontSize: 12 }}>
                      {error}
                    </div>
                  )}

                  {success && (
                    <div style={{ marginTop: 12, padding: 10, borderRadius: 'var(--radius-sm)', background: 'var(--success-soft)', color: 'var(--success)', fontSize: 12 }}>
                      {success}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="card animate-in" style={{ animationDelay: '0.1s' }}>
                <div className="card-header">
                  <span className="card-title">📁 My Reports</span>
                  <span className="badge badge-primary">{reports.length} reports</span>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  {reports.length === 0 && (
                    <div style={{ padding: 20, fontSize: 13, color: 'var(--text-muted)' }}>
                      No reports uploaded yet.
                    </div>
                  )}

                  {reports.map((r, i) => (
                    <div key={r._id} style={{ padding: '16px 20px', borderBottom: i < reports.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
                      <div className="flex-between" style={{ marginBottom: 8 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{r.originalName}</div>
                          <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                            {r.reportType} · {new Date(r.createdAt).toLocaleString()} · {formatSize(r.size)}
                          </div>
                        </div>
                        <div className="flex flex-center gap-2">
                          <a href={r.fileUrl} target="_blank" rel="noreferrer">
                            <button className="btn btn-primary btn-sm" type="button">View</button>
                          </a>
                          <button className="btn btn-outline btn-sm" type="button" onClick={() => handleDelete(r._id)}>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
