import React, { useState, useEffect } from 'react'
import Mapa from './components/Mapa.jsx'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'
import ExcelJS from 'exceljs'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import html2canvas from 'html2canvas'

// Configuración de Supabase
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Componente de Logo con fallback si la imagen no carga
function LogoBox({ size = 56, inner = 40, rotate = false, title = 'Frijolitos Costeños' }) {
  const [error, setError] = useState(false)
  const [idx, setIdx] = useState(0)
  const bust = typeof window !== 'undefined' ? `?t=${Math.floor(Date.now()/1000)}` : ''
  const candidates = React.useMemo(() => [
    '/frijolitos-costenos.png',
    '/frijolitos-costenos.webp',
    '/frijolitos_costenos.png',
    '/frijolitos.png',
    '/logo.png',
    '/logo.webp',
    '/logo.jpg',
    '/logo.jpeg',
  ].map(u => u + bust), [bust])

  const onError = () => {
    if (idx < candidates.length - 1) setIdx(i => i + 1)
    else setError(true)
  }

  return (
    <div style={{
      padding: '8px',
      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      borderRadius: '12px',
      boxShadow: '0 8px 16px rgba(249, 115, 22, 0.3)',
      width: `${size}px`,
      height: `${size}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transform: rotate ? 'rotate(-3deg)' : 'none',
      overflow: 'hidden'
    }} title={title}>
      {error ? (
        <span style={{
          fontSize: `${Math.max(12, Math.floor(inner * 0.45))}px`,
          fontWeight: 700,
          color: 'white',
          transform: rotate ? 'rotate(3deg)' : 'none'
        }}>
          FC
        </span>
      ) : (
        <img
          src={candidates[idx]}
          alt={title}
          onError={onError}
          style={{ width: `${inner}px`, height: `${inner}px`, objectFit: 'contain', transform: rotate ? 'rotate(3deg)' : 'none' }}
        />
      )}
    </div>
  )
}

function App() {
  const [connected, setConnected] = useState(false)
  const [testing, setTesting] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [user, setUser] = useState(null)
  const [darkMode, setDarkMode] = useState(false)

  // Restaurar sesión de Supabase al recargar y escuchar cambios de auth
  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted && session?.user) {
        setUser(session.user)
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => {
      mounted = false
      subscription?.unsubscribe?.()
    }
  }, [])

  const testConnection = async () => {
    setTesting(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
      
      setConnected(true)
      alert('Conexión a Supabase exitosa!')
    } catch (error) {
      console.error('Error:', error)
      alert('Error conectando a Supabase')
    } finally {
      setTesting(false)
    }
  }

  const createAuthSystem = () => {
    setShowLogin(true)
  }

  // Si ya está autenticado, mostrar dashboard completo
  if (user) {
    return (
      <Dashboard
        user={user}
        onLogout={async () => {
          try { await supabase.auth.signOut() } catch {}
          // Limpiar sección guardada al cerrar sesión
          try { localStorage.removeItem('activeSection') } catch {}
          setUser(null)
        }}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
    )
  }

  // Si debe mostrar login
  if (showLogin) {
    return <LoginForm onLogin={setUser} supabase={supabase} />
  }

  // Página de configuración inicial
  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fff7ed, #fef3c7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '600px' }}>
        
        {/* Logo */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <LogoBox size={56} inner={40} />
            <h1 style={{
              fontSize: '48px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #ea580c, #d97706)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0
            }}>
              Frijolitos Costeños
            </h1>
          </div>
          <p style={{ fontSize: '20px', color: '#6b7280', margin: 0 }}>
            Sistema de Gestión Empresarial
          </p>
        </div>

        {/* Estado del sistema */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          padding: '32px',
          marginBottom: '32px'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>
            Estado del Sistema
          </h2>
          
          <div style={{ display: 'grid', gap: '16px' }}>
            {/* Vite + React */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px',
              background: '#f0fdf4',
              borderRadius: '8px',
              borderLeft: '4px solid #10b981'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#10b981', fontSize: '20px' }}>✅</span>
                <span style={{ fontWeight: '500' }}>Vite + React</span>
              </div>
              <span style={{ color: '#10b981', fontSize: '14px', fontWeight: '500' }}>
                Funcionando
              </span>
            </div>

            {/* Supabase */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px',
              background: connected ? '#f0fdf4' : '#fefce8',
              borderRadius: '8px',
              borderLeft: `4px solid ${connected ? '#10b981' : '#f59e0b'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ 
                  color: connected ? '#10b981' : '#f59e0b', 
                  fontSize: '20px' 
                }}>
                  {connected ? '✅' : '⏳'}
                </span>
                <span style={{ fontWeight: '500' }}>Supabase DB</span>
              </div>
              {!connected ? (
                <button
                  onClick={testConnection}
                  disabled={testing}
                  style={{
                    background: 'linear-gradient(135deg, #f97316, #ea580c)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: testing ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    opacity: testing ? 0.7 : 1
                  }}
                >
                  {testing ? 'Conectando...' : 'Conectar'}
                </button>
              ) : (
                <span style={{ color: '#10b981', fontSize: '14px', fontWeight: '500' }}>
                  Conectado
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Funcionalidades del sistema */}
        <div style={{
          background: 'linear-gradient(135deg, #fff7ed, #fef3c7)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #fed7aa'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
            Funcionalidades del Sistema
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '12px',
            fontSize: '14px',
            textAlign: 'left',
            marginBottom: '20px'
          }}>
            <div>🔐 Sistema de login/registro</div>
            <div>📊 Dashboard con graficos</div>
            <div>📁 Subida de archivos Excel</div>
            <div>📈 Analisis de unidades</div>
            <div>🏢 Gestión por ciudades</div>
            <div>🌙 Modo oscuro</div>
          </div>

          {connected && (
            <div style={{ marginTop: '20px' }}>
              <button
                onClick={createAuthSystem}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '500'
                }}
              >
                🚀 Crear Sistema Completo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Dashboard completo con sidebar
function Dashboard({ user, onLogout, darkMode, setDarkMode }) {
  const [activeSection, setActiveSection] = useState(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : ''
      const hash = raw.replace(/^\/+/, '') // soporta '#/upload' y '#upload'
      // Remapear 'dashboard' a 'analytics' por eliminación del dashboard
      const initial = hash || localStorage.getItem('activeSection') || 'analytics'
      return initial === 'dashboard' ? 'analytics' : initial
    } catch {
      return 'analytics'
    }
  })
  const [datos, setDatos] = useState([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    totalVentas: 0,
    totalRegistros: 0,
    ciudades: 0,
    negocios: 0
  })

  // Sincronizar sección activa con localStorage y hash para persistencia
  useEffect(() => {
    try {
      localStorage.setItem('activeSection', activeSection)
      if (typeof window !== 'undefined') {
        window.location.hash = `/${activeSection}` // escribe con slash para consistencia
      }
    } catch {}
  }, [activeSection])

  // Cargar datos del usuario
  const cargarDatos = async () => {
    try {
      const { data: datosUsuario, error } = await supabase
        .from('datos_emprendimiento')
        .select('*')
        .eq('usuario_id', user.id)
        .order('fecha', { ascending: false })
      
      if (error) throw error
      
      setDatos(datosUsuario || [])
      
      // Calcular estadísticas
      const totalVentas = datosUsuario?.reduce((sum, item) => sum + (item.venta || 0), 0) || 0
      const ciudadesUnicas = new Set(datosUsuario?.map(item => item.ciudad).filter(Boolean)).size
      const negociosUnicos = new Set(datosUsuario?.map(item => item.negocio).filter(Boolean)).size
      
      setStats({
        totalVentas,
        totalRegistros: datosUsuario?.length || 0,
        ciudades: ciudadesUnicas,
        negocios: negociosUnicos
      })
    } catch (error) {
      console.error('Error cargando datos:', error)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [user.id])

  const theme = {
    bg: darkMode ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    cardBg: darkMode ? 
      'linear-gradient(145deg, #1e293b 0%, #334155 100%)' : 
      'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
    text: darkMode ? '#f1f5f9' : '#1f2937',
    textSecondary: darkMode ? '#94a3b8' : '#6b7280',
    border: darkMode ? 'rgba(148, 163, 184, 0.2)' : 'rgba(0, 0, 0, 0.1)',
    sidebarBg: darkMode ? 
      'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)' : 
      'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
    shadow: darkMode ? 
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)' : 
      '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
    shadowHover: darkMode ? 
      '0 35px 60px -12px rgba(0, 0, 0, 0.4)' : 
      '0 35px 60px -12px rgba(0, 0, 0, 0.15)'
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: theme.bg,
      color: theme.text,
      display: 'flex'
    }}>
      {/* Sidebar */}
      <div style={{
        width: '280px',
        background: theme.sidebarBg,
        borderRight: `1px solid ${theme.border}`,
        padding: '24px',
        boxShadow: theme.shadow,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Elemento decorativo de fondo */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-50%',
          width: '200px',
          height: '200px',
          background: darkMode ? 
            'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)' :
            'radial-gradient(circle, rgba(249, 115, 22, 0.05) 0%, transparent 70%)',
          borderRadius: '50%',
          zIndex: 0
        }} />
        
        {/* Logo */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          marginBottom: '40px',
          paddingBottom: '24px',
          borderBottom: `1px solid ${theme.border}`,
          position: 'relative',
          zIndex: 1
        }}>
          <LogoBox size={44} inner={28} rotate />
          <div>
            <h2 style={{ 
              margin: 0, 
              fontSize: '18px', 
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Frijolitos Costeños
            </h2>
            <p style={{ 
              margin: 0, 
              fontSize: '12px', 
              color: theme.textSecondary,
              fontWeight: '500'
            }}>
              Sistema de Gestión
            </p>
          </div>
        </div>

        {/* Navegación */}
        <nav style={{ marginBottom: '40px', position: 'relative', zIndex: 1 }}>
          {[
            { id: 'analytics', label: '📈 Analisis', icon: '', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
            { id: 'upload', label: 'Subir Excel', icon: '📁', gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' },
            { id: 'datos', label: 'Ver Datos', icon: '📋', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 20px',
                marginBottom: '8px',
                background: activeSection === item.id 
                  ? item.gradient
                  : 'transparent',
                color: activeSection === item.id ? 'white' : theme.text,
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: activeSection === item.id ? 'translateX(4px)' : 'translateX(0)',
                boxShadow: activeSection === item.id ? 
                  '0 8px 25px rgba(0, 0, 0, 0.15)' : 
                  '0 2px 4px rgba(0, 0, 0, 0)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                if (activeSection !== item.id) {
                  e.target.style.background = darkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                  e.target.style.transform = 'translateX(2px)'
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== item.id) {
                  e.target.style.background = 'transparent'
                  e.target.style.transform = 'translateX(0)'
                }
              }}
            >
              <span style={{ fontSize: '18px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>
                {item.icon}
              </span>
              {item.label}
              {activeSection === item.id && (
                <div style={{
                  position: 'absolute',
                  right: '16px',
                  width: '4px',
                  height: '4px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite'
                }} />
              )}
            </button>
          ))}
        </nav>

        {/* Usuario y configuración */}
        <div style={{
          paddingTop: '24px',
          borderTop: `1px solid ${theme.border}`,
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{ 
            marginBottom: '20px',
            padding: '16px',
            background: darkMode ? 'rgba(148, 163, 184, 0.05)' : 'rgba(0, 0, 0, 0.03)',
            borderRadius: '12px',
            border: `1px solid ${theme.border}`
          }}>
            <p style={{ margin: 0, fontSize: '12px', color: theme.textSecondary, marginBottom: '4px' }}>
              Conectado como:
            </p>
            <p style={{ 
              margin: 0, 
              fontSize: '14px', 
              fontWeight: '600',
              color: theme.text,
              wordBreak: 'break-all'
            }}>
              {user.email}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setDarkMode(!darkMode)}
              style={{
                padding: '12px',
                background: theme.cardBg,
                border: `1px solid ${theme.border}`,
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '18px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: 'scale(1)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.1) rotate(15deg)'
                e.target.style.boxShadow = '0 8px 12px rgba(0, 0, 0, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1) rotate(0deg)'
                e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            
            <button
              onClick={onLogout}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 4px 6px rgba(239, 68, 68, 0.3)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 8px 12px rgba(239, 68, 68, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 4px 6px rgba(239, 68, 68, 0.3)'
              }}
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div style={{ 
        flex: 1, 
        padding: '24px',
        background: theme.bg,
        minHeight: '100vh',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {activeSection === 'upload' && (
          <UploadContent onUploadComplete={cargarDatos} userId={user.id} theme={theme} />
        )}
        {activeSection === 'datos' && (
          <DataContent datos={datos} onRefresh={cargarDatos} theme={theme} />
        )}
        {activeSection === 'analytics' && (
          <AnalyticsContent datos={datos} theme={theme} />
        )}
      </div>
    </div>
  )
}

// Componente de subida de Excel
function UploadContent({ onUploadComplete, userId, theme }) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  // Ruta pública del archivo de plantilla proporcionado por el usuario
  const TEMPLATE_URL = '/plantillas/Plantilla_Frijolitos_Tabla.xlsx'

  const descargarPlantilla = () => {
    // Definir encabezados y una fila de ejemplo opcional
    const headers = [
      'Vendedor-usuario',
      'Ciudad',
      'Negocio',
      'Presentacion',
      'Venta',
      'Fecha'
    ]

    const ejemplo = [{
      'Vendedor-usuario': 'Juan Pérez',
      'Ciudad': 'La Ceiba',
      'Negocio': 'Tienda',
      'Presentacion': '500g',
      'Venta': 1200,
      'Fecha': new Date().toISOString().split('T')[0]
    }]

    // Crear hoja con encabezados y ejemplo
    const worksheet = XLSX.utils.json_to_sheet(ejemplo, { header: headers })
    // Forzar ancho de columnas legible
    const colWidths = headers.map(() => ({ wch: 18 }))
    worksheet['!cols'] = colWidths

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla')

    XLSX.writeFile(workbook, 'plantilla-frijolitos.xlsx')
  }

  const handleFileSelect = (event) => {
    const file = event.target.files && event.target.files[0]
    setSelectedFile(file || null)
  }

  const handleFileUpload = async (file) => {
    if (!file) return

    setUploading(true)
    setProgress('Leyendo archivo...')

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
          setSelectedFile(null)
          try { const el = document.getElementById('file-input'); if (el) el.value = '' } catch {}
        try {
          setProgress('Procesando datos...')
          
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)

          setProgress('Guardando en base de datos...')

          // Helpers para normalizar claves y extraer valores con múltiples variantes
          const normalize = (s) => {
            if (s == null) return ''
            return String(s)
              .normalize('NFD') // separa acentos
              .replace(/[\u0300-\u036f]/g, '') // quita acentos
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '_') // espacios, guiones, etc. a _
              .replace(/^_+|_+$/g, '') // recorta _
          }

          const getField = (row, variants) => {
            const want = new Set(variants.map(normalize))
            for (const key of Object.keys(row)) {
              if (want.has(normalize(key))) return row[key]
            }
            return undefined
          }

          const parseNumber = (val) => {
            if (val == null || val === '') return 0
            if (typeof val === 'number') return val
            let s = String(val).trim()
            // elimina símbolos de moneda y espacios
            s = s.replace(/[^0-9,.-]/g, '')
            const commaCount = (s.match(/,/g) || []).length
            const dotCount = (s.match(/\./g) || []).length
            if (commaCount > 0 && dotCount === 0) {
              // formato 1.234,56 o 123,45 (usando coma decimal)
              s = s.replace(/\./g, '')
              s = s.replace(/,/g, '.')
            } else {
              // formato 1,234.56 (coma miles, punto decimal)
              s = s.replace(/,/g, '')
            }
            const n = parseFloat(s)
            return isNaN(n) ? 0 : n
          }

          const toYMD = (val) => {
            if (!val && val !== 0) return new Date().toISOString().split('T')[0]
            if (val instanceof Date) return val.toISOString().split('T')[0]
            if (typeof val === 'number' && XLSX?.SSF?.parse_date_code) {
              const d = XLSX.SSF.parse_date_code(val)
              if (d) {
                const js = new Date(Date.UTC(d.y, d.m - 1, d.d))
                return js.toISOString().split('T')[0]
              }
            }
            // intentar parsear string
            const dt = new Date(val)
            if (!isNaN(dt.getTime())) return dt.toISOString().split('T')[0]
            return new Date().toISOString().split('T')[0]
          }

          // Mapear datos del Excel a nuestro formato aceptando variantes de encabezados
          const datosParaGuardar = jsonData.map(row => {
            const cliente = getField(row, [
              // Preferir variantes de Vendedor
              'Vendedor-usuario', 'Vendedor Usuario', 'Vendedor_usuario', 'Vendedor', 'vendedor',
              // Compatibilidad hacia atrás con Cliente
              'Cliente-usuario', 'Cliente Usuario', 'Cliente_usuario', 'Cliente', 'cliente'
            ]) || ''
            const ciudad = getField(row, ['Ciudad', 'Municipio', 'City']) || ''
            const negocio = getField(row, ['Negocio', 'Tipo de Negocio', 'Giro', 'Negocios']) || ''
            const presentacion = getField(row, ['Presentacion', 'Presentación', 'Presentaciones']) || ''
            const ventaRaw = getField(row, ['Venta', 'Ventas', 'Monto', 'Monto Venta', 'Valor', 'Total']) || 0
            const fechaRaw = getField(row, ['Fecha', 'Fecha Venta', 'Fecha de Venta', 'fecha'])

            return {
              cliente_usuario: cliente,
              ciudad,
              negocio,
              presentacion,
              venta: parseNumber(ventaRaw),
              fecha: toYMD(fechaRaw),
              usuario_id: userId,
              archivo_origen: file.name
            }
          })

          // Guardar en Supabase
          const { data: insertedData, error } = await supabase
            .from('datos_emprendimiento')
            .insert(datosParaGuardar)

          if (error) throw error

          setProgress('¡Completado!')
          alert(`Se procesaron ${datosParaGuardar.length} registros exitosamente`)
          onUploadComplete()
          
        } catch (error) {
          console.error('Error procesando archivo:', error)
          alert('Error procesando el archivo: ' + error.message)
        } finally {
          setUploading(false)
          setProgress('')
        }
      }
      
      reader.readAsArrayBuffer(file)
      
    } catch (error) {
      console.error('Error:', error)
      alert('Error subiendo archivo: ' + error.message)
      setUploading(false)
      setProgress('')
    }
  }
  
  const confirmAndUpload = async () => {
    if (!selectedFile) {
      alert('Primero selecciona un archivo')
      return
    }
    const ok = confirm(`¿Deseas subir y procesar el archivo "${selectedFile.name}"?`)
    if (!ok) return
    await handleFileUpload(selectedFile)
  }

  const clearSelectedFile = () => {
    setSelectedFile(null)
    try { const el = document.getElementById('file-input'); if (el) el.value = '' } catch {}
  }

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>
        Subir Archivo Excel
      </h1>

      <div style={{
        background: theme.cardBg,
        borderRadius: '12px',
        border: `1px solid ${theme.border}`,
        padding: '32px',
        textAlign: 'center',
        maxWidth: '600px'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>📁</div>
        
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
          Sube tu archivo Excel
        </h3>
        
        <p style={{ color: theme.textSecondary, marginBottom: '24px' }}>
          Formatos soportados: .xlsx, .xls
          <br />
          Columnas esperadas: Vendedor-usuario, Ciudad, Negocio, Presentacion, Venta, Fecha
        </p>

        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          disabled={uploading}
          style={{ display: 'none' }}
          id="file-input"
        />

        <div className="flex items-center gap-8 mt-12">
          <label
            htmlFor="file-input"
            className="btn btn-warning"
            style={{ pointerEvents: uploading ? 'none' : 'auto', opacity: uploading ? 0.6 : 1 }}
          >
            {uploading ? 'Procesando...' : 'Seleccionar Archivo'}
          </label>
          <button
            onClick={clearSelectedFile}
            disabled={uploading || !selectedFile}
            className="btn btn-danger"
          >
            🗑️ Borrar documento
          </button>
          <button
            onClick={confirmAndUpload}
            disabled={uploading || !selectedFile}
            className="btn btn-success"
          >
            ✅ Confirmar y Subir
          </button>
        </div>
        {selectedFile && (
          <div className="small" style={{ marginTop: '8px' }}>
            Seleccionado: {selectedFile.name}
          </div>
        )}

        {/* Descargar plantilla con evitación de caché (usa el archivo real en /public/plantillas) */}
        <div style={{ marginTop: '12px' }}>
          <button
            onClick={() => {
              const ts = Date.now()
              const link = document.createElement('a')
              link.href = `${TEMPLATE_URL}?t=${ts}`
              link.download = TEMPLATE_URL.split('/').pop() || 'plantilla.xlsx'
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
            }}
            style={{
              padding: '10px 18px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            ⬇️ Descargar Plantilla
          </button>
          <div style={{ marginTop: '6px', fontSize: '12px', color: theme.textSecondary }}>
            Archivo: {TEMPLATE_URL.split('/').pop()}
          </div>
        </div>

        {progress && (
          <div style={{ 
            marginTop: '20px',
            padding: '12px',
            background: theme.bg,
            borderRadius: '6px',
            fontSize: '14px',
            color: theme.textSecondary
          }}>
            {progress}
          </div>
        )}
      </div>
    </div>
  )
}

// Componente para ver datos con filtros
function DataContent({ datos, onRefresh, theme }) {
  const [filtros, setFiltros] = useState({
    ciudad: '',
    negocio: '',
    ventaMin: '',
    ventaMax: ''
  })
  const [archivoSeleccionado, setArchivoSeleccionado] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState({ campo: 'fecha', dir: 'desc' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Obtener valores únicos para los filtros
  const ciudadesUnicas = [...new Set(datos.map(item => item.ciudad).filter(Boolean))].sort()
  const negociosUnicos = [...new Set(datos.map(item => item.negocio).filter(Boolean))].sort()

  // Aplicar filtros (sin filtros por fecha)
  const datosFiltrados = datos.filter(item => {
    const cumpleCiudad = !filtros.ciudad || item.ciudad === filtros.ciudad
    const cumpleNegocio = !filtros.negocio || item.negocio === filtros.negocio
    
    const venta = parseFloat(item.venta) || 0
    const cumpleVentaMin = !filtros.ventaMin || venta >= parseFloat(filtros.ventaMin)
    const cumpleVentaMax = !filtros.ventaMax || venta <= parseFloat(filtros.ventaMax)
    const cumpleArchivo = !archivoSeleccionado || item.archivo_origen === archivoSeleccionado

    const texto = (busqueda || '').toLowerCase()
    const cumpleBusqueda = !texto || [
      item.cliente_usuario,
      item.ciudad,
      item.negocio,
      item.presentacion
    ].some(v => String(v || '').toLowerCase().includes(texto))

    return cumpleCiudad && cumpleNegocio && cumpleVentaMin && cumpleVentaMax && cumpleArchivo && cumpleBusqueda
  })

  // Ordenamiento
  const datosOrdenados = [...datosFiltrados].sort((a, b) => {
    const dir = orden.dir === 'asc' ? 1 : -1
    const valA = orden.campo === 'fecha' ? (a.fecha ? new Date(a.fecha).getTime() : 0) :
                 orden.campo === 'venta' ? (parseFloat(a.venta) || 0) :
                 String(a[orden.campo] || '').toLowerCase()
    const valB = orden.campo === 'fecha' ? (b.fecha ? new Date(b.fecha).getTime() : 0) :
                 orden.campo === 'venta' ? (parseFloat(b.venta) || 0) :
                 String(b[orden.campo] || '').toLowerCase()
    if (valA < valB) return -1 * dir
    if (valA > valB) return 1 * dir
    return 0
  })

  // Paginación
  const total = datosOrdenados.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, totalPages)
  const inicio = (currentPage - 1) * pageSize
  const pagina = datosOrdenados.slice(inicio, inicio + pageSize)

  const cambiarOrden = (campo) => {
    setOrden(prev => prev.campo === campo ? { campo, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { campo, dir: 'asc' })
  }

  // Agrupar por archivo_origen y obtener fecha más reciente por archivo
  const archivos = Object.values(
    datos.reduce((acc, item) => {
      const key = item.archivo_origen || 'Sin archivo'
      const fecha = item.fecha ? new Date(item.fecha) : null
      if (!acc[key]) acc[key] = { archivo: key, count: 0, ultimaFecha: null }
      acc[key].count += 1
      if (fecha && (!acc[key].ultimaFecha || fecha > acc[key].ultimaFecha)) acc[key].ultimaFecha = fecha
      return acc
    }, {})
  ).sort((a, b) => (b.ultimaFecha?.getTime() || 0) - (a.ultimaFecha?.getTime() || 0))

  const eliminarRegistro = async (rowId) => {
    if (!confirm('¿Seguro que deseas eliminar este registro?')) return
    try {
      const { error } = await supabase
        .from('datos_emprendimiento')
        .delete()
        .eq('id', rowId)
      if (error) throw error
      onRefresh()
    } catch (e) {
      alert('No se pudo eliminar: ' + e.message)
    }
  }

  // Eliminar en bloque todos los registros filtrados que tengan ID
  const eliminarRegistrosFiltrados = async () => {
    const ids = datosFiltrados.map(r => r.id).filter(Boolean)
    const totalFiltrados = datosFiltrados.length
    if (totalFiltrados === 0) {
      alert('No hay registros filtrados para eliminar')
      return
    }
    if (ids.length === 0) {
      alert('No hay registros con ID para eliminar en el conjunto filtrado')
      return
    }
    const confirma = confirm(`Vas a eliminar ${ids.length} de ${totalFiltrados} registros filtrados. Esta acción no se puede deshacer. ¿Continuar?`)
    if (!confirma) return
    try {
      const { error } = await supabase
        .from('datos_emprendimiento')
        .delete()
        .in('id', ids)
      if (error) throw error
      onRefresh()
      setPage(1)
    } catch (e) {
      alert('No se pudieron eliminar los registros: ' + e.message)
    }
  }

  const limpiarFiltros = () => {
    setFiltros({
      ciudad: '',
      negocio: '',
      ventaMin: '',
      ventaMax: ''
    })
  }

  const exportarDatos = (formato) => {
    if (datosFiltrados.length === 0) {
      alert('No hay datos para exportar')
      return
    }

    // Preparar datos para exportar
    const toYMD = (val) => {
      if (!val && val !== 0) return ''
      if (val instanceof Date) return val.toISOString().split('T')[0]
      const dt = new Date(val)
      return isNaN(dt.getTime()) ? '' : dt.toISOString().split('T')[0]
    }
    // Usar los mismos encabezados de la plantilla
    const headers = ['Vendedor-usuario', 'Ciudad', 'Negocio', 'Presentacion', 'Venta', 'Fecha']
    const datosExport = datosFiltrados.map(item => ({
      'Vendedor-usuario': item.cliente_usuario || '',
      'Ciudad': item.ciudad || '',
      'Negocio': item.negocio || '',
      'Presentacion': item.presentacion || '',
      'Venta': item.venta || 0,
      'Fecha': toYMD(item.fecha)
    }))

    const fecha = new Date().toISOString().split('T')[0]
    const nombreArchivo = `frijolitos-datos-${fecha}`

    if (formato === 'excel') {
      // Exportar con estilos usando ExcelJS
      const wb = new ExcelJS.Workbook()
      const ws = wb.addWorksheet('Plantilla')

      // Definir columnas con encabezados y anchos similares
      ws.columns = [
        { header: 'Vendedor-usuario', key: 'vendedor', width: 22 },
        { header: 'Ciudad', key: 'ciudad', width: 18 },
        { header: 'Negocio', key: 'negocio', width: 18 },
        { header: 'Presentacion', key: 'presentacion', width: 18 },
        { header: 'Venta', key: 'venta', width: 14 },
        { header: 'Fecha', key: 'fecha', width: 14 },
      ]

      // Estilo de encabezado
      ws.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1F2937' } // gris oscuro
        }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        }
      })

      // Agregar filas
      datosFiltrados.forEach(item => {
        ws.addRow({
          vendedor: item.cliente_usuario || '',
          ciudad: item.ciudad || '',
          negocio: item.negocio || '',
          presentacion: item.presentacion || '',
          venta: item.venta || 0,
          fecha: item.fecha ? new Date(item.fecha) : null,
        })
      })

      // Estilos de celdas
      ws.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return
        row.getCell('venta').numFmt = '#,##0'
        const fechaCell = row.getCell('fecha')
        if (fechaCell.value instanceof Date) {
          fechaCell.numFmt = 'yyyy-mm-dd'
        }
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFF3F4F6' } },
            bottom: { style: 'thin', color: { argb: 'FFF3F4F6' } },
            left: { style: 'thin', color: { argb: 'FFF3F4F6' } },
            right: { style: 'thin', color: { argb: 'FFF3F4F6' } },
          }
        })
      })

      // Descargar en el navegador
      wb.xlsx.writeBuffer().then((buffer) => {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.href = url
        link.download = `${nombreArchivo}.xlsx`
        link.click()
        URL.revokeObjectURL(url)
      })
    } else if (formato === 'csv') {
      // Exportar a CSV
      const headers = Object.keys(datosExport[0]).join(',')
      const rows = datosExport.map(row => Object.values(row).join(','))
      const csvContent = [headers, ...rows].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `${nombreArchivo}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-24">
        <h1 className="h1">Ver Datos ({total} registros)</h1>
        <div className="flex items-center gap-8">
          <input
            type="text"
            placeholder="Buscar: vendedor, ciudad, negocio, presentación"
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPage(1) }}
            className="input"
            style={{ minWidth: '260px' }}
          />
          <button
            onClick={() => exportarDatos('excel')}
            disabled={total === 0}
            className="btn btn-success"
          >
            📊 Excel
          </button>
          <button
            onClick={() => exportarDatos('csv')}
            disabled={datosFiltrados.length === 0}
            className="btn btn-warning"
          >
            📄 CSV
          </button>
          <button
            onClick={eliminarRegistrosFiltrados}
            disabled={datosFiltrados.filter(r => r.id).length === 0}
            title={`Eliminar registros filtrados`}
            className="btn btn-danger"
          >
            🗑️ Eliminar filtrados
          </button>
          <button
            onClick={onRefresh}
            className="btn btn-primary"
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      {/* Panel de archivos subidos */}
      <div className="card card-pad mb-20">
        <h3 className="h3" style={{ marginBottom: '12px' }}>Archivos de Excel Subidos</h3>
        {archivos.length === 0 ? (
          <p className="small" style={{ margin: 0 }}>No hay archivos registrados</p>
        ) : (
          <div className="flex wrap gap-8">
            {archivos.map(a => (
              <button
                key={a.archivo}
                onClick={() => setArchivoSeleccionado(a.archivo)}
                className={`chip ${archivoSeleccionado === a.archivo ? 'chip--selected' : ''}`}
                title={`Registros: ${a.count}`}
              >
                📄 {a.archivo} • {a.ultimaFecha ? a.ultimaFecha.toLocaleDateString() : 'sin fecha'}
              </button>
            ))}
            {archivoSeleccionado && (
              <button
                onClick={() => setArchivoSeleccionado('')}
                className="chip"
              >
                Limpiar selección
              </button>
            )}
          </div>
        )}
      </div>

      {/* Panel de filtros */}
      <div className="card card-pad mb-20">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="h3" style={{ margin: 0 }}>Filtros</h3>
          <button
            onClick={limpiarFiltros}
            className="btn"
            style={{ background: '#6b7280', padding: '6px 12px' }}
          >
            Limpiar
          </button>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          {/* Filtro por Ciudad */}
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500' }}>
              Ciudad
            </label>
            <select
              value={filtros.ciudad}
              onChange={(e) => setFiltros({...filtros, ciudad: e.target.value})}
              className="input" style={{ width: '100%' }}
            >
              <option value="">Todas las ciudades</option>
              {ciudadesUnicas.map(ciudad => (
                <option key={ciudad} value={ciudad}>{ciudad}</option>
              ))}
            </select>
          </div>

          {/* Filtro por Negocio */}
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500' }}>
              Negocio
            </label>
            <select
              value={filtros.negocio}
              onChange={(e) => setFiltros({...filtros, negocio: e.target.value})}
              className="input" style={{ width: '100%' }}
            >
              <option value="">Todos los negocios</option>
              {negociosUnicos.map(negocio => (
                <option key={negocio} value={negocio}>{negocio}</option>
              ))}
            </select>
          </div>

          {/* Se removieron filtros por fecha según requerimiento */}

          {/* Filtro Unidades Mínimas */}
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500' }}>
              Unidades mínimas
            </label>
            <input
              type="number"
              placeholder="0"
              value={filtros.ventaMin}
              onChange={(e) => setFiltros({...filtros, ventaMin: e.target.value})}
              className="input" style={{ width: '100%' }}
            />
          </div>

          {/* Filtro Unidades Máximas */}
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500' }}>
              Unidades máximas
            </label>
            <input
              type="number"
              placeholder="999999"
              value={filtros.ventaMax}
              onChange={(e) => setFiltros({...filtros, ventaMax: e.target.value})}
              className="input" style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>

      {/* Tabla de datos (con eliminación) */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {datosFiltrados.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px',
            color: theme.textSecondary
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>📊</div>
            <h3>No hay datos que coincidan con los filtros</h3>
            <p>Prueba ajustando los criterios de búsqueda</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th onClick={() => cambiarOrden('cliente_usuario')} style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Vendedor {orden.campo==='cliente_usuario' ? (orden.dir==='asc'?'▲':'▼') : ''}</th>
                  <th onClick={() => cambiarOrden('ciudad')} style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Ciudad {orden.campo==='ciudad' ? (orden.dir==='asc'?'▲':'▼') : ''}</th>
                  <th onClick={() => cambiarOrden('negocio')} style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Negocio {orden.campo==='negocio' ? (orden.dir==='asc'?'▲':'▼') : ''}</th>
                  <th onClick={() => cambiarOrden('presentacion')} style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Presentación {orden.campo==='presentacion' ? (orden.dir==='asc'?'▲':'▼') : ''}</th>
                  <th onClick={() => cambiarOrden('venta')} style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Unidades {orden.campo==='venta' ? (orden.dir==='asc'?'▲':'▼') : ''}</th>
                  <th onClick={() => cambiarOrden('fecha')} style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Fecha {orden.campo==='fecha' ? (orden.dir==='asc'?'▲':'▼') : ''}</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagina.map((row, index) => (
                  <tr key={row.id ?? index} style={{ borderBottom: `1px solid ${theme.border}` }}>
                    <td style={{ padding: '16px', fontSize: '14px' }}>{row.cliente_usuario || '-'}</td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>{row.ciudad || '-'}</td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>{row.negocio || '-'}</td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>{row.presentacion || '-'}</td>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600', color: '#10b981' }}>
                      {(row.venta || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>
                      {row.fecha ? new Date(row.fecha).toLocaleDateString() : '-'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button
                        onClick={() => eliminarRegistro(row.id)}
                        disabled={!row.id}
                        style={{
                          padding: '6px 10px',
                          background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: row.id ? 'pointer' : 'not-allowed', fontSize: '12px'
                        }}
                        title={!row.id ? 'Este registro no tiene ID' : 'Eliminar registro'}
                      >
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginación */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: '6px 10px', borderRadius: '6px', border: `1px solid ${theme.border}`, background: theme.cardBg, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>Anterior</button>
          <span style={{ fontSize: '12px', color: theme.textSecondary }}>Página {currentPage} de {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ padding: '6px 10px', borderRadius: '6px', border: `1px solid ${theme.border}`, background: theme.cardBg, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}>Siguiente</button>
        </div>
        <div>
          <label style={{ fontSize: '12px', color: theme.textSecondary, marginRight: '6px' }}>Filas por página</label>
          <select value={pageSize} onChange={(e) => { setPageSize(parseInt(e.target.value) || 10); setPage(1) }} style={{ padding: '6px 8px', borderRadius: '6px', border: `1px solid ${theme.border}` }}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>
    </div>
  )
}

// Componente de análisis
function AnalyticsContent({ datos, theme }) {
  const chartMesRef = React.useRef(null)
  const chartNegocioRef = React.useRef(null)
  const chartCiudadRef = React.useRef(null)
  const chartVendedoresRef = React.useRef(null)
  // Análisis por ciudad
  const ventasPorCiudad = datos.reduce((acc, item) => {
    const ciudad = item.ciudad || 'Sin especificar'
    acc[ciudad] = (acc[ciudad] || 0) + (item.venta || 0)
    return acc
  }, {})

  // Análisis por negocio
  const ventasPorNegocio = datos.reduce((acc, item) => {
    const negocio = item.negocio || 'Sin especificar'
    acc[negocio] = (acc[negocio] || 0) + (item.venta || 0)
    return acc
  }, {})

  // Datasets para graficas
  const dataCiudad = Object.entries(ventasPorCiudad).map(([name, value]) => ({ name, value }))
  const dataNegocio = Object.entries(ventasPorNegocio).map(([name, value]) => ({ name, value }))

  // Serie mensual (YYYY-MM) sin sesgo por zona horaria
  const getYearMonth = (fecha) => {
    if (!fecha) return 'Sin fecha'
    const s = String(fecha)
    const m = s.match(/^(\d{4})-(\d{2})/)
    if (m) return `${m[1]}-${m[2]}` // ya viene como YYYY-MM[-DD]
    const d = new Date(s)
    if (!isNaN(d.getTime())) {
      // Usar UTC para evitar desfaces
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`
    }
    return 'Sin fecha'
  }
  const porMes = datos.reduce((acc, item) => {
    const ym = getYearMonth(item.fecha)
    acc[ym] = (acc[ym] || 0) + (item.venta || 0)
    return acc
  }, {})
  const dataMes = Object.entries(porMes)
    .filter(([k]) => k !== 'Sin fecha')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => ({ name, value }))

  const formatYM = (ym) => {
    if (!ym || ym === 'Sin fecha') return ym
    const [y, m] = ym.split('-').map(Number)
    if (!y || !m) return ym
    const d = new Date(Date.UTC(y, m - 1, 1))
    return d.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
  }

  // Top vendedores (cliente_usuario)
  const porVendedor = datos.reduce((acc, item) => {
    const v = item.cliente_usuario || 'Sin vendedor'
    acc[v] = (acc[v] || 0) + (item.venta || 0)
    return acc
  }, {})
  const dataVendedores = Object.entries(porVendedor)
    .map(([name, value]) => ({ name, value }))
    .sort((a,b) => b.value - a.value)
    .slice(0, 10)

  const pieColors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#06b6d4']

  // KPIs principales
  const totalRegistros = datos.length
  const totalUnidades = datos.reduce((sum, item) => sum + (item.venta || 0), 0)
  const promedioPorRegistro = totalRegistros > 0 ? Math.round(totalUnidades / totalRegistros) : 0
  const ciudadesActivas = new Set(datos.map(d => d.ciudad).filter(Boolean)).size

  const exportarReporte = () => {
    if (datos.length === 0) {
      alert('No hay datos para generar reporte')
      return
    }

    // Crear reporte completo
    const reporte = []
    
    // Resumen general
  reporte.push(['REPORTE DE ANALISIS - FRIJOLITOS COSTEÑOS'])
    reporte.push(['Fecha de generación:', new Date().toLocaleDateString()])
    reporte.push([])
    reporte.push(['RESUMEN GENERAL'])
    reporte.push(['Total de registros:', datos.length])
  reporte.push(['Total de unidades:', `${datos.reduce((sum, item) => sum + (item.venta || 0), 0).toLocaleString()}`])
  reporte.push(['Promedio por registro:', `${datos.length > 0 ? Math.round(datos.reduce((sum, item) => sum + (item.venta || 0), 0) / datos.length).toLocaleString() : 0}`])
    reporte.push(['Ciudades activas:', new Set(datos.map(item => item.ciudad).filter(Boolean)).size])
    reporte.push([])

  // Unidades por ciudad
  reporte.push(['UNIDADES POR CIUDAD'])
  reporte.push(['Ciudad', 'Total Unidades'])
    Object.entries(ventasPorCiudad)
      .sort(([,a], [,b]) => b - a)
      .forEach(([ciudad, venta]) => {
        reporte.push([ciudad, `${venta.toLocaleString()}`])
      })
    reporte.push([])

  // Unidades por negocio
  reporte.push(['UNIDADES POR TIPO DE NEGOCIO'])
  reporte.push(['Negocio', 'Total Unidades'])
    Object.entries(ventasPorNegocio)
      .sort(([,a], [,b]) => b - a)
      .forEach(([negocio, venta]) => {
        reporte.push([negocio, `${venta.toLocaleString()}`])
      })

    // Crear archivo Excel
    const worksheet = XLSX.utils.aoa_to_sheet(reporte)
    const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte Analisis')
    
  const fecha = new Date().toISOString().split('T')[0]
  XLSX.writeFile(workbook, `frijolitos-reporte-analisis-${fecha}.xlsx`)
  }

  const exportarReportePDF = async () => {
    if (datos.length === 0) {
      alert('No hay datos para generar reporte')
      return
    }

    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const margin = 40
    let y = margin

    // Encabezado con logo (intenta varios paths)
    const bust = `?t=${Math.floor(Date.now()/1000)}`
    const logoPaths = [
      '/frijolitos-costenos.png',
      '/frijolitos-costenos.webp',
      '/frijolitos_costenos.png',
      '/frijolitos.png',
      '/logo.png', '/logo.webp', '/logo.jpg', '/logo.jpeg'
    ]
    for (const path of logoPaths) {
      try {
        const res = await fetch(path + bust, { cache: 'no-store' })
        if (!res.ok) continue
        const blob = await res.blob()
        const dataUrl = await new Promise(resolve => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.readAsDataURL(blob)
        })
        const logoW = 120
        const logoH = 120 * 0.7
        doc.addImage(dataUrl, 'PNG', margin, y, logoW, logoH)
        y += logoH + 8
        break
      } catch {}
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text('REPORTE DE ANALISIS - FRIJOLITOS COSTEÑOS', margin, y)
    y += 20
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, margin, y)
    y += 20

    // Resumen general
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('RESUMEN GENERAL', margin, y)
    y += 12
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    const totalUnidades = datos.reduce((sum, item) => sum + (item.venta || 0), 0)
    const promedio = datos.length > 0 ? Math.round(totalUnidades / datos.length) : 0
    const ciudadesActivas = new Set(datos.map(item => item.ciudad).filter(Boolean)).size

    ;[
      `Total de registros: ${datos.length.toLocaleString()}`,
      `Total de unidades: ${totalUnidades.toLocaleString()}`,
      `Promedio por registro: ${promedio.toLocaleString()}`,
      `Ciudades activas: ${ciudadesActivas.toString()}`
    ].forEach(line => { doc.text(line, margin, y); y += 14 })
    y += 4

    // Unidades por ciudad (tabla)
    const ciudadRows = Object.entries(ventasPorCiudad)
      .sort(([,a], [,b]) => b - a)
      .map(([ciudad, value]) => [ciudad, value.toLocaleString()])
    try {
      autoTable(doc, {
        startY: y,
        head: [['UNIDADES POR CIUDAD', 'Total Unidades']],
        body: ciudadRows,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [16, 185, 129] },
        margin: { left: margin, right: margin }
      })
    } catch (e) {
      console.warn('Fallo autoTable (ciudad):', e)
    }
    y = (doc.lastAutoTable?.finalY || y) + 16

    // Unidades por negocio (tabla)
    const negocioRows = Object.entries(ventasPorNegocio)
      .sort(([,a], [,b]) => b - a)
      .map(([negocio, value]) => [negocio, value.toLocaleString()])
    try {
      autoTable(doc, {
        startY: y,
        head: [['UNIDADES POR TIPO DE NEGOCIO', 'Total Unidades']],
        body: negocioRows,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: margin, right: margin }
      })
    } catch (e) {
      console.warn('Fallo autoTable (negocio):', e)
    }

    // Capturar y añadir gráficos como imágenes
    const charts = [
      { ref: chartMesRef, titulo: 'Tendencia por Mes' },
      { ref: chartNegocioRef, titulo: 'Unidades por Tipo de Negocio' },
      { ref: chartCiudadRef, titulo: 'Unidades por Ciudad' },
      { ref: chartVendedoresRef, titulo: 'Top Vendedores' },
    ]

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const maxImgWidth = pageWidth - margin * 2
    const imgBlockGap = 16

    for (const { ref, titulo } of charts) {
      const node = ref.current
      if (!node) continue
      try {
        const canvas = await html2canvas(node, { scale: 2, backgroundColor: null })
        const imgData = canvas.toDataURL('image/png', 0.95)
        // Calcular tamaño manteniendo aspect ratio
        const origW = canvas.width
        const origH = canvas.height
        const imgW = Math.min(maxImgWidth, origW)
        const imgH = (imgW / origW) * origH

        // Salto de página si no cabe
        if (y + 24 + imgH > pageHeight - margin) {
          doc.addPage()
          y = margin
        }

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.text(titulo, margin, y)
        y += 8
        doc.addImage(imgData, 'PNG', margin, y, imgW, imgH, undefined, 'FAST')
        y += imgH + imgBlockGap
      } catch (err) {
        // Si falla la captura, continuar con el siguiente
        console.warn('No se pudo capturar gráfico', titulo, err)
      }
    }

    // Pie de página sencillo
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(120)
      doc.text(`Página ${i} de ${pageCount}`, 300, doc.internal.pageSize.getHeight() - 20, { align: 'center' })
    }

    const fecha = new Date().toISOString().split('T')[0]
    doc.save(`frijolitos-reporte-analisis-${fecha}.pdf`)
  }

  // Estilos reutilizables de tarjeta
  const cardBase = {
    background: theme.cardBg,
    borderRadius: '12px',
    border: `1px solid ${theme.border}`,
  }

  return (
    <div>
      {/* Encabezado y acción */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span role="img" aria-label="chart">📈</span>
          Analisis y Reportes
        </h1>
        <div className="flex items-center gap-8">
          <button
            onClick={exportarReporte}
            disabled={datos.length === 0}
            className="btn btn-primary"
            title="Exportar reporte en Excel"
          >
            📊 Excel
          </button>
        </div>
      </div>

      {/* KPIs principales */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{ ...cardBase, padding: '16px' }}>
          <div style={{ fontSize: '12px', color: theme.textSecondary, marginBottom: '6px' }}>Total de registros</div>
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{totalRegistros.toLocaleString()}</div>
        </div>
        <div style={{ ...cardBase, padding: '16px' }}>
          <div style={{ fontSize: '12px', color: theme.textSecondary, marginBottom: '6px' }}>Total de unidades</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>{totalUnidades.toLocaleString()}</div>
        </div>
        <div style={{ ...cardBase, padding: '16px' }}>
          <div style={{ fontSize: '12px', color: theme.textSecondary, marginBottom: '6px' }}>Promedio por registro</div>
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{promedioPorRegistro.toLocaleString()}</div>
        </div>
        <div style={{ ...cardBase, padding: '16px' }}>
          <div style={{ fontSize: '12px', color: theme.textSecondary, marginBottom: '6px' }}>Ciudades activas</div>
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{ciudadesActivas.toLocaleString()}</div>
        </div>
      </div>

      {/* Grilla principal de 12 columnas */}
      <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))' }}>
        {/* Tendencia por Mes (ancho 8) */}
        <div style={{ ...cardBase, padding: '20px', gridColumn: 'span 8' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>Tendencia por Mes</h3>
          <div ref={chartMesRef}>
          {dataMes.length === 0 ? (
            <p style={{ color: theme.textSecondary }}>No hay datos para mostrar</p>
          ) : (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={dataMes} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                  <XAxis dataKey="name" tick={{ fill: theme.text }} tickFormatter={formatYM} />
                  <YAxis tick={{ fill: theme.text }} />
                  <RTooltip labelFormatter={formatYM} />
                  <Legend />
                  <Line type="monotone" dataKey="value" name="Unidades" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          </div>
        </div>

        {/* Unidades por Tipo de Negocio (ancho 4) */}
        <div style={{ ...cardBase, padding: '20px', gridColumn: 'span 4' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>Unidades por Tipo de Negocio</h3>
          <div ref={chartNegocioRef}>
          {dataNegocio.length === 0 ? (
            <p style={{ color: theme.textSecondary }}>No hay datos para mostrar</p>
          ) : (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <RTooltip />
                  <Legend />
                  <Pie data={dataNegocio} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={4}>
                    {dataNegocio.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          </div>
        </div>

        {/* Unidades por Ciudad (ancho 6) */}
        <div style={{ ...cardBase, padding: '20px', gridColumn: 'span 6' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>Unidades por Ciudad</h3>
          <div ref={chartCiudadRef}>
          {dataCiudad.length === 0 ? (
            <p style={{ color: theme.textSecondary }}>No hay datos para mostrar</p>
          ) : (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={dataCiudad} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                  <XAxis dataKey="name" tick={{ fill: theme.text }} />
                  <YAxis tick={{ fill: theme.text }} />
                  <RTooltip cursor={{ fill: theme.bg }} />
                  <Legend />
                  <Bar dataKey="value" name="Unidades" fill="#10b981" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          </div>
        </div>

        {/* Top Vendedores (ancho 6) */}
        <div style={{ ...cardBase, padding: '20px', gridColumn: 'span 6' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>Top Vendedores</h3>
          <div ref={chartVendedoresRef}>
          {dataVendedores.length === 0 ? (
            <p style={{ color: theme.textSecondary }}>No hay datos para mostrar</p>
          ) : (
            <div style={{ width: '100%', height: 340 }}>
              <ResponsiveContainer>
                <BarChart data={dataVendedores} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                  <XAxis type="number" tick={{ fill: theme.text }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: theme.text }} width={140} />
                  <RTooltip />
                  <Legend />
                  <Bar dataKey="value" name="Unidades" fill="#3b82f6" radius={[0,6,6,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          </div>
        </div>

        {/* Mapa de calor (ancho 12) */}
        <div style={{ ...cardBase, padding: '16px', gridColumn: 'span 12' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>Mapa de Calor - Atlántida (Honduras)</h3>
          <Mapa modo='heatmap' datos={datos} />
        </div>
      </div>
    </div>
  )
}

// Componente de Login
function LoginForm({ onLogin, supabase }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLogin) {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        
        if (error) throw error
        onLogin(authData.user)
        alert('Login exitoso!')
      } else {
        const { data: signUpData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { nombre }
          }
        })
        
        if (error) throw error
        onLogin(signUpData.user)
        alert('Cuenta creada exitosamente!')
      }
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fff7ed, #fef3c7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        padding: '40px',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌱</div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h2>
          <p style={{ color: '#6b7280', marginTop: '8px' }}>
            Frijolitos Costeños
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Nombre completo
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required={!isLogin}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
                placeholder="Tu nombre completo"
              />
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px'
              }}
              placeholder="tu@email.com"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px'
              }}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Procesando...' : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={() => setIsLogin(!isLogin)}
            style={{
              background: 'none',
              border: 'none',
              color: '#f97316',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  )
}



export default App