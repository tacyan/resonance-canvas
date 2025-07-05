import React from 'react'
import './ControlPanel.css'

interface AppState {
  audioEnabled: boolean
  particlesEnabled: boolean
  effectsEnabled: boolean
  audioSensitivity: number
  visualMode: 'visual' | 'audio' | 'hybrid'
}

interface ControlPanelProps {
  appState: AppState
  setAppState: React.Dispatch<React.SetStateAction<AppState>>
}

function ControlPanel({ appState, setAppState }: ControlPanelProps) {
  const handleChange = (key: keyof AppState, value: any) => {
    setAppState(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="control-panel">
      <h3>Control Panel</h3>
      
      <div className="control-section">
        <h4>Mode</h4>
        <select 
          value={appState.visualMode} 
          onChange={(e) => handleChange('visualMode', e.target.value)}
        >
          <option value="visual">Visual Only</option>
          <option value="audio">Audio Reactive</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </div>
      
      <div className="control-section">
        <h4>Effects</h4>
        <label>
          <input
            type="checkbox"
            checked={appState.audioEnabled}
            onChange={(e) => handleChange('audioEnabled', e.target.checked)}
          />
          Enable Audio
        </label>
        
        <label>
          <input
            type="checkbox"
            checked={appState.particlesEnabled}
            onChange={(e) => handleChange('particlesEnabled', e.target.checked)}
          />
          Enable Particles
        </label>
        
        <label>
          <input
            type="checkbox"
            checked={appState.effectsEnabled}
            onChange={(e) => handleChange('effectsEnabled', e.target.checked)}
          />
          Post Processing
        </label>
      </div>
      
      <div className="control-section">
        <h4>Audio Sensitivity</h4>
        <input
          type="range"
          min="0.1"
          max="3"
          step="0.1"
          value={appState.audioSensitivity}
          onChange={(e) => handleChange('audioSensitivity', parseFloat(e.target.value))}
        />
        <span>{appState.audioSensitivity.toFixed(1)}</span>
      </div>
      
      <div className="control-section instructions">
        <h4>Instructions</h4>
        <ul>
          <li>Click to create 3D shapes</li>
          <li>Move mouse for particle effects</li>
          <li>Enable audio for sound reactivity</li>
          <li>Drag to rotate camera</li>
          <li>Scroll to zoom</li>
        </ul>
      </div>
    </div>
  )
}

export default ControlPanel