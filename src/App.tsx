import React, { useState, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas-pro';

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
  )
};

// --- Device Frame Components ---

const PhoneFrame = ({ src, objectFit = 'cover' }) => (
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

const LaptopFrame = ({ src, objectFit = 'cover' }) => (
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
  const [steps, setSteps] = useState([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);

  // Auto-numbering Configuration
  const [startingStep, setStartingStep] = useState(1);

  const workflowRef = useRef(null);

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
              title: '', // Keep empty initially, so it auto-computes sequences
              isCustomTitle: false,
              objectFit: 'cover' // default
            });
          };
          img.src = src;
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(newStepsPromises).then((results) => {
      const validSteps = results.filter(Boolean);
      setSteps(prev => [...prev, ...validSteps]);
    });
  };

  // Drag and drop handlers for upload
  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDraggingOver(true);
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDraggingOver(false);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [steps]);

  // File input handler
  const onFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    e.target.value = null;
  };

  // Step manipulation handlers
  const updateStep = (id, updates) => {
    setSteps(steps.map(step => step.id === id ? { ...step, ...updates } : step));
  };

  const deleteStep = (id) => {
    setSteps(steps.filter(step => step.id !== id));
  };

  const duplicateStep = (id) => {
    const stepToDuplicate = steps.find(s => s.id === id);
    if (stepToDuplicate) {
      const index = steps.findIndex(s => s.id === id);
      const newSteps = [...steps];
      newSteps.splice(index + 1, 0, { 
        ...stepToDuplicate, 
        id: generateId(), 
        title: stepToDuplicate.isCustomTitle ? `${stepToDuplicate.title} (Copy)` : '',
        isCustomTitle: stepToDuplicate.isCustomTitle
      });
      setSteps(newSteps);
    }
  };

  // Step Reordering (Drag and Drop within workflow)
  const handleDragStart = (e, originalIndex) => {
    setDraggedItemIndex(originalIndex);
    e.dataTransfer.effectAllowed = 'move';
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDragEnter = (e, targetOriginalIndex) => {
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
  const handleExport = async (targetRef, filename, isSingle = false) => {
    if (!targetRef.current) return;
    
    setExporting(true);
    
    try {
      await new Promise(res => setTimeout(res, 100));

      const element = targetRef.current;
      const scrollParent = element.closest('.custom-scrollbar');
      if (scrollParent) scrollParent.scrollLeft = 0;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
        onclone: (clonedDoc) => {
          const elementsToHide = clonedDoc.querySelectorAll<HTMLElement>('.export-hide');
          elementsToHide.forEach(el => el.style.display = 'none');

          // html2canvas clips <input> text — replace with spans for export
          clonedDoc.querySelectorAll<HTMLInputElement>('.export-title-input').forEach((input) => {
            const span = clonedDoc.createElement('span');
            span.textContent = input.value;
            span.className = 'text-2xl font-semibold text-center px-2 py-1 text-zinc-900';
            input.replaceWith(span);
          });

          // Grip is hidden on export, so shrink arrow spacer to match shorter title row
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
             if (workflow) {
               workflow.style.overflow = 'visible';
               workflow.style.alignItems = 'stretch';
               workflow.style.minHeight = 'auto';
               workflow.style.height = 'auto';
               workflow.style.background = 'transparent';

               let parent = workflow.parentElement;
               while (parent) {
                 parent.style.overflow = 'visible';
                 parent.style.background = 'transparent';
                 parent = parent.parentElement;
               }
             }
          }
        }
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
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
          <div className="flex items-center gap-4 text-sm">
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
          </div>
          
          <div className="text-xs text-zinc-500 font-semibold tracking-wide uppercase">
            Auto numbering sequence: Step {startingStep} to Step {startingStep + steps.length - 1}
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
             <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar bg-zinc-50/50">
              {/* This is the container that gets exported */}
              <div 
                ref={workflowRef} 
                className="export-workflow flex items-stretch gap-3 p-12 min-h-full min-w-max bg-transparent pb-32"
                style={{ paddingBottom: '120px' }}
              >
                {steps.map((step, index) => {
                  // Dynamically resolve title if user hasn't overridden it manually
                  const displayTitle = step.isCustomTitle ? step.title : `Step ${startingStep + index}`;

                  return (
                    <React.Fragment key={step.id}>
                      {/* Individual Step Container */}
                      <div 
                        className={`relative group flex flex-col items-center gap-8 transition-transform duration-300 single-export-container ${
                          draggedItemIndex === index ? 'opacity-40 scale-95' : 'opacity-100'
                        }`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnter={(e) => handleDragEnter(e, index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => e.preventDefault()}
                      >
                        {/* Step Header / Title */}
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
                                isCustomTitle: val.trim() !== "" // Mark custom if non-empty custom string
                              });
                            }}
                            className="export-title-input text-2xl font-semibold bg-transparent border-b-2 border-transparent hover:border-zinc-200 focus:border-zinc-900 focus:outline-none text-center transition-colors min-w-[100px] max-w-[300px] placeholder-zinc-300 px-2 py-1"
                            placeholder="Enter title..."
                          />
                        </div>

                        {/* Device Frame Wrapper (for single export target) */}
                        <div id={`frame-${step.id}`} className="relative">
                          {/* Device Frame */}
                          {step.type === 'phone' ? (
                            <PhoneFrame src={step.src} objectFit={step.objectFit} />
                          ) : (
                            <LaptopFrame src={step.src} objectFit={step.objectFit} />
                          )}

                          {/* Floating Action Bar (Hidden on export) */}
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

                             <button onClick={() => duplicateStep(step.id)} className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-full transition-colors" title="Duplicate">
                              <Icons.Copy />
                             </button>
                             <button 
                              onClick={() => handleExport({current: document.getElementById(`frame-${step.id}`)}, `frame-${step.id}`, true)} 
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

                      {/* Arrow between steps */}
                      {index < steps.length - 1 && (
                        <div className="export-arrow flex flex-col self-stretch shrink-0 w-10 transition-all duration-300">
                          <div className="export-arrow-spacer h-20 shrink-0" aria-hidden="true" />
                          <div className="flex flex-1 items-center justify-center min-h-0">
                            <div className="w-10 h-10 rounded-full bg-white border border-zinc-200/80 flex items-center justify-center text-zinc-700 shadow-md hover:shadow-lg hover:scale-105 transition-all">
                              <Icons.ArrowRight className="w-5 h-5 text-zinc-800" strokeWidth="3" />
                            </div>
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
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