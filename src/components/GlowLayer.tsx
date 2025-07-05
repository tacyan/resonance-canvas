import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface GlowLayerProps {
  mousePosition: THREE.Vector3
  particleCount: number
  scale: number
}

function GlowLayer({ mousePosition, particleCount, scale }: GlowLayerProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const smoothMousePosition = useRef(new THREE.Vector3())

  // Create static positions for glow layer
  const positions = new Float32Array(particleCount * 3)
  const colors = new Float32Array(particleCount * 3)
  const sizes = new Float32Array(particleCount)

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3
    
    // Same distribution as main particles
    const radius = 80 + Math.random() * 40
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(Math.random() * 2 - 1)
    
    positions[i3] = radius * Math.sin(phi) * Math.cos(theta)
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
    positions[i3 + 2] = radius * Math.cos(phi)
    
    // Softer colors for glow
    colors[i3] = 0.8
    colors[i3 + 1] = 0.8
    colors[i3 + 2] = 1.0
    
    // Larger sizes for glow effect
    sizes[i] = (Math.random() * 2 + 1) * scale
  }

  useFrame(() => {
    if (!pointsRef.current) return
    
    smoothMousePosition.current.lerp(mousePosition, 0.1)
    
    const geometry = pointsRef.current.geometry
    const sizesAttribute = geometry.getAttribute('size') as THREE.BufferAttribute
    const sizesArray = sizesAttribute.array as Float32Array
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      
      // Calculate distance to mouse
      const dx = positions[i3] - smoothMousePosition.current.x
      const dy = positions[i3 + 1] - smoothMousePosition.current.y
      const dz = positions[i3 + 2] - smoothMousePosition.current.z
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
      
      // Glow intensity based on mouse distance
      const spotlightRadius = 40
      const intensity = Math.max(0, 1 - distance / spotlightRadius)
      
      // Update size based on intensity
      sizesArray[i] = (Math.random() * 2 + 1) * scale * (0.5 + intensity * 2)
    }
    
    sizesAttribute.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
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
          varying vec3 vColor;
          
          void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          varying vec3 vColor;
          
          void main() {
            vec2 cxy = 2.0 * gl_PointCoord - 1.0;
            float r = dot(cxy, cxy);
            
            // Very soft glow
            float glow = exp(-r * 2.0);
            
            gl_FragColor = vec4(vColor, glow * 0.3);
          }
        `}
        transparent
        vertexColors
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

export default GlowLayer