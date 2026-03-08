import { useRef, useEffect, useState, useCallback } from "react";
import { MapPin, Navigation, Skull, Loader2, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MapLocation {
  name: string;
  title?: string;
  region?: string;
  threat?: string;
  firstVisitedTurn?: number;
  x: number;
  y: number;
  isCurrent: boolean;
  hasSceneImage: boolean;
}

interface WorldMapProps {
  mapImage: string | null;
  locations: MapLocation[];
  generating?: boolean;
  isLoading?: boolean;
  onTravelTo?: (locationName: string) => void;
  fullscreen?: boolean;
}

const PIN_RADIUS = 6;
const GLOW_RADIUS = 14;
const FOG_REVEAL_RADIUS = 55;

export default function WorldMap({ mapImage, locations, generating, isLoading, onTravelTo, fullscreen }: WorldMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [pulsePhase, setPulsePhase] = useState(0);

  useEffect(() => {
    if (!mapImage) { setBgImage(null); return; }
    const img = new Image();
    img.onload = () => setBgImage(img);
    img.src = mapImage;
  }, [mapImage]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulsePhase(p => (p + 0.05) % (Math.PI * 2));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;

    ctx.fillStyle = "#1a1510";
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2 + pan.x, h / 2 + pan.y);
    ctx.scale(zoom, zoom);

    const mapSize = Math.min(w, h) * 1.4;
    const mapX = -mapSize / 2;
    const mapY = -mapSize / 2;

    if (bgImage) {
      ctx.drawImage(bgImage, mapX, mapY, mapSize, mapSize);
    } else {
      ctx.fillStyle = "#2a2015";
      ctx.fillRect(mapX, mapY, mapSize, mapSize);
      const gridSize = mapSize / 20;
      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 20; i++) {
        ctx.beginPath();
        ctx.moveTo(mapX + i * gridSize, mapY);
        ctx.lineTo(mapX + i * gridSize, mapY + mapSize);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(mapX, mapY + i * gridSize);
        ctx.lineTo(mapX + mapSize, mapY + i * gridSize);
        ctx.stroke();
      }
    }

    if (bgImage && locations.length > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "source-atop";
      ctx.fillStyle = "rgba(10, 8, 5, 0.7)";
      ctx.fillRect(mapX, mapY, mapSize, mapSize);

      ctx.globalCompositeOperation = "destination-out";
      for (const loc of locations) {
        const lx = mapX + (loc.x / 100) * mapSize;
        const ly = mapY + (loc.y / 100) * mapSize;
        const revealR = FOG_REVEAL_RADIUS * (mapSize / 500);
        const gradient = ctx.createRadialGradient(lx, ly, 0, lx, ly, revealR);
        gradient.addColorStop(0, "rgba(0,0,0,1)");
        gradient.addColorStop(0.7, "rgba(0,0,0,0.8)");
        gradient.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(lx, ly, revealR, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (locations.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(218, 165, 32, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      const sorted = [...locations].sort((a, b) => (a.firstVisitedTurn ?? 0) - (b.firstVisitedTurn ?? 0));
      for (let i = 0; i < sorted.length; i++) {
        const lx = mapX + (sorted[i].x / 100) * mapSize;
        const ly = mapY + (sorted[i].y / 100) * mapSize;
        if (i === 0) ctx.moveTo(lx, ly);
        else ctx.lineTo(lx, ly);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    for (const loc of locations) {
      const lx = mapX + (loc.x / 100) * mapSize;
      const ly = mapY + (loc.y / 100) * mapSize;

      if (loc.isCurrent) {
        const glowAlpha = 0.3 + Math.sin(pulsePhase) * 0.15;
        const glow = ctx.createRadialGradient(lx, ly, 0, lx, ly, GLOW_RADIUS);
        glow.addColorStop(0, `rgba(218, 165, 32, ${glowAlpha + 0.2})`);
        glow.addColorStop(1, "rgba(218, 165, 32, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(lx, ly, GLOW_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(lx, ly, PIN_RADIUS, 0, Math.PI * 2);
      if (loc.threat) {
        ctx.fillStyle = loc.isCurrent ? "#ef4444" : "#991b1b";
      } else {
        ctx.fillStyle = loc.isCurrent ? "#daa520" : "#8b7355";
      }
      ctx.fill();
      ctx.strokeStyle = loc.isCurrent ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)";
      ctx.lineWidth = loc.isCurrent ? 2 : 1;
      ctx.stroke();

      if (selectedLocation?.name === loc.name) {
        ctx.beginPath();
        ctx.arc(lx, ly, PIN_RADIUS + 4, 0, Math.PI * 2);
        ctx.strokeStyle = "#daa520";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      const fontSize = fullscreen ? 11 : 9;
      ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillText(loc.name, lx + 1, ly - PIN_RADIUS - 5 + 1);
      ctx.fillStyle = loc.isCurrent ? "#fff" : "rgba(255,255,255,0.7)";
      ctx.fillText(loc.name, lx, ly - PIN_RADIUS - 5);
    }

    ctx.restore();
  }, [bgImage, locations, pan, zoom, selectedLocation, pulsePhase, fullscreen]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => draw());
    observer.observe(container);
    return () => observer.disconnect();
  }, [draw]);

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.max(0.5, Math.min(4, z * delta)));
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (e.button === 0) {
      setDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setPanStart({ ...pan });
    }
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (dragging) {
      setPan({
        x: panStart.x + (e.clientX - dragStart.x),
        y: panStart.y + (e.clientY - dragStart.y),
      });
    }
  }

  function handleMouseUp(e: React.MouseEvent) {
    if (dragging) {
      const dist = Math.hypot(e.clientX - dragStart.x, e.clientY - dragStart.y);
      if (dist < 5) {
        handleClick(e);
      }
      setDragging(false);
    }
  }

  function handleClick(e: React.MouseEvent) {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const mapSize = Math.min(w, h) * 1.4;

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const worldX = (clickX - w / 2 - pan.x) / zoom;
    const worldY = (clickY - h / 2 - pan.y) / zoom;

    const mapX = -mapSize / 2;
    const mapY = -mapSize / 2;

    let closest: MapLocation | null = null;
    let closestDist = Infinity;

    for (const loc of locations) {
      const lx = mapX + (loc.x / 100) * mapSize;
      const ly = mapY + (loc.y / 100) * mapSize;
      const dist = Math.hypot(worldX - lx, worldY - ly);
      if (dist < 20 && dist < closestDist) {
        closest = loc;
        closestDist = dist;
      }
    }

    setSelectedLocation(closest);
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      setDragging(true);
      setDragStart({ x: t.clientX, y: t.clientY });
      setPanStart({ ...pan });
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (dragging && e.touches.length === 1) {
      const t = e.touches[0];
      setPan({
        x: panStart.x + (t.clientX - dragStart.x),
        y: panStart.y + (t.clientY - dragStart.y),
      });
    }
  }

  function handleTouchEnd() {
    setDragging(false);
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground p-4">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-xs font-sans text-center">Loading map data...</p>
      </div>
    );
  }

  if (!mapImage && generating) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground p-4">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-xs font-sans text-center">Generating region map...</p>
        <p className="text-[10px] text-muted-foreground/50 text-center">This may take a moment</p>
      </div>
    );
  }

  if (!mapImage && !generating && locations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground p-4">
        <MapPin className="w-6 h-6 text-muted-foreground/40" />
        <p className="text-xs font-sans text-center">No locations discovered yet</p>
        <p className="text-[10px] text-muted-foreground/50 text-center">Begin your adventure to reveal the map</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full select-none" data-testid="world-map">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setDragging(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {selectedLocation && (
        <div
          className="absolute bottom-2 left-2 right-2 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg z-10"
          data-testid={`map-popup-${selectedLocation.name}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {selectedLocation.threat ? (
                  <Skull className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                ) : (
                  <MapPin className={`w-3.5 h-3.5 flex-shrink-0 ${selectedLocation.isCurrent ? "text-primary" : "text-muted-foreground/50"}`} />
                )}
                <p className={`text-sm font-sans font-semibold truncate ${selectedLocation.isCurrent ? "text-primary" : "text-foreground"}`}>
                  {selectedLocation.name}
                </p>
                {selectedLocation.isCurrent && (
                  <span className="text-[10px] font-sans text-primary/70 bg-primary/10 px-1.5 rounded flex-shrink-0">here</span>
                )}
              </div>
              {selectedLocation.title && selectedLocation.title !== selectedLocation.name && (
                <p className="text-xs text-muted-foreground font-serif italic mt-0.5 ml-5">{selectedLocation.title}</p>
              )}
              {selectedLocation.region && (
                <p className="text-[10px] text-muted-foreground/60 mt-0.5 ml-5">{selectedLocation.region}</p>
              )}
              {selectedLocation.threat && (
                <p className="text-xs text-red-400/80 mt-1 ml-5 flex items-center gap-1">
                  <Skull className="w-2.5 h-2.5" /> {selectedLocation.threat}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {!selectedLocation.isCurrent && onTravelTo && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                  onClick={() => { onTravelTo(selectedLocation.name); setSelectedLocation(null); }}
                  data-testid={`map-travel-${selectedLocation.name}`}
                >
                  <Navigation className="w-3 h-3" /> Travel
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-muted-foreground"
                onClick={() => setSelectedLocation(null)}
              >
                ×
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
        <button
          onClick={() => setZoom(z => Math.min(4, z * 1.3))}
          className="w-7 h-7 rounded bg-card/80 border border-border text-foreground flex items-center justify-center hover:bg-card text-sm font-bold"
          data-testid="map-zoom-in"
        >
          +
        </button>
        <button
          onClick={() => setZoom(z => Math.max(0.5, z * 0.7))}
          className="w-7 h-7 rounded bg-card/80 border border-border text-foreground flex items-center justify-center hover:bg-card text-sm font-bold"
          data-testid="map-zoom-out"
        >
          −
        </button>
        <button
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          className="w-7 h-7 rounded bg-card/80 border border-border text-foreground flex items-center justify-center hover:bg-card text-[10px]"
          data-testid="map-reset"
        >
          ⌖
        </button>
      </div>

      {generating && (
        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-card/80 border border-border rounded px-2 py-1 z-10">
          <Loader2 className="w-3 h-3 animate-spin text-primary" />
          <span className="text-[10px] text-muted-foreground">Generating map...</span>
        </div>
      )}
    </div>
  );
}
