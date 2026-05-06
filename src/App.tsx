/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sky, Stars, Plane, Box, Environment, PerspectiveCamera, Center } from "@react-three/drei";
import { motion, AnimatePresence } from "motion/react";
import { Box as BoxIcon, Play, Loader2, RefreshCw, Cpu, Camera } from "lucide-react";
import { generateSceneFromPrompt, SceneConfig } from "./services/geminiService";

// default scene configuration
const defaultScene: SceneConfig = {
  gameType: "Initial Scene",
  environment: {
    skyColor: "#87ceeb",
    groundColor: "#2a2a2a",
  },
  objects: [
    { type: "car", color: "#ff4444", position: [0, 0.5, 0] },
  ],
  camera: {
    position: [10, 10, 10],
  },
};

function Scene({ config }: { config: SceneConfig }) {
  return (
    <>
      <color attach="background" args={[config.environment.skyColor]} />
      <Sky sunPosition={[100, 10, 100]} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <directionalLight 
        position={[-10, 20, 10]} 
        intensity={1.5} 
        castShadow 
        shadow-mapSize={[1024, 1024]}
      />

      {/* Ground / Road */}
      <Plane 
        args={[100, 100]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        receiveShadow
      >
        <meshStandardMaterial color={config.environment.groundColor} />
      </Plane>

      {/* Dynamic Objects */}
      {config.objects.map((obj, i) => {
        if (obj.type === "car" || obj.type === "cube") {
          return (
            <group key={i} position={obj.position as [number, number, number]}>
               <Box castShadow receiveShadow args={[1, 1, 1]}>
                  <meshStandardMaterial color={obj.color} />
               </Box>
            </group>
          );
        }
        if (obj.type === "road") {
           return (
            <Plane 
              key={i}
              args={[10, 50]} 
              position={obj.position as [number, number, number]}
              rotation={[-Math.PI / 2, 0, 0]} 
              receiveShadow
            >
              <meshStandardMaterial color={obj.color} />
            </Plane>
           )
        }
        return null;
      })}
      
      <PerspectiveCamera 
        makeDefault 
        position={config.camera.position as [number, number, number]} 
      />
      <OrbitControls makeDefault />
    </>
  );
}

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [sceneConfig, setSceneConfig] = useState<SceneConfig>(defaultScene);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const config = await generateSceneFromPrompt(prompt);
      setSceneConfig(config);
    } catch (err) {
      console.error(err);
      setError("Failed to generate scene. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full h-screen bg-[#141414] text-white font-sans overflow-hidden">
      {/* 3D Canvas - Background */}
      <div className="absolute inset-0 z-0">
        <Canvas shadows>
          <Suspense fallback={null}>
            <Scene config={sceneConfig} />
          </Suspense>
        </Canvas>
      </div>

      {/* UI Overlay - Dashboard Style */}
      <div className="relative z-10 p-6 pointer-events-none h-full flex flex-col justify-between">
        {/* Header */}
        <header className="flex justify-between items-start pointer-events-auto">
          <div className="flex flex-col">
            <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">
              Dream3D
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-mono opacity-50 uppercase tracking-widest leading-loose">
                AI Instance: Active // {sceneConfig.gameType}
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => window.location.reload()}
              className="p-3 bg-[#1a1a1a] border border-white/10 rounded-full hover:bg-white hover:text-black transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Input Bar */}
        <div className="max-w-2xl w-full mx-auto pointer-events-auto mb-12">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="group relative bg-[#1a1a1a] border border-white/10 rounded-2xl p-2 shadow-2xl focus-within:border-white/30 transition-all backdrop-blur-md"
          >
            <div className="flex items-center gap-4 px-4">
              <Cpu className="w-5 h-5 opacity-30 group-focus-within:opacity-100 transition-opacity" />
              <input 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                placeholder="Describe your 3D world... (e.g. 'Red car on a midnight highway')"
                className="flex-1 py-4 bg-transparent outline-none text-sm placeholder:opacity-30"
              />
              <button 
                onClick={handleGenerate}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-white text-black font-bold text-xs uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-lg"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    Generate
                  </>
                )}
              </button>
            </div>
            {error && (
              <div className="absolute -top-10 left-0 right-0 text-center">
                <span className="text-red-400 text-[10px] font-mono bg-red-400/10 px-3 py-1 rounded-full border border-red-400/20">
                  {error}
                </span>
              </div>
            )}
          </motion.div>
          
          {/* Prompt Suggestions */}
          <div className="flex justify-center gap-4 mt-6">
            {["Neon Cyberpunk City", "Retro Synthwave Road", "Desert Oasis at Sunset"].map((item) => (
              <button 
                key={item}
                onClick={() => setPrompt(item)}
                className="text-[10px] font-mono opacity-40 hover:opacity-100 transition-opacity uppercase tracking-tighter"
              >
                [ {item} ]
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(wrap,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
    </div>
  );
}

