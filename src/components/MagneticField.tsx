import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface MagneticFieldProps {
  mousePosition: THREE.Vector3
  strength?: number
}

function MagneticField({ mousePosition, strength = 1 }: MagneticFieldProps) {
  const fieldRef = useRef<THREE.Points>(null)
  const particleCount = 200
  
  // Create field visualization particles
  const positions = new Float32Array(particleCount * 3)
  const sizes = new Float32Array(particleCount)
  
  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2
    const radius = 20 + Math.random() * 30
    const height = (Math.random() - 0.5) * 20
    
    positions[i * 3] = Math.cos(angle) * radius
    positions[i * 3 + 1] = height
    positions[i * 3 + 2] = Math.sin(angle) * radius
    
    sizes[i] = Math.random() * 0.5 + 0.1
  }

  useFrame((state) => {
    if (!fieldRef.current) return
    
    const time = state.clock.getElapsedTime()
    const geometry = fieldRef.current.geometry
    const positionsAttr = geometry.getAttribute('position') as THREE.BufferAttribute
    const positionsArray = positionsAttr.array as Float32Array
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      const angle = (i / particleCount) * Math.PI * 2 + time * 0.5
      const radius = 15 + Math.sin(time * 2 + i * 0.1) * 10
      const height = Math.sin(time + i * 0.2) * 10
      
      positionsArray[i3] = mousePosition.x + Math.cos(angle) * radius
      positionsArray[i3 + 1] = mousePosition.y + height
      positionsArray[i3 + 2] = mousePosition.z + Math.sin(angle) * radius
    }
    
    positionsAttr.needsUpdate = true
  })

  return (
    <points ref={fieldRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={particleCount}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={`
          attribute float size;
          varying float vAlpha;
          
          void main() {
            vAlpha = size;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (200.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          varying float vAlpha;
          
          void main() {
            vec2 cxy = 2.0 * gl_PointCoord - 1.0;
            float r = dot(cxy, cxy);
            
            if (r > 1.0) discard;
            
            float alpha = (1.0 - r) * vAlpha * 0.3;
            vec3 color = vec3(0.5, 0.8, 1.0);
            
            gl_FragColor = vec4(color, alpha);
          }
        `}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

export default MagneticField