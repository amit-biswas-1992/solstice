import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { EntriesByDate, Project } from '../../types/models';

interface GraphViewProps {
  entries: EntriesByDate;
  onSelectDate: (dateKey: string) => void;
  projects: Project[];
  selectedDate: string;
}

interface GraphNode {
  color: string;
  id: string;
  label: string;
  radius: number;
  type: 'day' | 'project' | 'tag';
  vx: number;
  vy: number;
  x: number;
  y: number;
}

interface GraphEdge {
  source: string;
  strength: number;
  target: string;
}

const DAY_COLOR = '#e8e4dd';
const DAY_ACTIVE_COLOR = '#141413';
const PROJECT_COLORS = ['#1f4e79', '#8c5e34', '#2f6b5f', '#905a2a', '#5b4d9d', '#7a3e50', '#3d6b4f'];
const TAG_COLOR = '#b8a990';
const SELECTED_RING = '#1b67b2';

function buildGraph(entries: EntriesByDate, projects: Project[]): { edges: GraphEdge[]; nodes: GraphNode[] } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeMap = new Map<string, GraphNode>();

  projects.forEach((project, i) => {
    const node: GraphNode = {
      id: `project-${project.id}`,
      label: project.name,
      type: 'project',
      color: project.color ?? PROJECT_COLORS[i % PROJECT_COLORS.length],
      radius: 18,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0
    };
    nodes.push(node);
    nodeMap.set(node.id, node);
  });

  const tagSet = new Set<string>();
  const sortedDates = Object.keys(entries).sort();

  sortedDates.forEach((dateKey) => {
    const entry = entries[dateKey];
    const items = [...entry.notes, ...entry.tasks];
    if (items.length === 0) return;

    const activityLevel = Math.min(items.length, 10);
    const node: GraphNode = {
      id: `day-${dateKey}`,
      label: dateKey.slice(5),
      type: 'day',
      color: DAY_COLOR,
      radius: 6 + activityLevel * 1.5,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0
    };
    nodes.push(node);
    nodeMap.set(node.id, node);

    items.forEach((item) => {
      if (item.projectId) {
        const projectNodeId = `project-${item.projectId}`;
        if (nodeMap.has(projectNodeId)) {
          const existing = edges.find(
            (e) => (e.source === node.id && e.target === projectNodeId) ||
                   (e.source === projectNodeId && e.target === node.id)
          );
          if (existing) {
            existing.strength += 1;
          } else {
            edges.push({ source: node.id, target: projectNodeId, strength: 1 });
          }
        }
      }

      const noteTags = 'tags' in item && Array.isArray(item.tags) ? item.tags : [];
      noteTags.forEach((tag: string) => {
        const tagNodeId = `tag-${tag}`;
        if (!tagSet.has(tag)) {
          tagSet.add(tag);
          const tagNode: GraphNode = {
            id: tagNodeId,
            label: `#${tag}`,
            type: 'tag',
            color: TAG_COLOR,
            radius: 10,
            x: 0,
            y: 0,
            vx: 0,
            vy: 0
          };
          nodes.push(tagNode);
          nodeMap.set(tagNodeId, tagNode);
        }
        edges.push({ source: node.id, target: tagNodeId, strength: 1 });
      });
    });
  });

  // Connect consecutive active days with weak edges
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = sortedDates[i - 1];
    const curr = sortedDates[i];
    const prevDate = new Date(prev);
    const currDate = new Date(curr);
    const dayDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
    if (dayDiff <= 3) {
      edges.push({
        source: `day-${prev}`,
        target: `day-${curr}`,
        strength: 0.3
      });
    }
  }

  return { nodes, edges };
}

function initializePositions(nodes: GraphNode[], width: number, height: number) {
  const cx = width / 2;
  const cy = height / 2;
  nodes.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / nodes.length;
    const r = Math.min(width, height) * 0.3;
    node.x = cx + r * Math.cos(angle) + (Math.random() - 0.5) * 40;
    node.y = cy + r * Math.sin(angle) + (Math.random() - 0.5) * 40;
  });
}

function simulate(nodes: GraphNode[], edges: GraphEdge[], width: number, height: number) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const cx = width / 2;
  const cy = height / 2;

  // Repulsion
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const force = 800 / (dist * dist);
      dx = (dx / dist) * force;
      dy = (dy / dist) * force;
      a.vx -= dx;
      a.vy -= dy;
      b.vx += dx;
      b.vy += dy;
    }
  }

  // Attraction along edges
  edges.forEach((edge) => {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    if (!source || !target) return;

    let dx = target.x - source.x;
    let dy = target.y - source.y;
    const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
    const idealDist = 80;
    const force = (dist - idealDist) * 0.005 * edge.strength;
    dx = (dx / dist) * force;
    dy = (dy / dist) * force;
    source.vx += dx;
    source.vy += dy;
    target.vx -= dx;
    target.vy -= dy;
  });

  // Center gravity
  nodes.forEach((node) => {
    node.vx += (cx - node.x) * 0.001;
    node.vy += (cy - node.y) * 0.001;
  });

  // Apply velocity with damping
  nodes.forEach((node) => {
    node.vx *= 0.85;
    node.vy *= 0.85;
    node.x += node.vx;
    node.y += node.vy;
    node.x = Math.max(node.radius + 10, Math.min(width - node.radius - 10, node.x));
    node.y = Math.max(node.radius + 10, Math.min(height - node.radius - 10, node.y));
  });
}

