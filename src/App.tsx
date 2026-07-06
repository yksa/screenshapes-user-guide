import React, { useState, useRef, useCallback, useEffect } from 'react';
import html2canvas from 'html2canvas-pro';

const DEFAULT_TITLE_COLOR = '#18181b';

type LayoutMode = 'horizontal' | 'vertical';
type BackgroundPresetId =
  | 'mesh-gradient'
  | 'dot-grid'
  | 'light-canvas'
  | 'transparent'
  | 'dark-charcoal'
  | 'diagonal-stripes'
  | 'soft-pastel'
  | 'slate-gradient';

interface Step {
  id: string;
  src: string;
  type: 'phone' | 'laptop';
  title: string;
  isCustomTitle: boolean;
  titleColor: string;
  objectFit: 'cover' | 'contain';
  description: string;
}

interface BackgroundPreset {
  id: BackgroundPresetId;
  label: string;
  style: React.CSSProperties;
  isDark: boolean;
  exportBackgroundColor: string | null;
}

const DOT_GRID_PATTERN = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><circle cx="10" cy="10" r="1" fill="#cbd5e1"/></svg>'
)}")`;

const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: 'mesh-gradient',
    label: 'Soft Mesh',
    isDark: false,
    exportBackgroundColor: '#fafafa',
    style: {
      backgroundColor: '#fafafa',
      backgroundImage: `
        radial-gradient(ellipse 80% 60% at 40% 20%, hsla(228, 100%, 74%, 0.35) 0%, transparent 70%),
        radial-gradient(ellipse 70% 50% at 80% 10%, hsla(189, 100%, 56%, 0.25) 0%, transparent 70%),
        radial-gradient(ellipse 60% 50% at 10% 50%, hsla(355, 100%, 93%, 0.35) 0%, transparent 70%),
        radial-gradient(ellipse 70% 55% at 85% 55%, hsla(340, 100%, 76%, 0.25) 0%, transparent 70%),
        radial-gradient(ellipse 80% 60% at 20% 90%, hsla(22, 100%, 77%, 0.28) 0%, transparent 70%),
        radial-gradient(ellipse 60% 50% at 70% 85%, hsla(228, 100%, 74%, 0.2) 0%, transparent 70%)
      `.replace(/\s+/g, ' '),
    },
  },
  {
    id: 'dot-grid',
    label: 'Dot Grid',
    isDark: false,
    exportBackgroundColor: '#f8fafc',
    style: {
      backgroundColor: '#f8fafc',
      backgroundImage: DOT_GRID_PATTERN,
      backgroundSize: '20px 20px',
      backgroundRepeat: 'repeat',
    },
  },
  {
    id: 'light-canvas',
    label: 'Light Canvas',
    isDark: false,
    exportBackgroundColor: '#f4f4f5',
    style: { backgroundColor: '#f4f4f5' },
  },
  {
    id: 'transparent',
    label: 'Transparent',
    isDark: false,
    exportBackgroundColor: null,
    style: { backgroundColor: 'transparent' },
  },
  {
    id: 'dark-charcoal',
    label: 'Dark Charcoal',
    isDark: true,
    exportBackgroundColor: '#18181b',
    style: {
      backgroundColor: '#18181b',
      backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.04) 0%, transparent 60%)',
    },
  },
  {
    id: 'diagonal-stripes',
    label: 'Diagonal Stripes',
    isDark: false,
    exportBackgroundColor: '#f1f5f9',
    style: {
      backgroundColor: '#f1f5f9',
      backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 12px, rgba(148,163,184,0.15) 12px, rgba(148,163,184,0.15) 13px)',
    },
  },
  {
    id: 'soft-pastel',
    label: 'Soft Pastel',
    isDark: false,
    exportBackgroundColor: '#ecfdf5',
    style: {
      backgroundColor: '#ecfdf5',
      backgroundImage: 'linear-gradient(135deg, rgba(167,243,208,0.4) 0%, rgba(191,219,254,0.4) 100%)',
    },
  },
  {
    id: 'slate-gradient',
    label: 'Slate Gradient',
    isDark: true,
    exportBackgroundColor: '#0f172a',
    style: {
      backgroundColor: '#0f172a',
      backgroundImage: 'linear-gradient(160deg, #1e293b 0%, #0f172a 50%, #020617 100%)',
    },
  },
];

