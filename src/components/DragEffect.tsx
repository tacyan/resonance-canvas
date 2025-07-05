import { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface DragState {
  isDragging: boolean
  startPosition: THREE.Vector3
  currentPosition: THREE.Vector3
  velocity: THREE.Vector3
  intensity: number
}

interface DragEffectProps {
  mousePosition: THREE.Vector3
  onDragStateChange: (dragState: DragState) => void
}

function DragEffect({ mousePosition, onDragStateChange }: DragEffectProps) {
  const { raycaster, camera, scene } = useThree()
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startPosition: new THREE.Vector3(),
    currentPosition: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    intensity: 0
  })
  
  const lastPosition = useRef(new THREE.Vector3())
  const velocitySmooth = useRef(new THREE.Vector3())

  // Handle mouse down
  const handleMouseDown = (event: MouseEvent) => {
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
    
    setDragState(prev => ({
      ...prev,
      isDragging: true,
      startPosition: position.clone(),
      currentPosition: position.clone(),
      intensity: 1
    }))
    
    lastPosition.current.copy(position)
  }

  // Handle mouse up
  const handleMouseUp = () => {
    setDragState(prev => ({
      ...prev,
      isDragging: false,
      intensity: 0
    }))
  }

  useEffect(() => {
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  // Update drag state
  useFrame((state, delta) => {
    if (dragState.isDragging) {
      // Calculate velocity
      const currentVelocity = new THREE.Vector3()
      currentVelocity.subVectors(mousePosition, lastPosition.current)
      currentVelocity.multiplyScalar(1 / delta)
      
      // Smooth velocity
      velocitySmooth.current.lerp(currentVelocity, 0.3)
      
      setDragState(prev => ({
        ...prev,
        currentPosition: mousePosition.clone(),
        velocity: velocitySmooth.current.clone(),
        intensity: Math.min(velocitySmooth.current.length() * 0.05, 1)
      }))
      
      lastPosition.current.copy(mousePosition)
    } else {
      // Fade out intensity
      if (dragState.intensity > 0) {
        setDragState(prev => ({
          ...prev,
          intensity: Math.max(0, prev.intensity - delta * 2)
        }))
      }
    }
  })

  // Update parent component
  useEffect(() => {
    onDragStateChange(dragState)
  }, [dragState, onDragStateChange])

  return null
}

export { DragEffect }
export type { DragState }