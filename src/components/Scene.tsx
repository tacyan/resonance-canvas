import { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import StarBurst from './StarBurst'
import ParticleSystem from './ParticleSystem'
import GlowLayer from './GlowLayer'
import { RippleEffect, type Ripple } from './RippleEffect'
import MouseTrail from './MouseTrail'
import AudioVisualizer from './AudioVisualizer'
import MouseInteraction from './MouseInteraction'

interface SceneProps {
  appState: {
    audioEnabled: boolean
    particlesEnabled: boolean
    effectsEnabled: boolean
    audioSensitivity: number
    visualMode: 'visual' | 'audio' | 'hybrid'
  }
}

function Scene({ appState }: SceneProps) {
  const { scene } = useThree()
  const [audioData, setAudioData] = useState<Float32Array | null>(null)
  const [mousePosition, setMousePosition] = useState(new THREE.Vector3())
  const [ripples, setRipples] = useState<Ripple[]>([])
  const groupRef = useRef<THREE.Group>(null)

  useEffect(() => {
    // Darker ambient light for space atmosphere
    const ambientLight = new THREE.AmbientLight(0x0a0a0a, 0.2)
    scene.add(ambientLight)

    // Softer directional light
    const directionalLight = new THREE.DirectionalLight(0x4444ff, 0.3)
    directionalLight.position.set(10, 20, 10)
    directionalLight.castShadow = true
    directionalLight.shadow.camera.near = 0.1
    directionalLight.shadow.camera.far = 100
    directionalLight.shadow.camera.left = -50
    directionalLight.shadow.camera.right = 50
    directionalLight.shadow.camera.top = 50
    directionalLight.shadow.camera.bottom = -50
    scene.add(directionalLight)

    // Point lights (dimmer for space atmosphere)
    const colors = [0xff0080, 0x00ff80, 0x8000ff]
    colors.forEach((color, i) => {
      const pointLight = new THREE.PointLight(color, 0.2, 100)
      pointLight.position.set(
        Math.cos((i / 3) * Math.PI * 2) * 30,
        10,
        Math.sin((i / 3) * Math.PI * 2) * 30
      )
      scene.add(pointLight)
    })

    // Fog for depth
    scene.fog = new THREE.Fog(0x000000, 50, 150)

    return () => {
      scene.children = scene.children.filter(
        child => child.type !== 'AmbientLight' && 
                 child.type !== 'DirectionalLight' && 
                 child.type !== 'PointLight'
      )
      scene.fog = null
    }
  }, [])

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001
    }

    // Update point lights positions
    const time = state.clock.getElapsedTime()
    scene.children.forEach((child) => {
      if (child.type === 'PointLight') {
        const light = child as THREE.PointLight
        const index = scene.children.indexOf(child)
        light.position.x = Math.cos((index / 3) * Math.PI * 2 + time * 0.5) * 30
        light.position.z = Math.sin((index / 3) * Math.PI * 2 + time * 0.5) * 30
        light.position.y = 10 + Math.sin(time * 2 + index) * 5
      }
    })
  })

  return (
    <>
      <group ref={groupRef}>
        <RippleEffect 
          mousePosition={mousePosition}
          onRipplesUpdate={setRipples}
        />
        
        <MouseTrail 
          mousePosition={mousePosition}
        />
        
        <StarBurst 
          audioData={audioData}
          mousePosition={mousePosition}
        />
        
        {appState.particlesEnabled && (
          <>
            {/* Background glow layer */}
            <GlowLayer 
              mousePosition={mousePosition}
              particleCount={1000}
              scale={3}
            />
            
            {/* Mid glow layer */}
            <GlowLayer 
              mousePosition={mousePosition}
              particleCount={2000}
              scale={1.5}
            />
            
            {/* Main particle system */}
            <ParticleSystem 
              mousePosition={mousePosition}
              audioData={audioData}
              sensitivity={appState.audioSensitivity}
              ripples={ripples}
            />
          </>
        )}
        
        {appState.audioEnabled && (
          <AudioVisualizer 
            onAudioData={setAudioData}
            sensitivity={appState.audioSensitivity}
          />
        )}
      </group>
      
      <MouseInteraction 
        onMouseMove={setMousePosition}
        geometries={[]}
      />
      
      {/* Grid for reference */}
      <gridHelper args={[100, 20, 0x444444, 0x222222]} position={[0, -10, 0]} />
    </>
  )
}

export default Scene