const getBackgroundPreset = (id: BackgroundPresetId) =>
  BACKGROUND_PRESETS.find((p) => p.id === id) ?? BACKGROUND_PRESETS[2];

const applyBackgroundToElement = (el: HTMLElement, preset: BackgroundPreset) => {
  if (preset.id === 'transparent') {
    el.style.background = 'transparent';
    el.style.backgroundColor = 'transparent';
    el.style.backgroundImage = 'none';
    el.style.backgroundSize = '';
    el.style.backgroundRepeat = '';
    return;
  }

  const bgColor = (preset.style.backgroundColor as string) ?? 'transparent';
  const bgImage =
    preset.id === 'dot-grid'
      ? DOT_GRID_PATTERN
      : ((preset.style.backgroundImage as string) ?? 'none');
  const bgSize = (preset.style.backgroundSize as string) ?? '';
  const bgRepeat = bgSize ? 'repeat' : 'no-repeat';

  el.style.backgroundColor = bgColor;
  el.style.backgroundImage = bgImage;
  el.style.backgroundSize = bgSize;
  el.style.backgroundRepeat = bgRepeat;
  el.style.backgroundPosition = '0 0';
};

const prepareExportDom = (root: HTMLElement) => {
  const hidden: { el: HTMLElement; display: string }[] = [];
  root.querySelectorAll<HTMLElement>('.export-hide').forEach((el) => {
    hidden.push({ el, display: el.style.display });
    el.style.display = 'none';
  });

  const inner = root.querySelector<HTMLElement>('.export-workflow-inner');
  const savedPaddingBottom = inner?.style.paddingBottom ?? '';
  if (inner) inner.style.paddingBottom = '3rem';

  return () => {
    hidden.forEach(({ el, display }) => {
      el.style.display = display;
    });
    if (inner) inner.style.paddingBottom = savedPaddingBottom;
  };
};

