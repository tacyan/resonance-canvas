import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ParticleSystemProps {
  mousePosition: THREE.Vector3
  audioData: Float32Array | null
  sensitivity: number
  ripples?: Array<{
    position: THREE.Vector3
    radius: number
    intensity: number
    color: THREE.Color
  }>
  dragState?: {
    isDragging: boolean
    startPosition: THREE.Vector3
    currentPosition: THREE.Vector3
    velocity: THREE.Vector3
    intensity: number
  }
}

function ParticleSystem({ mousePosition, audioData, sensitivity, ripples = [], dragState }: ParticleSystemProps) {
  const particlesRef = useRef<THREE.Points>(null)
  const particleCount = 5000
  const smoothMousePosition = useRef(new THREE.Vector3())
  const mouseVelocity = useRef(new THREE.Vector3())
  const particleVelocities = useRef(new Float32Array(particleCount * 3))
  
  const { positions, colors, sizes, baseColors, baseSizes } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const baseColors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    const baseSizes = new Float32Array(particleCount)
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      
      // Random positions with some concentrated near center
      let radius
      if (Math.random() < 0.3) {
        // 30% of particles start closer to center
        radius = 20 + Math.random() * 30
      } else {
        // Rest are distributed further out
        radius = 50 + Math.random() * 70
      }
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i3 + 2] = radius * Math.cos(phi)
      
      // Star-like colors with more variety
      let hue
      const colorType = Math.random()
      if (colorType < 0.3) {
        hue = 0.58 + Math.random() * 0.1 // Blue stars
      } else if (colorType < 0.6) {
        hue = 0.15 + Math.random() * 0.05 // Yellow stars
      } else if (colorType < 0.8) {
        hue = 0.0 // Red stars
      } else {
        hue = 0.75 + Math.random() * 0.1 // Purple stars
      }
      const saturation = Math.random() * 0.4
      const lightness = 0.6 + Math.random() * 0.4
      const color = new THREE.Color().setHSL(hue, saturation, lightness)
      colors[i3] = color.r
      colors[i3 + 1] = color.g
      colors[i3 + 2] = color.b
      baseColors[i3] = color.r
      baseColors[i3 + 1] = color.g
      baseColors[i3 + 2] = color.b
      
      // Varied star sizes
      const size = Math.random() * Math.random() * 0.8 + 0.1
      sizes[i] = size
      baseSizes[i] = size
    }
    
    return { positions, colors, sizes, baseColors, baseSizes }
  }, [])

  useFrame((state) => {
    if (!particlesRef.current) return
    
    // Smooth mouse movement with stronger smoothing
    const newVelocity = new THREE.Vector3().subVectors(mousePosition, smoothMousePosition.current)
    mouseVelocity.current.lerp(newVelocity, 0.3)
    smoothMousePosition.current.lerp(mousePosition, 0.2)
    
    const time = state.clock.getElapsedTime()
    const geometry = particlesRef.current.geometry
    const positionsAttribute = geometry.getAttribute('position') as THREE.BufferAttribute
    const sizesAttribute = geometry.getAttribute('size') as THREE.BufferAttribute
    const colorsAttribute = geometry.getAttribute('color') as THREE.BufferAttribute
    const positions = positionsAttribute.array as Float32Array
    const sizes = sizesAttribute.array as Float32Array
    const colors = colorsAttribute.array as Float32Array
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      
      // Get base values
      const baseSize = baseSizes[i]
      const baseR = baseColors[i3]
      const baseG = baseColors[i3 + 1]
      const baseB = baseColors[i3 + 2]
      
      // Slow drift motion (very subtle)
      const driftSpeed = 0.02 + (i % 20) * 0.001
      const driftRadius = Math.sqrt(positions[i3] * positions[i3] + positions[i3 + 2] * positions[i3 + 2])
      const angle = Math.atan2(positions[i3 + 2], positions[i3]) + time * driftSpeed
      
      positions[i3] = Math.cos(angle) * driftRadius
      positions[i3 + 2] = Math.sin(angle) * driftRadius
      
      // Subtle vertical float
      positions[i3 + 1] += Math.sin(time * 0.5 + i * 0.1) * 0.02
      
      // Mouse spotlight effect with smooth position
      const dx = positions[i3] - smoothMousePosition.current.x
      const dy = positions[i3 + 1] - smoothMousePosition.current.y
      const dz = positions[i3 + 2] - smoothMousePosition.current.z
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
      
      // Dynamic spotlight radius that follows mouse
      const spotlightRadius = 35
      const spotlightIntensity = Math.max(0, 1 - distance / spotlightRadius)
      
      // Star twinkling - more active near mouse
      const baseTwinkle = Math.sin(time * 3 + i * 0.5) * 0.3 + 0.7
      const mouseTwinkle = Math.sin(time * 10 + i) * spotlightIntensity
      const twinkle = baseTwinkle + mouseTwinkle * 0.5
      
      // Time-based color shift for dynamic effect
      const timeShift = Math.sin(time * 0.5 + i * 0.01) * 0.1
      const hueShift = spotlightIntensity * 0.1 + timeShift
      
      // Apply spotlight and twinkling to size
      const sizeMultiplier = 1 + spotlightIntensity * 4
      sizes[i] = baseSize * twinkle * sizeMultiplier
      
      // Apply spotlight to color (make stars brighter in spotlight)
      const brightnessBoost = 1 + spotlightIntensity * 3
      colors[i3] = Math.min(1, baseR * brightnessBoost)
      colors[i3 + 1] = Math.min(1, baseG * brightnessBoost)
      colors[i3 + 2] = Math.min(1, baseB * brightnessBoost)
      
      // Apply ripple effects
      let rippleEffect = 0
      let rippleColorR = 0
      let rippleColorG = 0
      let rippleColorB = 0
      
      ripples.forEach(ripple => {
        const rippleDx = positions[i3] - ripple.position.x
        const rippleDy = positions[i3 + 1] - ripple.position.y
        const rippleDz = positions[i3 + 2] - ripple.position.z
        const rippleDistance = Math.sqrt(rippleDx * rippleDx + rippleDy * rippleDy + rippleDz * rippleDz)
        
        // Create wave effect
        const waveWidth = 5
        const distFromWave = Math.abs(rippleDistance - ripple.radius)
        
        if (distFromWave < waveWidth) {
          const waveIntensity = (1 - distFromWave / waveWidth) * ripple.intensity
          rippleEffect = Math.max(rippleEffect, waveIntensity)
          
          // Mix ripple color
          rippleColorR += ripple.color.r * waveIntensity
          rippleColorG += ripple.color.g * waveIntensity
          rippleColorB += ripple.color.b * waveIntensity
        }
      })
      
      // Apply ripple effects to size and color
      if (rippleEffect > 0) {
        sizes[i] *= (1 + rippleEffect * 3)
        
        // Blend ripple color with star color
        colors[i3] = Math.min(1, colors[i3] * (1 - rippleEffect * 0.5) + rippleColorR * rippleEffect)
        colors[i3 + 1] = Math.min(1, colors[i3 + 1] * (1 - rippleEffect * 0.5) + rippleColorG * rippleEffect)
        colors[i3 + 2] = Math.min(1, colors[i3 + 2] * (1 - rippleEffect * 0.5) + rippleColorB * rippleEffect)
      }
      
      // Enhanced mouse following behavior
      const followRadius = 50
      const followInfluence = Math.max(0, 1 - distance / followRadius)
      
      if (followInfluence > 0) {
        // Calculate direction to mouse
        const dirX = -dx / distance
        const dirY = -dy / distance
        const dirZ = -dz / distance
        
        // Flow field effect - create smooth following motion
        const flowForce = followInfluence * 0.08
        const dampening = 0.95
        
        // Update particle velocities
        particleVelocities.current[i3] = particleVelocities.current[i3] * dampening + dirX * flowForce
        particleVelocities.current[i3 + 1] = particleVelocities.current[i3 + 1] * dampening + dirY * flowForce
        particleVelocities.current[i3 + 2] = particleVelocities.current[i3 + 2] * dampening + dirZ * flowForce
        
        // Apply velocities to positions
        positions[i3] += particleVelocities.current[i3]
        positions[i3 + 1] += particleVelocities.current[i3 + 1]
        positions[i3 + 2] += particleVelocities.current[i3 + 2]
        
        // Add orbital motion for more dynamic movement
        const orbitAngle = time * 2 + i * 0.1
        const orbitForce = followInfluence * 0.03
        positions[i3] += Math.cos(orbitAngle) * dy * orbitForce
        positions[i3 + 1] += Math.sin(orbitAngle) * dx * orbitForce
        
        // Mouse velocity creates wake effect
        const wakeForce = followInfluence * 0.3
        positions[i3] += mouseVelocity.current.x * wakeForce
        positions[i3 + 1] += mouseVelocity.current.y * wakeForce
        positions[i3 + 2] += mouseVelocity.current.z * wakeForce
        
        // Repel very close particles to avoid clustering
        if (distance < 8) {
          const repelForce = (1 - distance / 8) * 0.1
          positions[i3] += dx * repelForce
          positions[i3 + 1] += dy * repelForce
          positions[i3 + 2] += dz * repelForce
        }
      } else {
        // Gradually reduce velocity when out of range
        particleVelocities.current[i3] *= 0.98
        particleVelocities.current[i3 + 1] *= 0.98
        particleVelocities.current[i3 + 2] *= 0.98
        
        positions[i3] += particleVelocities.current[i3]
        positions[i3 + 1] += particleVelocities.current[i3 + 1]
        positions[i3 + 2] += particleVelocities.current[i3 + 2]
      }
      
      // Apply drag effects
      if (dragState && dragState.isDragging) {
        const dragDistance = Math.sqrt(
          Math.pow(positions[i3] - dragState.currentPosition.x, 2) +
          Math.pow(positions[i3 + 1] - dragState.currentPosition.y, 2) +
          Math.pow(positions[i3 + 2] - dragState.currentPosition.z, 2)
        )
        
        const dragRadius = 40
        const dragInfluence = Math.max(0, 1 - dragDistance / dragRadius) * dragState.intensity
        
        if (dragInfluence > 0) {
          // Create vortex/swirl effect
          const toCenter = new THREE.Vector3(
            dragState.currentPosition.x - positions[i3],
            dragState.currentPosition.y - positions[i3 + 1],
            dragState.currentPosition.z - positions[i3 + 2]
          ).normalize()
          
          // Perpendicular vector for circular motion
          const perpX = -toCenter.y
          const perpY = toCenter.x
          
          // Combine attraction and circular motion
          const attractForce = dragInfluence * 0.1
          const swirlForce = dragInfluence * 0.15
          
          positions[i3] += toCenter.x * attractForce + perpX * swirlForce
          positions[i3 + 1] += toCenter.y * attractForce + perpY * swirlForce
          positions[i3 + 2] += toCenter.z * attractForce
          
          // Add drag velocity influence
          if (dragState.velocity) {
            positions[i3] += dragState.velocity.x * dragInfluence * 0.02
            positions[i3 + 1] += dragState.velocity.y * dragInfluence * 0.02
            positions[i3 + 2] += dragState.velocity.z * dragInfluence * 0.02
          }
          
          // Enhance size and color during drag
          sizes[i] *= (1 + dragInfluence * 2)
          
          // Shift colors to rainbow effect
          const rainbowHue = (time * 2 + dragDistance * 0.1) % 1
          const dragColor = new THREE.Color().setHSL(rainbowHue, 0.8, 0.6)
          colors[i3] = Math.min(1, colors[i3] * (1 - dragInfluence * 0.7) + dragColor.r * dragInfluence)
          colors[i3 + 1] = Math.min(1, colors[i3 + 1] * (1 - dragInfluence * 0.7) + dragColor.g * dragInfluence)
          colors[i3 + 2] = Math.min(1, colors[i3 + 2] * (1 - dragInfluence * 0.7) + dragColor.b * dragInfluence)
        }
      }
      
      // Audio reactivity
      if (audioData && audioData.length > 0) {
        const audioIndex = Math.floor((i / particleCount) * audioData.length)
        const audioValue = audioData[audioIndex] || 0
        const audioInfluence = audioValue * sensitivity
        
        // Audio affects size and brightness
        sizes[i] *= (1 + audioInfluence)
        const audioBrightness = 1 + audioInfluence * 0.5
        colors[i3] = Math.min(1, colors[i3] * audioBrightness)
        colors[i3 + 1] = Math.min(1, colors[i3 + 1] * audioBrightness)
        colors[i3 + 2] = Math.min(1, colors[i3 + 2] * audioBrightness)
      }
    }
    
    positionsAttribute.needsUpdate = true
    sizesAttribute.needsUpdate = true
    colorsAttribute.needsUpdate = true
  })

  return (
    <points ref={particlesRef}>
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
            float r = 0.0;
            vec2 cxy = 2.0 * gl_PointCoord - 1.0;
            r = dot(cxy, cxy);
            
            // Create soft glow effect
            float intensity = 1.0 - smoothstep(0.0, 1.0, sqrt(r));
            
            // Add bright core
            float core = 1.0 - smoothstep(0.0, 0.2, r);
            
            // Combine core and glow
            float alpha = intensity + core * 0.5;
            
            gl_FragColor = vec4(vColor * (1.0 + core), alpha);
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

export default ParticleSystem