import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import * as d3 from 'd3';


interface QuantumFieldProps {
  noteProbabilities: { [note: number]: number };
}

const QuantumField: React.FC<QuantumFieldProps> = ({ noteProbabilities }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, 900 / 600, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
      renderer.setSize(900, 600);

      // Create a grid of spheres (notes)
      const keys = d3.range(21, 109);
      keys.forEach((note) => {
        const prob = noteProbabilities[note] || 0.2;
        const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        const sphereMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(`hsl(210, 100%, ${prob * 100}%)`) });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.set((note - 21) * 0.1 - 4, Math.random() * 2 - 1, Math.random() * 2 - 1);
        scene.add(sphere);
      });

      camera.position.z = 5;

      function animate() {
        requestAnimationFrame(animate);
        // Add subtle movement
        scene.children.forEach((child) => {
          if (child instanceof THREE.Mesh) {
            child.position.y += Math.sin(Date.now() * 0.001) * 0.01;
          }
        });
        renderer.render(scene, camera);
      }
      animate();
    }
  }, [noteProbabilities]);

  return <canvas ref={canvasRef} width={900} height={600} />;
};

export default QuantumField;