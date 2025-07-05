import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface MouseInteractionProps {
  onMouseMove: (position: THREE.Vector3) => void
  geometries: THREE.Object3D[]
}

function MouseInteraction({ onMouseMove, geometries }: MouseInteractionProps) {
  const { camera, raycaster } = useThree()
  
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
      )
      
      raycaster.setFromCamera(mouse, camera)
      
      // Get 3D position at z=0 plane
      const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
      const intersection = new THREE.Vector3()
      raycaster.ray.intersectPlane(planeZ, intersection)
      
      if (intersection) {
        onMouseMove(intersection)
      }
      
      // Check for geometry intersections
      if (geometries.length > 0) {
        const intersects = raycaster.intersectObjects(geometries, true)
        if (intersects.length > 0) {
          const object = intersects[0].object
          if (object instanceof THREE.Mesh && object.material) {
            // Highlight on hover
            if ('emissiveIntensity' in object.material) {
              (object.material as any).emissiveIntensity = 1
            }
          }
        }
      }
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [camera, raycaster, onMouseMove, geometries])
  
  return null
}

export default MouseInteraction