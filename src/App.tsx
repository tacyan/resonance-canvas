import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { Suspense, useState } from 'react'
import * as THREE from 'three'
import Scene from './components/Scene'
import ControlPanel from './components/ControlPanel'
import './App.css'

interface AppState {
  audioEnabled: boolean
  particlesEnabled: boolean
  effectsEnabled: boolean
  audioSensitivity: number
  visualMode: 'visual' | 'audio' | 'hybrid'
}

function App() {
  const [appState, setAppState] = useState<AppState>({
    audioEnabled: false,
    particlesEnabled: true,
    effectsEnabled: true,
    audioSensitivity: 1,
    visualMode: 'hybrid'
  })

  return (
    <div className="app">
      <Canvas
        shadows
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0
        }}
      >
        <color attach="background" args={['#000']} />
        <PerspectiveCamera makeDefault position={[0, 20, 50]} fov={75} />
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={10}
          maxDistance={100}
          maxPolarAngle={Math.PI * 0.85}
        />
        
        <Suspense fallback={null}>
          <Scene appState={appState} />
          <EffectComposer>
            <Bloom
              intensity={2.0}
              luminanceThreshold={0.6}
              luminanceSmoothing={0.9}
              radius={1.2}
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
      
      <ControlPanel appState={appState} setAppState={setAppState} />
    </div>
  )
}

export default App