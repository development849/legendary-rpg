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
  error?: boolean;
  onTravelTo?: (locationName: string) => void;
  fullscreen?: boolean;
}

const PIN_RADIUS = 6;
const GLOW_RADIUS = 14;
const FOG_REVEAL_RADIUS = 60;

const THREAT_KEYWORDS = /combat|fight|attack|hostile|danger|enemy|monster|creature|ambush|bandits?|wolves?|ogre|dragon|undead|skeleton|goblin|threat|armed|battle|raid|siege|swarm/i;

function isTrueThreat(threat?: string | null): boolean {
  if (!threat) return false;
  return THREAT_KEYWORDS.test(threat);
}

const LEGEND_ITEMS: { type: LocType; label: string }[] = [
  { type: "town", label: "Town" },
  { type: "tavern", label: "Tavern" },
  { type: "market", label: "Market" },
  { type: "castle", label: "Castle" },
  { type: "gate", label: "Gate" },
  { type: "temple", label: "Temple" },
  { type: "forest", label: "Forest" },
  { type: "water", label: "Water" },
  { type: "cave", label: "Cave" },
  { type: "camp", label: "Camp" },
  { type: "road", label: "Road" },
  { type: "port", label: "Port" },
  { type: "mill", label: "Mill" },
  { type: "mine", label: "Mine" },
];

type LocType = "town" | "tavern" | "market" | "gate" | "road" | "forest" | "water" | "cave" | "temple" | "mill" | "camp" | "castle" | "port" | "mine" | "generic";

function detectLocationType(name: string): LocType {
  const n = name.toLowerCase();
  if (/tavern|inn|pub|bar|ale\s?house/.test(n)) return "tavern";
  if (/market|shop|bazaar|merchant|store|trade/.test(n)) return "market";
  if (/gate|wall|entrance|door/.test(n)) return "gate";
  if (/road|path|trail|highway|bridge|cobblestone|route/.test(n)) return "road";
  if (/forest|wood|grove|glade|thicket|jungle/.test(n)) return "forest";
  if (/creek|river|lake|sea|ocean|bay|harbor|shore|waterfall|pond|swamp|marsh|\bford\b/.test(n)) return "water";
  if (/cave|cavern|tunnel|underground|mine|quarry/.test(n)) return "cave";
  if (/temple|church|shrine|chapel|sanctuary|cathedral|monastery/.test(n)) return "temple";
  if (/mill|farm|field|barn|windmill/.test(n)) return "mill";
  if (/camp|clearing|site|ruin|rock|boulder/.test(n)) return "camp";
  if (/castle|palace|fortress|keep|citadel|tower/.test(n)) return "castle";
  if (/port|dock|pier|wharf|harbor/.test(n)) return "port";
  if (/town|city|village|hamlet|settlement|haven|burg|borough|stead|hold|.+ford$/.test(n)) return "town";
  return "generic";
}

