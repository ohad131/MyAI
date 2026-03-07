"use client";

import React, { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Wand2, Download, Copy, Shuffle, Filter, Grid3X3,
  LayoutList, X, ChevronDown, Loader2, Star, Trash2, Share2
} from "lucide-react";
import { toast } from "sonner";
import LiquidButton from "@/components/LiquidButton";

const GALLERY = [
  { id: "1", prompt: "Futuristic city at night, neon lights, rain", model: "SDXL", size: "1024×1024", time: "2m ago", starred: true,
    url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&q=80" },
  { id: "2", prompt: "Abstract liquid metal sculpture, gold and silver", model: "FLUX", size: "1024×768", time: "15m ago", starred: false,
    url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
  { id: "3", prompt: "Minimalist workspace, morning light, coffee", model: "SDXL", size: "1024×1024", time: "1h ago", starred: true,
    url: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&q=80" },
  { id: "4", prompt: "Deep space nebula, purple and gold hues", model: "FLUX", size: "1920×1080", time: "2h ago", starred: false,
    url: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&q=80" },
  { id: "5", prompt: "Cyberpunk street market, holographic signs", model: "SDXL", size: "1024×1024", time: "3h ago", starred: false,
    url: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&q=80" },
  { id: "6", prompt: "Zen garden, morning mist, stone lantern", model: "FLUX", size: "1024×768", time: "5h ago", starred: true,
    url: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&q=80" },
];

const JOBS = [
  { id: "1", prompt: "Portrait of a robot philosopher", status: "running", progress: 67, model: "SDXL", eta: "12s" },
  { id: "2", prompt: "Isometric city block, low-poly", status: "queued", progress: 0, model: "FLUX", eta: "45s" },
];

const MODELS_LIST = ["SDXL 1.0", "FLUX Dev", "FLUX Schnell", "SD 3.5", "Kandinsky 3"];
const SIZES = ["512×512", "768×768", "1024×1024", "1024×768", "1920×1080"];

export default function ImagesPage() {
  const { theme } = useTheme();
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("SDXL 1.0");
  const [size, setSize] = useState("1024×1024");
  const [steps, setSteps] = useState(30);
  const [batch, setBatch] = useState(1);
  const [seed, setSeed] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedImage, setSelectedImage] = useState<typeof GALLERY[0] | null>(null);
  const [jobs, setJobs] = useState(JOBS);
  const isDark = theme === "dark";
  

  const generate = () => {
    if (!prompt.trim()) { toast.error("Enter a prompt first"); return; }
    const newJob = { id: Date.now().toString(), prompt, status: "running", progress: 0, model, eta: "30s" };
    setJobs(prev => [newJob, ...prev]);
    toast.success("Generation started!");
    setPrompt("");
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left: Prompt + Params ── */}
      <div
        className="w-72 flex flex-col border-r border-border shrink-0 overflow-y-auto"
        style={{ background: isDark ? "rgba(14,12,10,0.97)" : "rgba(245,247,250,0.97)" }}
      >
        <div className="px-4 py-4 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3">Generate Image</h2>

            {/* Prompt */}
            <div className="mb-3">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Prompt</label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Describe the image you want to create..."
                rows={4}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }}
              />
            </div>

            {/* Model */}
            <div className="mb-3">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Model</label>
              <select
                value={model}
                onChange={e => setModel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none appearance-none"
                style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }}
              >
                {MODELS_LIST.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Size */}
            <div className="mb-3">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Size</label>
              <div className="grid grid-cols-3 gap-1">
                {SIZES.map(s => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className="px-2 py-1.5 rounded-lg text-xs transition-all"
                    style={{
                      background: size === s ? (isDark ? "rgba(212,168,67,0.15)" : "rgba(59,130,246,0.1)") : "var(--muted)",
                      border: `1px solid ${size === s ? "var(--metal-border)" : "var(--border)"}`,
                      color: size === s ? "var(--metal)" : "var(--muted-foreground)"
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Steps */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-muted-foreground">Steps</label>
                <span className="text-xs font-mono" style={{ color: "var(--metal)" }}>{steps}</span>
              </div>
              <input
                type="range" min={10} max={50} value={steps}
                onChange={e => setSteps(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: "var(--metal)" }}
              />
            </div>

            {/* Batch + Seed */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Batch</label>
                <input
                  type="number" min={1} max={8} value={batch}
                  onChange={e => setBatch(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Seed</label>
                <div className="flex items-center gap-1">
                  <input
                    type="text" value={seed} onChange={e => setSeed(e.target.value)}
                    placeholder="Random"
                    className="flex-1 w-0 px-2 py-2 rounded-xl text-sm outline-none"
                    style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  />
                  <button onClick={() => setSeed(Math.floor(Math.random() * 999999).toString())} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-accent transition-all" style={{ color: "var(--muted-foreground)" }}>
                    <Shuffle size={12} />
                  </button>
                </div>
              </div>
            </div>

            <LiquidButton
              onClick={generate}
              size="sm"
            >
              <Wand2 size={13} />
              Generate
            </LiquidButton>
          </div>

          {/* Job Queue */}
          {jobs.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Queue</h3>
              <div className="space-y-2">
                {jobs.map(job => (
                  <div key={job.id} className="px-3 py-2.5 rounded-xl" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-foreground truncate flex-1">{job.prompt.slice(0, 30)}...</span>
                      <span className={`chip ml-2 ${job.status === "running" ? "chip-running" : "chip-local"}`}>
                        {job.status === "running" && <Loader2 size={8} className="animate-spin" />}
                        {job.status}
                      </span>
                    </div>
                    {job.status === "running" && (
                      <div className="w-full h-1 rounded-full" style={{ background: "var(--border)" }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${job.progress}%`, background: "var(--metal)" }}
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground">{job.model}</span>
                      <span className="text-xs text-muted-foreground">ETA: {job.eta}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Gallery ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Gallery toolbar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0" style={{ background: isDark ? "rgba(14,12,10,0.9)" : "rgba(248,249,251,0.9)" }}>
          <span className="text-sm font-semibold text-foreground">{GALLERY.length} images</span>
          <div className="flex-1" />
          <button onClick={() => toast("Filter gallery")} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs hover:bg-accent transition-all" style={{ color: "var(--muted-foreground)", border: "1px solid var(--border)" }}>
            <Filter size={12} />
            Filter
          </button>
          <div className="flex items-center rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <button onClick={() => setViewMode("grid")} className="px-2.5 py-1.5 transition-all" style={{ background: viewMode === "grid" ? "var(--metal-dim)" : "transparent", color: viewMode === "grid" ? "var(--metal)" : "var(--muted-foreground)" }}>
              <Grid3X3 size={13} />
            </button>
            <button onClick={() => setViewMode("list")} className="px-2.5 py-1.5 transition-all" style={{ background: viewMode === "list" ? "var(--metal-dim)" : "transparent", color: viewMode === "list" ? "var(--metal)" : "var(--muted-foreground)" }}>
              <LayoutList size={13} />
            </button>
          </div>
        </div>

        {/* Gallery grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className={`grid gap-3 ${viewMode === "grid" ? "grid-cols-3" : "grid-cols-1"}`}>
            {GALLERY.map(img => (
              <div
                key={img.id}
                className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-200"
                style={{ border: "1px solid var(--border)" }}
                onClick={() => setSelectedImage(img)}
              >
                <img src={img.url} alt={img.prompt} className={`w-full object-cover ${viewMode === "grid" ? "h-48" : "h-32"}`} />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-end">
                  <div className="w-full px-3 py-2 translate-y-full group-hover:translate-y-0 transition-transform duration-200" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)" }}>
                    <p className="text-white text-xs truncate">{img.prompt}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="chip chip-local text-xs">{img.model}</span>
                      <span className="text-white/60 text-xs">{img.size}</span>
                    </div>
                  </div>
                </div>
                {img.starred && (
                  <div className="absolute top-2 right-2">
                    <Star size={12} fill="var(--metal)" style={{ color: "var(--metal)" }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Image Detail Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 animate-blur-in" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} onClick={() => setSelectedImage(null)}>
          <div className="glass-panel rounded-2xl overflow-hidden max-w-2xl w-full animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <img src={selectedImage.url} alt={selectedImage.prompt} className="w-full h-72 object-cover" />
            <div className="p-4">
              <p className="text-sm text-foreground mb-2">{selectedImage.prompt}</p>
              <div className="flex items-center gap-2 mb-4">
                <span className="chip chip-local">{selectedImage.model}</span>
                <span className="text-xs text-muted-foreground">{selectedImage.size}</span>
                <span className="text-xs text-muted-foreground">{selectedImage.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <LiquidButton onClick={() => toast("Downloading...")} size="xs">
                  <Download size={11} />
                  Download
                </LiquidButton>
                <button onClick={() => toast("Prompt copied!")} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all hover:bg-accent" style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}>
                  <Copy size={12} />
                  Copy prompt
                </button>
                <button onClick={() => toast("Remixing...")} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all hover:bg-accent" style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}>
                  <Shuffle size={12} />
                  Remix
                </button>
                <div className="flex-1" />
                <button onClick={() => setSelectedImage(null)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-accent transition-all" style={{ color: "var(--muted-foreground)" }}>
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
