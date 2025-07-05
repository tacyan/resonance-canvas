import { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface Ripple {
  id: string
  position: THREE.Vector3
  radius: number
  maxRadius: number
  intensity: number
  color: THREE.Color
  speed: number
}

interface RippleEffectProps {
  mousePosition: THREE.Vector3
  onRipplesUpdate: (ripples: Ripple[]) => void
}

function RippleEffect({ mousePosition, onRipplesUpdate }: RippleEffectProps) {
  const { raycaster, camera, scene } = useThree()
  const [ripples, setRipples] = useState<Ripple[]>([])
  const lastMousePos = useRef(new THREE.Vector3())
  const mouseVelocity = useRef(0)

  // Create ripple on click
  const handleClick = (event: MouseEvent) => {
    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    )
    
    raycaster.setFromCamera(mouse, camera)
    
    const intersects = raycaster.intersectObjects(scene.children, true)
    let position: THREE.Vector3
    
    if (intersects.length > 0) {
      position = intersects[0].point
    } else {
      const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5)
      vector.unproject(camera)
      vector.sub(camera.position).normalize()
      const distance = -camera.position.z / vector.z
      position = camera.position.clone().add(vector.multiplyScalar(distance))
    }
    
    // Create large ripple on click
    const newRipple: Ripple = {
      id: Date.now().toString() + Math.random(),
      position: position.clone(),
      radius: 0,
      maxRadius: 80,
      intensity: 1.0,
      color: new THREE.Color().setHSL(Math.random() * 0.3 + 0.5, 0.8, 0.6),
      speed: 1.5
    }
    
    setRipples(prev => [...prev, newRipple])
  }

  useEffect(() => {
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  // Update parent component with ripples
  useEffect(() => {
    onRipplesUpdate(ripples)
  }, [ripples, onRipplesUpdate])

  // Create ripples on mouse movement
  useFrame((state, delta) => {
    // Calculate mouse velocity
    const currentVelocity = lastMousePos.current.distanceTo(mousePosition)
    mouseVelocity.current = THREE.MathUtils.lerp(mouseVelocity.current, currentVelocity, 0.1)
    
    // Create ripple if mouse is moving fast enough
    if (mouseVelocity.current > 0.5 && Math.random() < 0.3) {
      const newRipple: Ripple = {
        id: Date.now().toString() + Math.random(),
        position: mousePosition.clone(),
        radius: 0,
        maxRadius: 20 + mouseVelocity.current * 5,
        intensity: Math.min(mouseVelocity.current * 0.3, 1.0),
        color: new THREE.Color().setHSL(0.6, 0.6, 0.7),
        speed: 0.8
      }
      
      setRipples(prev => [...prev, newRipple])
    }
    
    lastMousePos.current.copy(mousePosition)
    
    // Update existing ripples
    setRipples(prevRipples => 
      prevRipples
        .map(ripple => ({
          ...ripple,
          radius: ripple.radius + ripple.speed * delta * 60,
          intensity: ripple.intensity * (1 - ripple.radius / ripple.maxRadius)
        }))
        .filter(ripple => ripple.radius < ripple.maxRadius && ripple.intensity > 0.01)
    )
  })

  return null // Ripples are rendered by modifying particles in ParticleSystem
}

export { RippleEffect }
export type { Ripple }