function drawLocIcon(ctx: CanvasRenderingContext2D, type: LocType, x: number, y: number, size: number) {
  ctx.save();
  ctx.lineWidth = 1.2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const s = size;
  const hs = s / 2;

  switch (type) {
    case "town":
      ctx.strokeStyle = "#c9a857";
      ctx.beginPath();
      ctx.moveTo(x - hs, y + hs);
      ctx.lineTo(x - hs, y - hs * 0.3);
      ctx.lineTo(x - hs * 0.3, y - hs);
      ctx.lineTo(x + hs * 0.3, y - hs);
      ctx.lineTo(x + hs, y - hs * 0.3);
      ctx.lineTo(x + hs, y + hs);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - hs * 0.2, y + hs);
      ctx.lineTo(x - hs * 0.2, y);
      ctx.lineTo(x + hs * 0.2, y);
      ctx.lineTo(x + hs * 0.2, y + hs);
      ctx.stroke();
      break;
    case "tavern":
      ctx.strokeStyle = "#b87333";
      ctx.beginPath();
      ctx.arc(x, y - hs * 0.2, hs * 0.6, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y - hs * 0.2);
      ctx.lineTo(x, y + hs);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - hs * 0.4, y + hs);
      ctx.lineTo(x + hs * 0.4, y + hs);
      ctx.stroke();
      break;
    case "market":
      ctx.strokeStyle = "#c9a857";
      ctx.beginPath();
      ctx.moveTo(x - hs, y - hs * 0.5);
      ctx.lineTo(x, y - hs);
      ctx.lineTo(x + hs, y - hs * 0.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - hs * 0.7, y - hs * 0.5);
      ctx.lineTo(x - hs * 0.7, y + hs);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + hs * 0.7, y - hs * 0.5);
      ctx.lineTo(x + hs * 0.7, y + hs);
      ctx.stroke();
      break;
    case "gate":
      ctx.strokeStyle = "#8b8b83";
      ctx.beginPath();
      ctx.arc(x, y - hs * 0.2, hs * 0.5, Math.PI, 0);
      ctx.lineTo(x + hs * 0.5, y + hs);
      ctx.moveTo(x - hs * 0.5, y - hs * 0.2);
      ctx.lineTo(x - hs * 0.5, y + hs);
      ctx.stroke();
      break;
    case "forest":
      ctx.strokeStyle = "#5b7a3b";
      ctx.beginPath();
      ctx.moveTo(x, y - hs);
      ctx.lineTo(x - hs * 0.6, y + hs * 0.3);
      ctx.lineTo(x + hs * 0.6, y + hs * 0.3);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y + hs * 0.3);
      ctx.lineTo(x, y + hs);
      ctx.stroke();
      break;
    case "water":
      ctx.strokeStyle = "#4a7a9b";
      ctx.beginPath();
      ctx.moveTo(x - hs, y - hs * 0.3);
      ctx.quadraticCurveTo(x - hs * 0.3, y - hs, x, y - hs * 0.3);
      ctx.quadraticCurveTo(x + hs * 0.3, y + hs * 0.3, x + hs, y - hs * 0.3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - hs * 0.7, y + hs * 0.3);
      ctx.quadraticCurveTo(x, y - hs * 0.2, x + hs * 0.7, y + hs * 0.3);
      ctx.stroke();
      break;
    case "cave":
      ctx.strokeStyle = "#7a6b5b";
      ctx.beginPath();
      ctx.moveTo(x - hs, y + hs);
      ctx.lineTo(x, y - hs);
      ctx.lineTo(x + hs, y + hs);
      ctx.stroke();
      break;
    case "temple":
      ctx.strokeStyle = "#9b8bbb";
      ctx.beginPath();
      ctx.moveTo(x - hs * 0.15, y - hs);
      ctx.lineTo(x - hs * 0.15, y + hs);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + hs * 0.15, y - hs);
      ctx.lineTo(x + hs * 0.15, y + hs);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - hs * 0.6, y);
      ctx.lineTo(x + hs * 0.6, y);
      ctx.stroke();
      break;
    case "castle":
      ctx.strokeStyle = "#8b7b6b";
      ctx.beginPath();
      ctx.rect(x - hs, y - hs * 0.5, s, hs * 1.5);
      ctx.stroke();
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const bx = x - hs + i * hs;
        ctx.rect(bx, y - hs, hs * 0.4, hs * 0.5);
      }
      ctx.stroke();
      break;
    case "mill":
      ctx.strokeStyle = "#8b7b4b";
      ctx.beginPath();
      ctx.moveTo(x, y - hs);
      ctx.lineTo(x, y + hs);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - hs, y - hs * 0.3);
      ctx.lineTo(x + hs, y + hs * 0.3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + hs, y - hs * 0.3);
      ctx.lineTo(x - hs, y + hs * 0.3);
      ctx.stroke();
      break;
    case "camp":
      ctx.strokeStyle = "#8b6b3b";
      ctx.beginPath();
      ctx.moveTo(x, y - hs);
      ctx.lineTo(x - hs, y + hs);
      ctx.lineTo(x + hs, y + hs);
      ctx.closePath();
      ctx.stroke();
      break;
    case "road":
      ctx.strokeStyle = "#9b8b6b";
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(x - hs, y + hs * 0.5);
      ctx.quadraticCurveTo(x, y - hs, x + hs, y + hs * 0.5);
      ctx.stroke();
      ctx.setLineDash([]);
      break;
    case "port":
      ctx.strokeStyle = "#4a7a9b";
      ctx.beginPath();
      ctx.arc(x, y, hs * 0.6, 0.3, Math.PI - 0.3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y - hs);
      ctx.lineTo(x, y + hs * 0.4);
      ctx.stroke();
      break;
    default:
      ctx.fillStyle = "#8b7355";
      ctx.beginPath();
      ctx.arc(x, y, hs * 0.4, 0, Math.PI * 2);
      ctx.fill();
      break;
  }
  ctx.restore();
}

