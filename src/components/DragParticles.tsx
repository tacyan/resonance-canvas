import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface DragParticle {
  position: THREE.Vector3
  velocity: THREE.Vector3
  life: number
  size: number
  color: THREE.Color
}

interface DragParticlesProps {
  dragState: {
    isDragging: boolean
    currentPosition: THREE.Vector3
    velocity: THREE.Vector3
    intensity: number
  }
}

function DragParticles({ dragState }: DragParticlesProps) {
  const [particles, setParticles] = useState<DragParticle[]>([])
  const emitTimer = useRef(0)

  useFrame((state, delta) => {
    emitTimer.current += delta

    // Emit particles during drag
    if (dragState.isDragging && emitTimer.current > 0.01) {
      const particleCount = Math.floor(5 + dragState.intensity * 10)
      const newParticles: DragParticle[] = []

      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = Math.random() * 0.5 + 0.1
        const elevation = (Math.random() - 0.5) * Math.PI * 0.3

        newParticles.push({
          position: dragState.currentPosition.clone(),
          velocity: new THREE.Vector3(
            Math.cos(angle) * Math.cos(elevation) * speed - dragState.velocity.x * 0.1,
            Math.sin(elevation) * speed - dragState.velocity.y * 0.1,
            Math.sin(angle) * Math.cos(elevation) * speed - dragState.velocity.z * 0.1
          ),
          life: 1.0,
          size: Math.random() * 0.8 + 0.2,
          color: new THREE.Color().setHSL(
            Math.random(),
            0.9,
            0.5 + Math.random() * 0.3
          )
        })
      }

      setParticles(prev => [...prev, ...newParticles].slice(-500)) // Keep last 500 particles
      emitTimer.current = 0
    }

    // Update particles
    setParticles(prev =>
      prev
        .map(particle => ({
          ...particle,
          position: particle.position.clone().add(
            particle.velocity.clone().multiplyScalar(delta * 60)
          ),
          velocity: particle.velocity.clone().multiplyScalar(0.98),
          life: particle.life - delta * 0.8,
          size: particle.size * (1 - delta * 0.3)
        }))
        .filter(particle => particle.life > 0)
    )
  })

  if (particles.length === 0) return null

  const positions = new Float32Array(particles.length * 3)
  const colors = new Float32Array(particles.length * 3)
  const sizes = new Float32Array(particles.length)

  particles.forEach((particle, i) => {
    positions[i * 3] = particle.position.x
    positions[i * 3 + 1] = particle.position.y
    positions[i * 3 + 2] = particle.position.z
    colors[i * 3] = particle.color.r
    colors[i * 3 + 1] = particle.color.g
    colors[i * 3 + 2] = particle.color.b
    sizes[i] = particle.size * particle.life
  })

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particles.length}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={particles.length}
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
            gl_PointSize = size * (400.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          varying vec3 vColor;
          
          void main() {
            vec2 cxy = 2.0 * gl_PointCoord - 1.0;
            float r = dot(cxy, cxy);
            
            if (r > 1.0) discard;
            
            float intensity = 1.0 - sqrt(r);
            vec3 glow = vColor * (1.0 + intensity * 2.0);
            
            gl_FragColor = vec4(glow, intensity);
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

export default DragParticles