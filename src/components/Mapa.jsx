import React, { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'

// Coordenadas fijas de ciudades objetivo
const ciudadesCoords = {
  // Coordenadas ajustadas a los centros urbanos visibles en el mapa
  'La Ceiba': [15.7739, -86.7964],
  'El Porvenir': [15.7734, -86.8587],
  'El Pino': [15.7289, -86.8621]
}

// Desplazamiento visual para que los puntos queden "arriba" del rótulo (hacia el norte)
const ciudadesOffset = {
  'La Ceiba': [0, 0],
  'El Porvenir': [0, 0],
  'El Pino': [0, 0]
}

// Capa de heatmap usando leaflet.heat
function HeatmapLayer({ points }) {
  const map = useMap()

  useEffect(() => {
    const heat = L.heatLayer(points, {
      radius: 32,
      blur: 12,
      maxZoom: 17,
      minOpacity: 0.55,
      gradient: {
        0.2: '#60a5fa', // azul
        0.4: '#34d399', // verde
        0.6: '#f59e0b', // ámbar
        0.8: '#ef4444', // rojo
        1.0: '#991b1b'  // rojo oscuro
      }
    })
    heat.addTo(map)

    return () => {
      map.removeLayer(heat)
    }
  }, [map, points])

  return null
}

export default function Mapa({ modo = 'heatmap', datos = [] }) {
  // Normalizar y mapear variantes de ciudad a claves conocidas
  const normalize = (s) => {
    if (!s) return ''
    return String(s)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim()
  }

  const matchesCity = (value, target) => {
    const v = normalize(value)
    const t = normalize(target)
    // Coincidencia exacta o inclusión (para valores tipo "La Ceiba, Atlántida")
    return v === t || v.includes(t)
  }

  // Agregar por ciudad desde registros
  const conteos = useMemo(() => {
    const acc = { 'La Ceiba': 0, 'El Porvenir': 0, 'El Pino': 0 }
    for (const d of datos) {
      const c = d?.ciudad
      if (!c) continue
      if (matchesCity(c, 'La Ceiba')) acc['La Ceiba'] += 1
      else if (matchesCity(c, 'El Porvenir')) acc['El Porvenir'] += 1
      else if (matchesCity(c, 'El Pino')) acc['El Pino'] += 1
    }
    return acc
  }, [datos])

  // Escalar intensidades entre 0 y 1 por máximo
  const max = Math.max(0, ...Object.values(conteos)) || 0
  const heatPoints = Object.entries(conteos)
    .filter(([, count]) => count > 0) // ocultar si no hay registros
    .map(([ciudad, count]) => {
      const base = ciudadesCoords[ciudad]
      const off = ciudadesOffset[ciudad] || [0, 0]
      const coords = [base[0] + off[0], base[1] + off[1]]
      // Subir piso de intensidad para colores más vivos
      const ratio = max > 0 ? count / max : 0
      const intensity = ratio > 0 ? Math.max(0.35, Math.min(1, ratio)) : 0
      return [coords[0], coords[1], intensity]
    })

  return (
    <div style={{ width: '100%', height: '520px', position: 'relative' }}>
  <MapContainer center={[15.75, -86.8]} zoom={10} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />

        {modo === 'heatmap' ? (
          <HeatmapLayer points={heatPoints} />
        ) : (
          Object.entries(conteos)
            .filter(([, count]) => count > 0)
            .map(([ciudad, count]) => (
              <CircleMarker
                key={ciudad}
                center={[ciudadesCoords[ciudad][0] + (ciudadesOffset[ciudad]?.[0] || 0), ciudadesCoords[ciudad][1] + (ciudadesOffset[ciudad]?.[1] || 0)]}
                radius={Math.max(6, count)}
                fillColor='red'
                color='red'
                opacity={0.7}
                fillOpacity={0.4}
              >
                <Tooltip>{`${ciudad}: ${count} registros`}</Tooltip>
              </CircleMarker>
            ))
        )}
      </MapContainer>
      {/* Overlay de conteos para verificación rápida */}
      <div style={{
        position: 'absolute',
        right: '8px',
        bottom: '8px',
        background: 'rgba(0,0,0,0.55)',
        color: 'white',
        padding: '6px 8px',
        borderRadius: '6px',
        fontSize: '12px',
        lineHeight: 1.3
      }}>
        <div><strong>Registros</strong></div>
        <div>La Ceiba: {conteos['La Ceiba']}</div>
        <div>El Porvenir: {conteos['El Porvenir']}</div>
        <div>El Pino: {conteos['El Pino']}</div>
      </div>
    </div>
  )
}
