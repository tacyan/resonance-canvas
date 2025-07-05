import { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { MeshDistortMaterial } from '@react-three/drei'

interface GeometryGeneratorProps {
  onGeometryAdd: (geometry: THREE.Object3D) => void
  audioData: Float32Array | null
  mousePosition: THREE.Vector3
}

const geometryTypes = [
  { type: 'icosahedron', args: [1, 0] },
  { type: 'octahedron', args: [1, 0] },
  { type: 'tetrahedron', args: [1, 0] },
  { type: 'torus', args: [1, 0.4, 16, 100] },
  { type: 'sphere', args: [1, 32, 16] },
  { type: 'box', args: [1.5, 1.5, 1.5] }
]

function GeometryGenerator({ onGeometryAdd, audioData, mousePosition }: GeometryGeneratorProps) {
  const { scene, raycaster, camera } = useThree()
  const [shapes, setShapes] = useState<JSX.Element[]>([])
  const shapesRef = useRef<THREE.Group>(null)

  const createShape = (position: THREE.Vector3) => {
    const randomGeometry = geometryTypes[Math.floor(Math.random() * geometryTypes.length)]
    const scale = 0.5 + Math.random() * 2
    const color = new THREE.Color().setHSL(Math.random(), 0.7, 0.5)
    
    const id = Date.now() + Math.random()
    const newShape = (
      <mesh
        key={id}
        position={position}
        scale={[scale, scale, scale]}
        castShadow
        receiveShadow
      >
        {randomGeometry.type === 'icosahedron' && <icosahedronGeometry args={randomGeometry.args as [number, number]} />}
        {randomGeometry.type === 'octahedron' && <octahedronGeometry args={randomGeometry.args as [number, number]} />}
        {randomGeometry.type === 'tetrahedron' && <tetrahedronGeometry args={randomGeometry.args as [number, number]} />}
        {randomGeometry.type === 'torus' && <torusGeometry args={randomGeometry.args as [number, number, number, number]} />}
        {randomGeometry.type === 'sphere' && <sphereGeometry args={randomGeometry.args as [number, number, number]} />}
        {randomGeometry.type === 'box' && <boxGeometry args={randomGeometry.args as [number, number, number]} />}
        
        <MeshDistortMaterial
          color={color}
          metalness={0.3}
          roughness={0.2}
          distort={0.3}
          speed={2}
          emissive={color}
          emissiveIntensity={0.2}
        />
      </mesh>
    )
    
    setShapes(prev => [...prev, newShape])
  }

  useFrame(() => {
    if (shapesRef.current && audioData) {
      shapesRef.current.children.forEach((child, index) => {
        if (child instanceof THREE.Mesh) {
          // Audio reactivity
          const audioIndex = Math.floor((index / shapesRef.current!.children.length) * audioData.length)
          const audioValue = audioData[audioIndex] || 0
          const scaleFactor = 1 + audioValue * 0.5
          
          child.scale.setScalar(scaleFactor)
          child.rotation.x += 0.01 * (1 + audioValue)
          child.rotation.y += 0.01 * (1 + audioValue)
          
          // Mouse influence
          const distance = child.position.distanceTo(mousePosition)
          if (distance < 20) {
            const influence = 1 - (distance / 20)
            child.position.x += (mousePosition.x - child.position.x) * influence * 0.01
            child.position.y += (mousePosition.y - child.position.y) * influence * 0.01
            child.position.z += (mousePosition.z - child.position.z) * influence * 0.01
            
            if (child.material && 'emissiveIntensity' in child.material) {
              (child.material as any).emissiveIntensity = 0.2 + influence * 0.8
            }
          }
        }
      })
    }
  })

  // Handle mouse clicks to create shapes
  const handleClick = (event: MouseEvent) => {
    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    )
    
    raycaster.setFromCamera(mouse, camera)
    
    // Create shape at intersection point or at a default position
    const intersects = raycaster.intersectObjects(scene.children, true)
    let position: THREE.Vector3
    
    if (intersects.length > 0) {
      position = intersects[0].point
    } else {
      // Project mouse to 3D space at z=0
      const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5)
      vector.unproject(camera)
      vector.sub(camera.position).normalize()
      const distance = -camera.position.z / vector.z
      position = camera.position.clone().add(vector.multiplyScalar(distance))
    }
    
    createShape(position)
  }

  // Add click event listener
  useEffect(() => {
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  return (
    <group ref={shapesRef}>
      {shapes}
    </group>
  )
}

export default GeometryGenerator