export default function GraphView({ entries, onSelectDate, projects, selectedDate }: GraphViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const graphRef = useRef<{ edges: GraphEdge[]; nodes: GraphNode[] }>({ nodes: [], edges: [] });
  const animRef = useRef<number>(0);
  const iterRef = useRef(0);

  const graph = useMemo(() => buildGraph(entries, projects), [entries, projects]);

  useEffect(() => {
    graphRef.current = {
      nodes: graph.nodes.map((n) => ({ ...n })),
      edges: [...graph.edges]
    };
    initializePositions(graphRef.current.nodes, dimensions.width, dimensions.height);
    iterRef.current = 0;
  }, [graph, dimensions.width, dimensions.height]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: Math.floor(entry.contentRect.width),
          height: Math.floor(entry.contentRect.height)
        });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { nodes, edges } = graphRef.current;
    const { width, height } = dimensions;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    if (iterRef.current < 300) {
      simulate(nodes, edges, width, height);
      iterRef.current++;
    }

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    // Draw edges
    edges.forEach((edge) => {
      const source = nodeMap.get(edge.source);
      const target = nodeMap.get(edge.target);
      if (!source || !target) return;

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.strokeStyle = `rgba(180, 175, 165, ${Math.min(edge.strength * 0.15 + 0.05, 0.4)})`;
      ctx.lineWidth = Math.min(edge.strength * 0.5 + 0.5, 2.5);
      ctx.stroke();
    });

    // Draw nodes
    nodes.forEach((node) => {
      const isSelected =
        (node.type === 'day' && node.id === `day-${selectedDate}`) ||
        hoveredNode?.id === node.id;

      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);

      if (node.type === 'day') {
        const dayDate = node.id.replace('day-', '');
        const entry = entries[dayDate];
        const count = entry ? entry.notes.length + entry.tasks.length : 0;
        ctx.fillStyle = count > 0 ? DAY_ACTIVE_COLOR : DAY_COLOR;
        ctx.globalAlpha = count > 0 ? Math.min(0.3 + count * 0.1, 1) : 0.4;
      } else {
        ctx.fillStyle = node.color;
        ctx.globalAlpha = 0.85;
      }

      ctx.fill();
      ctx.globalAlpha = 1;

      if (isSelected) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 4, 0, Math.PI * 2);
        ctx.strokeStyle = SELECTED_RING;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Labels for projects/tags and hovered nodes
      if (node.type !== 'day' || isSelected || hoveredNode?.id === node.id) {
        ctx.fillStyle = '#141413';
        ctx.font = node.type === 'project' ? 'bold 11px Inter, sans-serif' : '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(node.label, node.x, node.y + node.radius + 5);
      }
    });

    animRef.current = requestAnimationFrame(draw);
  }, [dimensions, selectedDate, hoveredNode, entries]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const { nodes } = graphRef.current;
    for (const node of nodes) {
      const dx = node.x - x;
      const dy = node.y - y;
      if (dx * dx + dy * dy < (node.radius + 5) * (node.radius + 5)) {
        if (node.type === 'day') {
          onSelectDate(node.id.replace('day-', ''));
        }
        return;
      }
    }
  };

  const handleCanvasMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const { nodes } = graphRef.current;
    for (const node of nodes) {
      const dx = node.x - x;
      const dy = node.y - y;
      if (dx * dx + dy * dy < (node.radius + 5) * (node.radius + 5)) {
        setHoveredNode(node);
        if (canvasRef.current) canvasRef.current.style.cursor = node.type === 'day' ? 'pointer' : 'default';
        return;
      }
    }
    setHoveredNode(null);
    if (canvasRef.current) canvasRef.current.style.cursor = 'default';
  };

  const dayCount = Object.keys(entries).filter((k) => {
    const e = entries[k];
    return e.notes.length + e.tasks.length > 0;
  }).length;

  return (
    <section className="flex h-full flex-col rounded-[24px] border border-[color:var(--color-line)] bg-white">
      <header className="flex items-center justify-between px-6 pt-6 pb-2">
        <div>
          <p className="mb-1 text-[12px] font-medium uppercase tracking-[0.18em] text-[color:var(--color-copy-muted)]">
            Knowledge graph
          </p>
          <h2 className="text-[24px] leading-8 font-[330] text-[color:var(--color-ink)]">
            Connections
          </h2>
        </div>
        <div className="flex items-center gap-4 text-sm text-[color:var(--color-copy-muted)]">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#141413]" /> {dayCount} days
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#1f4e79]" /> {projects.length} projects
          </span>
        </div>
      </header>
      <div ref={containerRef} className="relative min-h-0 flex-1 px-3 pb-3">
        <canvas
          ref={canvasRef}
          className="h-full w-full rounded-[16px]"
          style={{ width: dimensions.width, height: dimensions.height }}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMove}
        />
        {hoveredNode && (
          <div
            className="pointer-events-none absolute rounded-lg border border-[color:var(--color-line)] bg-white px-3 py-1.5 text-xs shadow-lg"
            style={{
              left: Math.min(hoveredNode.x + 16, dimensions.width - 120),
              top: hoveredNode.y - 8
            }}
          >
            <span className="font-medium text-[color:var(--color-ink)]">{hoveredNode.label}</span>
            <span className="ml-2 text-[color:var(--color-copy-muted)]">{hoveredNode.type}</span>
          </div>
        )}
      </div>
    </section>
  );
}