function getLocColor(type: LocType, isCurrent: boolean): string {
  if (isCurrent) return "#daa520";
  switch (type) {
    case "town": return "#c9a857";
    case "tavern": return "#b87333";
    case "market": return "#c9a857";
    case "gate": return "#8b8b83";
    case "road": return "#9b8b6b";
    case "forest": return "#5b7a3b";
    case "water": return "#4a7a9b";
    case "cave": return "#7a6b5b";
    case "temple": return "#9b8bbb";
    case "mill": return "#8b7b4b";
    case "camp": return "#8b6b3b";
    case "castle": return "#8b7b6b";
    case "port": return "#4a7a9b";
    default: return "#8b7355";
  }
}

export default function WorldMap({ mapImage, locations, generating, isLoading, error, onTravelTo, fullscreen }: WorldMapProps) {
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
  const [showLegend, setShowLegend] = useState(false);

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

      if (locations.length > 0) {
        const fogCanvas = document.createElement("canvas");
        fogCanvas.width = canvas.width;
        fogCanvas.height = canvas.height;
        const fogCtx = fogCanvas.getContext("2d");
        if (fogCtx) {
          fogCtx.scale(dpr, dpr);
          fogCtx.save();
          fogCtx.translate(w / 2 + pan.x, h / 2 + pan.y);
          fogCtx.scale(zoom, zoom);

          fogCtx.fillStyle = "rgba(10, 8, 5, 0.75)";
          fogCtx.fillRect(mapX, mapY, mapSize, mapSize);

          fogCtx.globalCompositeOperation = "destination-out";
          for (const loc of locations) {
            const lx = mapX + (loc.x / 100) * mapSize;
            const ly = mapY + (loc.y / 100) * mapSize;
            const revealR = FOG_REVEAL_RADIUS * (mapSize / 500);
            const gradient = fogCtx.createRadialGradient(lx, ly, 0, lx, ly, revealR);
            gradient.addColorStop(0, "rgba(0,0,0,1)");
            gradient.addColorStop(0.6, "rgba(0,0,0,0.9)");
            gradient.addColorStop(1, "rgba(0,0,0,0)");
            fogCtx.fillStyle = gradient;
            fogCtx.beginPath();
            fogCtx.arc(lx, ly, revealR, 0, Math.PI * 2);
            fogCtx.fill();
          }
          fogCtx.restore();

          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.drawImage(fogCanvas, 0, 0);
          ctx.restore();
        }
      }
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

    if (locations.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(218, 165, 32, 0.3)";
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
      const locType = detectLocationType(loc.name);

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

      const hasTrueThreat = isTrueThreat(loc.threat);
      const pinColor = hasTrueThreat
        ? (loc.isCurrent ? "#ef4444" : "#991b1b")
        : getLocColor(locType, loc.isCurrent);

      ctx.beginPath();
      ctx.arc(lx, ly, PIN_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = pinColor;
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

      const iconSize = fullscreen ? 12 : 10;
      if (hasTrueThreat) {
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(lx, ly - PIN_RADIUS - 10, iconSize * 0.35, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(lx - iconSize * 0.15, ly - PIN_RADIUS - 10 + iconSize * 0.1);
        ctx.lineTo(lx - iconSize * 0.15, ly - PIN_RADIUS - 10 - iconSize * 0.1);
        ctx.moveTo(lx + iconSize * 0.15, ly - PIN_RADIUS - 10 + iconSize * 0.1);
        ctx.lineTo(lx + iconSize * 0.15, ly - PIN_RADIUS - 10 - iconSize * 0.1);
        ctx.stroke();
      } else {
        drawLocIcon(ctx, locType, lx, ly - PIN_RADIUS - 10, iconSize);
      }

      const fontSize = fullscreen ? 11 : 9;
      ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillText(loc.name, lx + 1, ly + PIN_RADIUS + fontSize + 3 + 1);
      ctx.fillStyle = loc.isCurrent ? "#fff" : "rgba(255,255,255,0.75)";
      ctx.fillText(loc.name, lx, ly + PIN_RADIUS + fontSize + 3);
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

    const mapXOff = -mapSize / 2;
    const mapYOff = -mapSize / 2;

    let closest: MapLocation | null = null;
    let closestDist = Infinity;

    for (const loc of locations) {
      const lx = mapXOff + (loc.x / 100) * mapSize;
      const ly = mapYOff + (loc.y / 100) * mapSize;
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground p-4">
        <MapPin className="w-6 h-6 text-muted-foreground/40" />
        <p className="text-xs font-sans text-center">Could not load map data</p>
        <p className="text-[10px] text-muted-foreground/50 text-center">Try refreshing the page</p>
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
                {isTrueThreat(selectedLocation.threat) ? (
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
              {isTrueThreat(selectedLocation.threat) && (
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

      <div className="absolute bottom-2 right-2 z-10" data-testid="map-legend">
        <button
          onClick={() => setShowLegend(l => !l)}
          className="w-7 h-7 rounded bg-card/80 border border-border text-foreground flex items-center justify-center hover:bg-card text-[10px] font-bold"
          data-testid="map-legend-toggle"
          title="Map Key"
        >
          ?
        </button>
        {showLegend && (
          <div className="absolute bottom-8 right-0 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-2.5 shadow-lg min-w-[140px]">
            <p className="text-[10px] font-sans font-bold text-foreground/80 mb-1.5 tracking-wide uppercase">Map Key</p>
            <div className="space-y-1">
              {LEGEND_ITEMS.map(item => {
                const usedTypes = new Set(locations.map(l => detectLocationType(l.name)));
                if (!usedTypes.has(item.type) && locations.length > 0) return null;
                const color = getLocColor(item.type, false);
                return (
                  <div key={item.type} className="flex items-center gap-2">
                    <canvas
                      ref={el => {
                        if (!el) return;
                        const c = el.getContext("2d");
                        if (!c) return;
                        const dpr = window.devicePixelRatio || 1;
                        el.width = 16 * dpr;
                        el.height = 16 * dpr;
                        el.style.width = "16px";
                        el.style.height = "16px";
                        c.scale(dpr, dpr);
                        c.clearRect(0, 0, 16, 16);
                        drawLocIcon(c, item.type, 8, 8, 10);
                      }}
                      className="flex-shrink-0"
                    />
                    <span className="text-[10px] font-sans" style={{ color }}>{item.label}</span>
                  </div>
                );
              })}
              {locations.some(l => isTrueThreat(l.threat)) && (
                <div className="flex items-center gap-2">
                  <Skull className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span className="text-[10px] font-sans text-red-400">Danger</span>
                </div>
              )}
              <div className="flex items-center gap-2 mt-1 pt-1 border-t border-border/50">
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#daa520] shadow-[0_0_6px_rgba(218,165,32,0.5)]" />
                </div>
                <span className="text-[10px] font-sans text-[#daa520]">Current</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
