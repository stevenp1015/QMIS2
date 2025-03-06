"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const THREE = __importStar(require("three"));
const d3 = __importStar(require("d3"));
const QuantumField = ({ noteProbabilities }) => {
    const canvasRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
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
    return react_1.default.createElement("canvas", { ref: canvasRef, width: 900, height: 600 });
};
exports.default = QuantumField;
