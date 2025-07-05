import { useState, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface StarBurstProps {
  audioData: Float32Array | null
  mousePosition: THREE.Vector3
}

interface Burst {
  id: string
  position: THREE.Vector3
  particles: {
    position: THREE.Vector3
    velocity: THREE.Vector3
    size: number
    life: number
    color: THREE.Color
  }[]
  createdAt: number
}

function StarBurst({ audioData }: StarBurstProps) {
  const { raycaster, camera, scene } = useThree()
  const [bursts, setBursts] = useState<Burst[]>([])

  const createBurst = (position: THREE.Vector3) => {
    const particleCount = 30 + Math.floor(Math.random() * 20)
    const particles = []
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2
      const speed = 0.1 + Math.random() * 0.3
      const elevation = (Math.random() - 0.5) * Math.PI * 0.5
      
      particles.push({
        position: position.clone(),
        velocity: new THREE.Vector3(
          Math.cos(angle) * Math.cos(elevation) * speed,
          Math.sin(elevation) * speed,
          Math.sin(angle) * Math.cos(elevation) * speed
        ),
        size: Math.random() * 0.5 + 0.2,
        life: 1.0,
        color: new THREE.Color().setHSL(
          0.15 + Math.random() * 0.5,
          0.8,
          0.5 + Math.random() * 0.5
        )
      })
    }
    
    const newBurst: Burst = {
      id: Date.now().toString() + Math.random(),
      position: position.clone(),
      particles,
      createdAt: Date.now()
    }
    
    setBursts(prev => [...prev, newBurst])
  }

  // Handle mouse clicks
  const handleClick = (event: MouseEvent) => {
    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    )
    
    raycaster.setFromCamera(mouse, camera)
    
    // Find intersection point
    const intersects = raycaster.intersectObjects(scene.children, true)
    let position: THREE.Vector3
    
    if (intersects.length > 0) {
      position = intersects[0].point
    } else {
      // Project to 3D space
      const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5)
      vector.unproject(camera)
      vector.sub(camera.position).normalize()
      const distance = -camera.position.z / vector.z
      position = camera.position.clone().add(vector.multiplyScalar(distance))
    }
    
    createBurst(position)
  }

  useEffect(() => {
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  // Update bursts
  useFrame((_, delta) => {
    setBursts(prevBursts => {
      return prevBursts
        .map(burst => {
          const updatedParticles = burst.particles.map(particle => {
            // Update position
            particle.position.add(
              particle.velocity.clone().multiplyScalar(delta * 60)
            )
            
            // Apply gravity
            particle.velocity.y -= delta * 0.5
            
            // Fade out
            particle.life -= delta * 0.5
            
            // Audio influence
            if (audioData && audioData.length > 0) {
              const audioValue = audioData[Math.floor(Math.random() * audioData.length)] || 0
              particle.velocity.multiplyScalar(1 + audioValue * 0.2)
              particle.size = particle.size * (1 + audioValue * 0.5)
            }
            
            return particle
          }).filter(particle => particle.life > 0)
          
          return {
            ...burst,
            particles: updatedParticles
          }
        })
        .filter(burst => burst.particles.length > 0)
    })
  })

  // Render all burst particles
  const allParticles = useMemo(() => {
    const positions: number[] = []
    const colors: number[] = []
    const sizes: number[] = []
    
    bursts.forEach(burst => {
      burst.particles.forEach(particle => {
        positions.push(particle.position.x, particle.position.y, particle.position.z)
        colors.push(particle.color.r, particle.color.g, particle.color.b)
        sizes.push(particle.size * particle.life)
      })
    })
    
    return { positions, colors, sizes }
  }, [bursts])

  if (allParticles.positions.length === 0) return null

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={allParticles.positions.length / 3}
          array={new Float32Array(allParticles.positions)}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={allParticles.colors.length / 3}
          array={new Float32Array(allParticles.colors)}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={allParticles.sizes.length}
          array={new Float32Array(allParticles.sizes)}
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
            gl_PointSize = size * (500.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          varying vec3 vColor;
          
          void main() {
            vec2 cxy = 2.0 * gl_PointCoord - 1.0;
            float r = dot(cxy, cxy);
            
            // Bright core with extended glow
            float core = 1.0 - smoothstep(0.0, 0.1, r);
            float glow = exp(-r * 3.0);
            
            float alpha = core + glow * 0.8;
            vec3 finalColor = vColor * (1.0 + core * 2.0);
            
            gl_FragColor = vec4(finalColor, alpha);
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

export default StarBurst