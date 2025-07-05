import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface TrailPoint {
  position: THREE.Vector3
  life: number
  size: number
}

interface MouseTrailProps {
  mousePosition: THREE.Vector3
}

function MouseTrail({ mousePosition }: MouseTrailProps) {
  const [trail, setTrail] = useState<TrailPoint[]>([])
  const lastMousePos = useRef(new THREE.Vector3())
  const trailTimer = useRef(0)

  useFrame((state, delta) => {
    trailTimer.current += delta

    // Add new trail point every few frames if mouse moved
    if (trailTimer.current > 0.02 && lastMousePos.current.distanceTo(mousePosition) > 0.1) {
      const newPoint: TrailPoint = {
        position: mousePosition.clone(),
        life: 1.0,
        size: Math.random() * 0.5 + 0.3
      }
      
      setTrail(prev => [...prev, newPoint].slice(-50)) // Keep last 50 points
      trailTimer.current = 0
    }

    lastMousePos.current.copy(mousePosition)

    // Update trail points
    setTrail(prev => 
      prev
        .map(point => ({
          ...point,
          life: point.life - delta * 2,
          size: point.size * (1 - delta * 0.5)
        }))
        .filter(point => point.life > 0)
    )
  })

  if (trail.length === 0) return null

  const positions = new Float32Array(trail.length * 3)
  const sizes = new Float32Array(trail.length)
  const opacities = new Float32Array(trail.length)

  trail.forEach((point, i) => {
    positions[i * 3] = point.position.x
    positions[i * 3 + 1] = point.position.y
    positions[i * 3 + 2] = point.position.z
    sizes[i] = point.size * point.life
    opacities[i] = point.life
  })

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={trail.length}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={trail.length}
          array={sizes}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-opacity"
          count={trail.length}
          array={opacities}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={`
          attribute float size;
          attribute float opacity;
          varying float vOpacity;
          varying vec3 vColor;
          
          void main() {
            vOpacity = opacity;
            vColor = vec3(0.6, 0.8, 1.0);
            
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          varying float vOpacity;
          varying vec3 vColor;
          
          void main() {
            vec2 cxy = 2.0 * gl_PointCoord - 1.0;
            float r = dot(cxy, cxy);
            
            if (r > 1.0) discard;
            
            float alpha = (1.0 - sqrt(r)) * vOpacity;
            vec3 color = vColor * (1.0 + (1.0 - r) * 2.0);
            
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

export default MouseTrail