import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial, Points, PointMaterial } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';

const AnimatedSphere = () => {
  const sphereRef = useRef();
  
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (sphereRef.current) {
      sphereRef.current.rotation.y = t / 6; // Slow rotation
      sphereRef.current.distort = 0.4 + Math.sin(t) * 0.1; // "Breathing" effect
    }
  });

  return (
    <Sphere ref={sphereRef} args={[1.8, 64, 64]} scale={1.2}>
      <MeshDistortMaterial
        color="#4f46e5" // Indigo color
        attach="material"
        distort={0.5} // Strength of distortion
        speed={2} // Speed of distortion
        roughness={0}
        metalness={1}
        wireframe={true} // Wireframe looks very "tech"
        emissive="#312e81" // Glow
        emissiveIntensity={0.5}
      />
    </Sphere>
  );
};

const FloatingParticles = () => {
  const ref = useRef();
  const sphere = random.inSphere(new Float32Array(1500), { radius: 3.5 }); // 1500 particles

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#a5b4fc" // Light indigo particles
          size={0.02}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
};

const HolographicSphere = () => {
  return (
    <div className="h-[600px] w-full">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <AnimatedSphere />
        <FloatingParticles />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
};

export default HolographicSphere;