const compositeDotGridExport = (
  source: HTMLCanvasElement,
  scale: number,
  bgColor: string,
  dotColor: string,
  spacing: number,
  dotRadius: number,
) => {
  const output = document.createElement('canvas');
  output.width = source.width;
  output.height = source.height;
  const ctx = output.getContext('2d');
  if (!ctx) return source;

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, output.width, output.height);

  const step = spacing * scale;
  const radius = dotRadius * scale;
  ctx.fillStyle = dotColor;
  for (let x = step / 2; x < output.width; x += step) {
    for (let y = step / 2; y < output.height; y += step) {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.drawImage(source, 0, 0);
  return output;
};

// --- Icons (Inline SVGs for self-containment) ---
const Icons = {
  Upload: ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
  ),
  Smartphone: ({ className = "w-4 h-4" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
  ),
  Laptop: ({ className = "w-4 h-4" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/></svg>
  ),
  Trash: ({ className = "w-4 h-4" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
  ),
  Copy: ({ className = "w-4 h-4" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
  ),
  ArrowRight: ({ className = "w-6 h-6", strokeWidth = "3" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
  ),
  Download: ({ className = "w-4 h-4" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
  ),
  Grip: ({ className = "w-4 h-4" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
  ),
  Sliders: ({ className = "w-4 h-4" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="2" x2="6" y1="14" y2="14"/><line x1="10" x2="14" y1="8" y2="8"/><line x1="18" x2="22" y1="16" y2="16"/></svg>
  ),
  Palette: ({ className = "w-4 h-4" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.123-.29-.289-.438-.652-.438-1.123a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
  ),
  ArrowDown: ({ className = "w-6 h-6", strokeWidth = "3" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
  ),
  LayoutHorizontal: ({ className = "w-4 h-4" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="m14 9 3 3-3 3"/></svg>
  ),
  LayoutVertical: ({ className = "w-4 h-4" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="m9 14 3 3 3-3"/></svg>
  ),
};


// --- Step Description (auto-resizing) ---

const DESCRIPTION_WIDTH = {
  phone: 340,
  laptop: 640,
} as const;

const StepDescription = ({
  value,
  onChange,
  width,
  isDarkBg,
}: {
  value: string;
  onChange: (value: string) => void;
  width: number;
  isDarkBg: boolean;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    resize();
  }, [value, width, resize]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
        resize();
      }}
      onInput={resize}
      rows={1}
      placeholder="Add action directions, details, or button click descriptions here…"
      style={{ width: `${width}px` }}
      className={`export-description text-[15px] leading-relaxed font-normal tracking-normal text-center rounded-xl px-4 py-3 resize-none overflow-hidden transition-colors ${
        isDarkBg
          ? 'bg-zinc-800/60 text-zinc-200 placeholder:text-zinc-500 border border-zinc-700/50 focus:border-zinc-500 focus:outline-none'
          : 'bg-zinc-100/90 text-zinc-600 placeholder:text-zinc-400 border border-zinc-200/60 focus:border-zinc-300 focus:outline-none'
      }`}
    />
  );
};


// --- Device Frame Components ---

const PhoneFrame = ({ src, objectFit = 'cover' }: { src: string; objectFit?: 'cover' | 'contain' }) => (
  <div className="relative border-[8px] border-zinc-900 rounded-[2.5rem] bg-zinc-900 shadow-2xl overflow-hidden shrink-0 animate-fade-in" style={{ height: '420px', width: '200px' }}>
    {/* Dynamic Island / Notch */}
    <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-10">
      <div className="w-20 h-5 bg-black rounded-b-3xl"></div>
    </div>
    {/* Screen Content */}
    <div className="w-full h-full bg-white rounded-[2rem] overflow-hidden flex items-center justify-center">
      {src ? (
        <img src={src} className={`w-full h-full object-${objectFit}`} alt="Phone Screen" crossOrigin="anonymous" />
      ) : (
        <div className="text-zinc-400 text-sm">Empty</div>
      )}
    </div>
  </div>
);

const LaptopFrame = ({ src, objectFit = 'cover' }: { src: string; objectFit?: 'cover' | 'contain' }) => (
  <div className="flex flex-col items-center shrink-0 animate-fade-in" style={{ width: '560px' }}>
    {/* Screen Container */}
    <div className="relative w-full border-[10px] border-zinc-900 rounded-t-2xl bg-zinc-900 shadow-2xl overflow-hidden flex flex-col">
      {/* Webcam */}
      <div className="absolute top-1 inset-x-0 flex justify-center z-10">
        <div className="w-2 h-2 bg-black rounded-full border border-zinc-800"></div>
      </div>
      {/* Screen Content */}
      <div className="w-full bg-white relative overflow-hidden" style={{ aspectRatio: '16/10' }}>
        {src ? (
          <img src={src} className={`absolute inset-0 w-full h-full object-${objectFit}`} alt="Laptop Screen" crossOrigin="anonymous" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-400 text-sm">Empty</div>
        )}
      </div>
      {/* Bottom bezel (macbook style) */}
      <div className="w-full h-4 bg-zinc-900"></div>
    </div>
    {/* Base */}
    <div className="relative w-[110%] h-4 bg-zinc-300 rounded-b-xl shadow-md flex justify-center border-t border-zinc-400 z-0">
      {/* Trackpad notch */}
      <div className="w-24 h-1 bg-zinc-400 rounded-b-md mt-0"></div>
    </div>
  </div>
);


// --- Main Application Component ---

export default function App() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [layout, setLayout] = useState<LayoutMode>('horizontal');
  const [backgroundPreset, setBackgroundPreset] = useState<BackgroundPresetId>('light-canvas');

  // Auto-numbering Configuration
  const [startingStep, setStartingStep] = useState(1);

  const workflowRef = useRef<HTMLDivElement>(null);
  const activeBackground = getBackgroundPreset(backgroundPreset);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const processFiles = (files: FileList | File[]) => {
    const newStepsPromises = Array.from(files).map((file) => {
      return new Promise((resolve) => {
        if (!file.type.startsWith('image/')) {
          resolve(null);
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result;
          if (typeof result !== 'string') return;

          const src = result;
          const img = new Image();
          img.onload = () => {
            // Auto-detect based on aspect ratio
            const isMobile = img.width <= img.height * 1.1;
            resolve({
              id: generateId(),
              src,
              type: isMobile ? 'phone' : 'laptop',
              title: '',
              isCustomTitle: false,
              titleColor: DEFAULT_TITLE_COLOR,
              objectFit: 'cover',
              description: '',
            });
          };
          img.src = src;
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(newStepsPromises).then((results) => {
      const validSteps = results.filter((step): step is Step => step !== null);
      setSteps(prev => [...prev, ...validSteps]);
    });
  };

  // Drag and drop handlers for upload
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [steps]);

  // File input handler
  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    e.target.value = '';
  };

  // Step manipulation handlers
  const updateStep = (id: string, updates: Partial<Step>) => {
    setSteps(steps.map(step => step.id === id ? { ...step, ...updates } : step));
  };

  const deleteStep = (id: string) => {
    setSteps(steps.filter(step => step.id !== id));
  };

  const duplicateStep = (id: string) => {
    const stepToDuplicate = steps.find(s => s.id === id);
    if (stepToDuplicate) {
      const index = steps.findIndex(s => s.id === id);
      const newSteps = [...steps];
      newSteps.splice(index + 1, 0, {
        ...stepToDuplicate,
        id: generateId(),
        title: stepToDuplicate.isCustomTitle ? `${stepToDuplicate.title} (Copy)` : '',
        isCustomTitle: stepToDuplicate.isCustomTitle,
        description: stepToDuplicate.description,
      });
      setSteps(newSteps);
    }
  };

  // Step Reordering (Drag and Drop within workflow)
  const handleDragStart = (e: React.DragEvent, originalIndex: number) => {
    setDraggedItemIndex(originalIndex);
    e.dataTransfer.effectAllowed = 'move';
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDragEnter = (_e: React.DragEvent, targetOriginalIndex: number) => {
    if (draggedItemIndex === null || draggedItemIndex === targetOriginalIndex) return;
    
    const newSteps = [...steps];
    const draggedItem = newSteps[draggedItemIndex];
    
    newSteps.splice(draggedItemIndex, 1);
    newSteps.splice(targetOriginalIndex, 0, draggedItem);
    
    setDraggedItemIndex(targetOriginalIndex);
    setSteps(newSteps);
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
  };

  // Export handling
  const handleExport = async (targetRef: React.RefObject<HTMLElement | null>, filename: string, isSingle = false) => {
    if (!targetRef.current) return;
    
    setExporting(true);
    let restoreDom = () => {};
    
    try {
      await new Promise(res => setTimeout(res, 100));

      const element = targetRef.current;
      const scrollParent = element.closest('.custom-scrollbar') as HTMLElement | null;
      if (scrollParent) {
        scrollParent.scrollLeft = 0;
        scrollParent.scrollTop = 0;
      }

      restoreDom = isSingle ? () => {} : prepareExportDom(element);
      await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));

      const isDotGridExport = !isSingle && activeBackground.id === 'dot-grid';
      const exportScale = 2;

      const canvas = await html2canvas(element, {
        scale: exportScale,
        useCORS: true,
        backgroundColor:
          isSingle || activeBackground.id === 'transparent' || isDotGridExport
            ? null
            : activeBackground.exportBackgroundColor,
        logging: false,
        onclone: (clonedDoc) => {
          const elementsToHide = clonedDoc.querySelectorAll<HTMLElement>('.export-hide');
          elementsToHide.forEach(el => el.style.display = 'none');

          clonedDoc.querySelectorAll<HTMLInputElement>('.export-title-input').forEach((input) => {
            const span = clonedDoc.createElement('span');
            span.textContent = input.value;
            span.className = 'text-2xl font-semibold text-center px-2 py-1';
            span.style.color = input.style.color || DEFAULT_TITLE_COLOR;
            input.replaceWith(span);
          });

          clonedDoc.querySelectorAll<HTMLTextAreaElement>('.export-description').forEach((textarea) => {
            const div = clonedDoc.createElement('div');
            div.textContent = textarea.value;
            div.className = textarea.className.replace('export-description', '').trim();
            div.style.width = textarea.style.width;
            div.style.textAlign = 'center';
            div.style.whiteSpace = 'pre-wrap';
            div.style.wordBreak = 'break-word';
            div.style.minHeight = textarea.style.height || 'auto';
            if (textarea.value.trim()) {
              textarea.replaceWith(div);
            } else {
              textarea.remove();
            }
          });

          clonedDoc.querySelectorAll<HTMLElement>('.export-arrow-spacer').forEach((spacer) => {
            spacer.style.height = '4.75rem';
          });
          
          if (isSingle) {
             const container = clonedDoc.querySelector<HTMLElement>('.single-export-container');
             if (container) {
                container.style.padding = '0';
                container.style.background = 'transparent';
             }
          } else {
             const workflow = clonedDoc.querySelector<HTMLElement>('.export-workflow');
             const bgLayer = clonedDoc.querySelector<HTMLElement>('.export-bg');
             const inner = clonedDoc.querySelector<HTMLElement>('.export-workflow-inner');

             if (workflow) {
               workflow.style.overflow = 'visible';
               workflow.style.width = 'fit-content';
               workflow.style.height = 'fit-content';
               workflow.style.minHeight = '0';
               workflow.style.background = 'transparent';
             }

             if (inner) {
               inner.style.overflow = 'visible';
               inner.style.alignItems = layout === 'vertical' ? 'center' : 'stretch';
               inner.style.paddingBottom = '3rem';
             }

             if (bgLayer) {
               if (isDotGridExport) {
                 bgLayer.style.display = 'none';
               } else {
                 applyBackgroundToElement(bgLayer, activeBackground);
                 bgLayer.style.position = 'absolute';
                 bgLayer.style.inset = '0';
                 bgLayer.style.zIndex = '0';
               }
             }

             clonedDoc.querySelectorAll<HTMLElement>('.export-workflow-inner > *').forEach((child) => {
               if (child instanceof HTMLElement) child.style.position = 'relative';
               if (child instanceof HTMLElement) child.style.zIndex = '1';
             });
          }
        }
      });

      const exportCanvas = isDotGridExport
        ? compositeDotGridExport(canvas, exportScale, '#f8fafc', '#cbd5e1', 20, 1)
        : canvas;

      const dataUrl = exportCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      restoreDom();
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 flex flex-col selection:bg-blue-100">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white font-bold">
            S
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Screenshapes</h1>
        </div>
        <div className="flex gap-3">
           <label className="cursor-pointer bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm">
            <Icons.Upload className="w-4 h-4" />
            Upload Screenshots
            <input type="file" multiple accept="image/*" className="hidden" onChange={onFileInputChange} />
          </label>
          <button 
            disabled={steps.length === 0 || exporting}
            onClick={() => handleExport(workflowRef, 'workflow')}
            className="bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
          >
            {exporting ? 'Exporting...' : <><Icons.Download className="w-4 h-4" /> Export Workflow</>}
          </button>
        </div>
      </header>

      {/* Starting Step Range Configuration Bar */}
      {steps.length > 0 && (
        <div className="bg-white border-b border-zinc-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4 select-none animate-fade-in">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-3 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-200">
              <Icons.Sliders className="w-4 h-4 text-zinc-500" />
              <span className="font-semibold text-zinc-700">Starting Step Number:</span>
              <input
                type="number"
                min="0"
                value={startingStep}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setStartingStep(isNaN(val) ? 1 : Math.max(0, val));
                }}
                className="w-16 px-2 py-0.5 text-center font-bold border border-zinc-300 rounded-md focus:outline-none focus:border-zinc-900 bg-white"
              />
            </div>

            <div className="flex items-center gap-1 bg-zinc-50 px-1.5 py-1 rounded-lg border border-zinc-200">
              <button
                type="button"
                onClick={() => setLayout('horizontal')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                  layout === 'horizontal'
                    ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200'
                    : 'text-zinc-500 hover:text-zinc-700'
                }`}
                title="Horizontal storyboard"
              >
                <Icons.LayoutHorizontal className="w-4 h-4" />
                Horizontal
              </button>
              <button
                type="button"
                onClick={() => setLayout('vertical')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                  layout === 'vertical'
                    ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200'
                    : 'text-zinc-500 hover:text-zinc-700'
                }`}
                title="Vertical sequential guide"
              >
                <Icons.LayoutVertical className="w-4 h-4" />
                Vertical
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Background</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {BACKGROUND_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setBackgroundPreset(preset.id)}
                    title={preset.label}
                    className={`w-7 h-7 rounded-lg border-2 transition-all shrink-0 ${
                      backgroundPreset === preset.id
                        ? 'border-zinc-900 scale-110 shadow-sm'
                        : 'border-zinc-200 hover:border-zinc-400'
                    }`}
                    style={preset.id === 'transparent'
                      ? {
                          backgroundImage: 'linear-gradient(45deg, #e4e4e7 25%, transparent 25%), linear-gradient(-45deg, #e4e4e7 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e4e4e7 75%), linear-gradient(-45deg, transparent 75%, #e4e4e7 75%)',
                          backgroundSize: '8px 8px',
                          backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                          backgroundColor: '#fff',
                        }
                      : preset.style}
                  />
                ))}
              </div>
            </div>

            <div className="text-xs text-zinc-500 font-semibold tracking-wide uppercase hidden sm:block">
              Auto numbering: Step {startingStep} to Step {startingStep + steps.length - 1}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col">
        {/* Dropzone (Shows strongly if empty) */}
        {steps.length === 0 && (
          <div className="flex-1 p-8 flex flex-col items-center justify-center">
            <div 
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`w-full max-w-2xl p-16 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center transition-all duration-200 ${
                isDraggingOver ? 'border-zinc-900 bg-zinc-100 scale-[1.02]' : 'border-zinc-300 bg-white hover:border-zinc-400'
              }`}
            >
              <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-6 text-zinc-500">
                <Icons.Upload className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Build your workflow mockup</h2>
              <p className="text-zinc-500 mb-8 max-w-md">
                Drag and drop screenshots here to automatically frame them in device mockups.
              </p>
              <label className="cursor-pointer bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-sm">
                Select Files
                <input type="file" multiple accept="image/*" className="hidden" onChange={onFileInputChange} />
              </label>
            </div>
          </div>
        )}

        {/* Workflow Board */}
        {steps.length > 0 && (
          <div className="flex-1 flex flex-col relative">
             <div
               className={`flex-1 min-h-0 custom-scrollbar ${
                 layout === 'horizontal' ? 'overflow-x-auto overflow-y-hidden' : 'overflow-y-auto overflow-x-hidden'
               }`}
               style={activeBackground.style}
             >
              <div 
                ref={workflowRef} 
                className={`export-workflow relative h-fit ${
                  layout === 'vertical' ? 'w-full max-w-3xl mx-auto' : 'w-fit'
                }`}
              >
                <div
                  className="export-bg absolute inset-0 pointer-events-none"
                  style={activeBackground.style}
                  aria-hidden="true"
                />
                <div
                  className={`export-workflow-inner relative z-10 flex gap-3 p-12 pb-20 transition-all duration-300 ${
                    layout === 'horizontal'
                      ? 'flex-row items-stretch min-w-max'
                      : 'flex-col items-center min-h-max w-full max-w-3xl mx-auto'
                  }`}
                >
                {steps.map((step, index) => {
                  const displayTitle = step.isCustomTitle ? step.title : `Step ${startingStep + index}`;
                  const descriptionWidth = step.type === 'phone' ? DESCRIPTION_WIDTH.phone : DESCRIPTION_WIDTH.laptop;
                  const connectorIsDark = activeBackground.isDark;

                  const ConnectorArrow = () => (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all ${
                      connectorIsDark
                        ? 'bg-zinc-800 border border-zinc-700 text-zinc-100'
                        : 'bg-white border border-zinc-200/80 text-zinc-800'
                    }`}>
                      {layout === 'horizontal' ? (
                        <Icons.ArrowRight className="w-5 h-5" strokeWidth="3" />
                      ) : (
                        <Icons.ArrowDown className="w-5 h-5" strokeWidth="3" />
                      )}
                    </div>
                  );

                  return (
                    <React.Fragment key={step.id}>
                      <div 
                        className={`relative group flex flex-col items-center gap-4 transition-transform duration-300 single-export-container ${
                          draggedItemIndex === index ? 'opacity-40 scale-95' : 'opacity-100'
                        } ${layout === 'vertical' ? 'w-full' : ''}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnter={(e) => handleDragEnter(e, index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => e.preventDefault()}
                      >
                        <div className="flex items-center gap-2 group/title">
                           <div className="cursor-grab active:cursor-grabbing p-1.5 text-zinc-300 hover:text-zinc-500 transition-colors export-hide">
                              <Icons.Grip />
                           </div>
                          <input
                            type="text"
                            value={displayTitle}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateStep(step.id, { 
                                title: val,
                                isCustomTitle: val.trim() !== ""
                              });
                            }}
                            style={{ color: step.titleColor ?? DEFAULT_TITLE_COLOR }}
                            className="export-title-input text-2xl font-semibold bg-transparent border-b-2 border-transparent hover:border-zinc-200 focus:border-zinc-900 focus:outline-none text-center transition-colors min-w-[100px] max-w-[300px] placeholder-zinc-300 px-2 py-1"
                            placeholder="Enter title..."
                          />
                        </div>

                        <div id={`frame-${step.id}`} className="relative flex flex-col items-center gap-3">
                          {step.type === 'phone' ? (
                            <PhoneFrame src={step.src} objectFit={step.objectFit} />
                          ) : (
                            <LaptopFrame src={step.src} objectFit={step.objectFit} />
                          )}

                          <StepDescription
                            value={step.description}
                            onChange={(description) => updateStep(step.id, { description })}
                            width={descriptionWidth}
                            isDarkBg={activeBackground.isDark}
                          />

                          <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center bg-white border border-zinc-200 shadow-xl rounded-full px-2 py-1.5 gap-1 z-20 export-hide pointer-events-auto">
                             <button 
                              onClick={() => updateStep(step.id, { type: 'phone' })}
                              className={`p-2 rounded-full transition-colors ${step.type === 'phone' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'}`}
                              title="Phone Frame"
                             >
                              <Icons.Smartphone />
                             </button>
                             <button 
                              onClick={() => updateStep(step.id, { type: 'laptop' })}
                              className={`p-2 rounded-full transition-colors ${step.type === 'laptop' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'}`}
                              title="Laptop Frame"
                             >
                              <Icons.Laptop />
                             </button>
                             
                             <div className="w-px h-4 bg-zinc-200 mx-1"></div>
                             
                             <button 
                              onClick={() => updateStep(step.id, { objectFit: step.objectFit === 'cover' ? 'contain' : 'cover' })}
                              className="text-xs font-medium px-2 py-1 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-full transition-colors"
                              title="Toggle Fit"
                             >
                              {step.objectFit === 'cover' ? 'Fit' : 'Fill'}
                             </button>

                             <div className="w-px h-4 bg-zinc-200 mx-1"></div>

                             <label
                              className="relative p-2 rounded-full text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors cursor-pointer"
                              title="Title color"
                             >
                              <input
                                type="color"
                                value={step.titleColor ?? DEFAULT_TITLE_COLOR}
                                onChange={(e) => updateStep(step.id, { titleColor: e.target.value })}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                              <span className="flex items-center gap-1">
                                <Icons.Palette />
                                <span
                                  className="w-3 h-3 rounded-full border border-zinc-300"
                                  style={{ backgroundColor: step.titleColor ?? DEFAULT_TITLE_COLOR }}
                                />
                              </span>
                             </label>

                             <div className="w-px h-4 bg-zinc-200 mx-1"></div>

                             <button onClick={() => duplicateStep(step.id)} className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-full transition-colors" title="Duplicate">
                              <Icons.Copy />
                             </button>
                             <button 
                              onClick={() => handleExport({ current: document.getElementById(`frame-${step.id}`) }, `frame-${step.id}`, true)} 
                              className="p-2 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Export Single"
                             >
                              <Icons.Download />
                             </button>
                             <button onClick={() => deleteStep(step.id)} className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" title="Delete">
                              <Icons.Trash />
                             </button>
                          </div>
                        </div>
                      </div>

                      {index < steps.length - 1 && (
                        layout === 'horizontal' ? (
                          <div className="export-arrow flex flex-col self-stretch shrink-0 w-10 transition-all duration-300">
                            <div className="export-arrow-spacer h-20 shrink-0" aria-hidden="true" />
                            <div className="flex flex-1 items-center justify-center min-h-0">
                              <ConnectorArrow />
                            </div>
                          </div>
                        ) : (
                          <div className="export-arrow flex items-center justify-center py-2 transition-all duration-300">
                            <ConnectorArrow />
                          </div>
                        )
                      )}
                    </React.Fragment>
                  );
                })}
                </div>
              </div>
            </div>
            
            {/* Overlay hint if dragging files over the active board */}
            {isDraggingOver && (
              <div 
                className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center border-4 border-dashed border-zinc-900 m-4 rounded-2xl pointer-events-none"
              >
                <div className="text-2xl font-semibold text-zinc-900 bg-white px-8 py-4 rounded-xl shadow-lg flex items-center gap-3">
                  <Icons.Upload className="w-6 h-6" /> Drop to add to workflow
                </div>
              </div>
            )}
             {/* Invisible drop target covering the main area when files are dragged into window */}
            <div 
               className="absolute inset-0 z-40 hidden" 
               style={{ display: isDraggingOver ? 'block' : 'none' }}
               onDragOver={onDragOver}
               onDragLeave={onDragLeave}
               onDrop={onDrop}
            />
          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          height: 12px;
          width: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #d4d4d8;
          border-radius: 20px;
          border: 3px solid #fafafa;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #a1a1aa;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
    </div>
  );
}