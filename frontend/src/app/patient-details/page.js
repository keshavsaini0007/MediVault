'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'
import Link from 'next/link'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1'

export default function PatientDetails() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('medications')
  const [showSMS, setShowSMS] = useState(false)
  const [smsMsg, setSmsMsg] = useState('')
  const [doctorReports, setDoctorReports] = useState([])
  const [reportsLoading, setReportsLoading] = useState(false)
  const [reportsError, setReportsError] = useState('')

  const patientId = searchParams.get('patientId')

  useEffect(() => {
    const fetchDoctorReports = async () => {
      if (activeTab !== 'reports' || !patientId) {
        return
      }

      try {
        setReportsError('')
        setReportsLoading(true)

        const token = localStorage.getItem('token') || localStorage.getItem('medivault-token')
        if (!token) {
          setReportsError('Doctor token not found in localStorage.')
          return
        }

        const response = await fetch(`${API_BASE}/doctor/patients/${patientId}/reports`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.message || 'Failed to load reports.')
        }

        setDoctorReports(data.reports || [])
      } catch (error) {
        setReportsError(error.message || 'Failed to load reports.')
      } finally {
        setReportsLoading(false)
      }
    }

    fetchDoctorReports()
  }, [activeTab, patientId])

  return (
    <div>
      <Sidebar role="doctor" userName="Dr. Sharma" userInitial="DS" />
      <div className="app-layout">
        <Navbar
          title="Patient Details"
          subtitle="Rahul Singh — Dengue"
          actions={
            <Link href="/doctor-dashboard">
              <button className="btn btn-outline btn-sm">← Back to Dashboard</button>
            </Link>
          }
        />
        <main className="page-content">

          {/* Patient Header */}
          <div className="card animate-in" style={{ marginBottom: 20 }}>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-soft), var(--primary-light))', display: 'grid', placeItems: 'center', fontSize: 28, fontWeight: 800, color: 'white', border: '3px solid var(--primary)', flexShrink: 0 }}>
                  RS
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--gray-900)', letterSpacing: '-0.5px' }}>Rahul Singh</h2>
                    <span className="badge badge-danger">Critical</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>Age: <strong style={{ color: 'var(--gray-700)' }}>32</strong></span>
                    <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>Condition: <strong style={{ color: 'var(--danger)' }}>Dengue</strong></span>
                    <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>Blood Type: <strong style={{ color: 'var(--gray-700)' }}>O+</strong></span>
                    <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>Doctor: <strong style={{ color: 'var(--primary)' }}>Dr. Meera Kapoor</strong></span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-success" onClick={() => alert('Calling patient...')}>
                    📞 Call Patient
                  </button>
                  <button className="btn btn-primary" onClick={() => setShowSMS(true)}>
                    ✉️ Send SMS
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SMS Modal */}
          {showSMS && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 1000 }}>
              <div className="card" style={{ width: 420, boxShadow: 'var(--shadow-lg)' }}>
                <div className="card-header">
                  <span className="card-title">📱 Send SMS to Rahul Singh</span>
                  <button className="icon-btn" onClick={() => setShowSMS(false)}>✕</button>
                </div>
                <div className="card-body">
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input className="form-control" value="+91 98765 43210" readOnly />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Message</label>
                    <textarea className="form-control" rows={4} placeholder="Type your message here..." value={smsMsg} onChange={e => setSmsMsg(e.target.value)} style={{ resize: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button className="btn btn-outline" onClick={() => setShowSMS(false)}>Cancel</button>
                    <button className="btn btn-primary" onClick={() => { alert('SMS sent via Twilio!'); setShowSMS(false); }}>
                      🚀 Send via Twilio
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid-sidebar animate-in" style={{ animationDelay: '0.05s' }}>
            {/* Main Content */}
            <div>
              {/* Tabs */}
              <div className="tabs">
                {['medications', 'reports', 'symptoms', 'timeline'].map(tab => (
                  <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {activeTab === 'medications' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Adherence Summary */}
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">📊 Medication Adherence</span>
                      <span className="badge badge-success" style={{ fontSize: 13, padding: '4px 12px' }}>92% Overall</span>
                    </div>
                    <div className="card-body">
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                        <div style={{ padding: 16, background: 'var(--success-soft)', borderRadius: 'var(--radius-md)', border: '1px solid #BBF7D0' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Streak</div>
                          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--success)', marginTop: 4 }}>7 Days 🔥</div>
                        </div>
                        <div style={{ padding: 16, background: 'var(--primary-soft)', borderRadius: 'var(--radius-md)', border: '1px solid #BFDBFE' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Adherence Rate</div>
                          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)', marginTop: 4 }}>92%</div>
                        </div>
                      </div>

                      {[
                        { name: 'Paracetamol 500mg', freq: 'Twice daily', adherence: 95, status: 'taken' },
                        { name: 'Vitamin C', freq: 'Once daily', adherence: 90, status: 'taken' },
                        { name: 'Antibiotic', freq: 'Thrice daily', adherence: 88, status: 'missed' },
                      ].map((med, i) => (
                        <div key={i} style={{ padding: '14px 0', borderBottom: i < 2 ? '1px solid var(--gray-100)' : 'none' }}>
                          <div className="flex-between" style={{ marginBottom: 8 }}>
                            <div className="flex flex-center gap-2">
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: med.status === 'taken' ? 'var(--success)' : 'var(--danger)', display: 'block' }} />
                              <span style={{ fontWeight: 600, fontSize: 14 }}>{med.name}</span>
                              <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>{med.freq}</span>
                            </div>
                            <div className="flex flex-center gap-2">
                              <span className={`badge ${med.status === 'taken' ? 'badge-success' : 'badge-danger'}`}>
                                {med.status === 'taken' ? '✓ Taken' : '✗ Missed'}
                              </span>
                              <span style={{ fontSize: 13, fontWeight: 700 }}>{med.adherence}%</span>
                            </div>
                          </div>
                          <div className="progress-bar">
                            <div className={`progress-fill ${med.adherence >= 90 ? 'success' : 'danger'}`} style={{ width: `${med.adherence}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'reports' && (
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">📋 Latest Reports</span>
                  </div>
                  <div className="card-body">
                    {!patientId && (
                      <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                        Open this page with <strong>?patientId=&lt;id&gt;</strong> to load patient reports.
                      </div>
                    )}

                    {reportsLoading && (
                      <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>Loading reports...</div>
                    )}

                    {reportsError && (
                      <div style={{ fontSize: 12, color: 'var(--danger)' }}>{reportsError}</div>
                    )}

                    {!reportsLoading && !reportsError && patientId && doctorReports.length === 0 && (
                      <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>No uploaded reports found for this patient.</div>
                    )}

                    {doctorReports.map((r, i) => (
                      <div key={r._id} style={{ padding: '16px 0', borderBottom: i < doctorReports.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
                        <div className="flex-between" style={{ marginBottom: 8 }}>
                          <div className="flex flex-center gap-3">
                            <span style={{ fontSize: 24 }}>📁</span>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14 }}>{r.originalName}</div>
                              <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                                Uploaded on {new Date(r.createdAt).toLocaleString()} · {r.reportType}
                              </div>
                            </div>
                          </div>
                          <a href={r.fileUrl} target="_blank" rel="noreferrer">
                            <button className="btn btn-primary btn-sm" type="button">View</button>
                          </a>
                        </div>
                        <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', borderLeft: '3px solid var(--primary)' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>Report Type</div>
                          <div style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6 }}>{r.reportType}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'symptoms' && (
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">🩺 Reported Symptoms</span>
                  </div>
                  <div className="card-body">
                    {[
                      { symptom: 'High Fever (104°F)', date: 'Mar 14, 2026', severity: 'High' },
                      { symptom: 'Severe Headache', date: 'Mar 13, 2026', severity: 'Medium' },
                      { symptom: 'Body Aches', date: 'Mar 12, 2026', severity: 'Medium' },
                      { symptom: 'Nausea', date: 'Mar 11, 2026', severity: 'Low' },
                    ].map((s, i) => (
                      <div key={i} className="alert-item" style={{ marginBottom: 8 }}>
                        <span style={{ fontSize: 18 }}>🌡️</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{s.symptom}</div>
                          <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{s.date}</div>
                        </div>
                        <span className={`badge ${s.severity === 'High' ? 'badge-danger' : s.severity === 'Medium' ? 'badge-warning' : 'badge-primary'}`}>
                          {s.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'timeline' && (
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">📅 Health Timeline</span>
                  </div>
                  <div className="card-body">
                    {[
                      { date: 'Mar 14', event: 'High Fever reported', type: 'symptom', icon: '🌡️' },
                      { date: 'Mar 12', event: 'Blood Test uploaded — Dengue NS1 Positive', type: 'report', icon: '🔬' },
                      { date: 'Mar 10', event: 'Treatment started: Paracetamol + IV Fluids', type: 'medicine', icon: '💊' },
                      { date: 'Mar 8', event: 'Patient registered on MediVault', type: 'system', icon: '✅' },
                    ].map((t, i) => (
                      <div key={i} style={{ display: 'flex', gap: 14, paddingBottom: 20, position: 'relative' }}>
                        {i < 3 && <div style={{ position: 'absolute', left: 16, top: 32, width: 2, height: 'calc(100% - 16px)', background: 'var(--gray-200)' }} />}
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-soft)', display: 'grid', placeItems: 'center', fontSize: 16, flexShrink: 0, zIndex: 1 }}>
                          {t.icon}
                        </div>
                        <div style={{ flex: 1, paddingTop: 4 }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{t.event}</div>
                          <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>{t.date}, 2026</div>
                        </div>
                        <span className="badge badge-primary">{t.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Recovery Progress */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">📈 Recovery Progress</span>
                </div>
                <div className="card-body">
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 70, marginBottom: 8 }}>
                    {[2, 3, 3, 4, 4, 5, 6].map((v, i) => (
                      <div key={i} style={{ flex: 1, height: `${v * 12}%`, background: i === 6 ? 'var(--success)' : 'var(--success-soft)', borderRadius: '3px 3px 0 0', maxHeight: '100%' }} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    {['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'].map(d => (
                      <span key={d} style={{ fontSize: 9, color: 'var(--gray-400)', flex: 1, textAlign: 'center' }}>{d}</span>
                    ))}
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>Recovery rate</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--success)' }}>Improving ↑</span>
                  </div>
                </div>
              </div>

              {/* Patient Info */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">ℹ️ Patient Info</span>
                </div>
                <div className="card-body">
                  {[
                    { label: 'Blood Type', value: 'O+' },
                    { label: 'Allergies', value: 'Penicillin' },
                    { label: 'Phone', value: '+91 98765 43210' },
                    { label: 'Admitted', value: 'Mar 10, 2026' },
                    { label: 'Emergency Contact', value: 'Amit (Brother)' },
                  ].map((info, i) => (
                    <div key={i} className="flex-between" style={{ padding: '8px 0', borderBottom: i < 4 ? '1px solid var(--gray-100)' : 'none' }}>
                      <span style={{ fontSize: 12, color: 'var(--gray-500)', fontWeight: 500 }}>{info.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-700)' }}>{info.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Observation */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">✏️ Add Observation</span>
                </div>
                <div className="card-body">
                  <div className="form-group">
                    <label className="form-label">Diagnosis Note</label>
                    <textarea className="form-control" rows={3} placeholder="Enter your observation..." style={{ resize: 'none' }} />
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Save Observation</button>
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
