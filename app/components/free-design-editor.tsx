"use client";

import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

type TextLayer = {
  id: string;
  text: string;
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
  bold: boolean;
  align: "left" | "center" | "right";
};

type Props = {
  image: string;
  onApply: (value: string) => void;
  title?: string;
};

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 675;

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image open nahi hui"));
    image.src = source;
  });
}

function drawCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
) {
  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  context.drawImage(
    image,
    (width - drawWidth) / 2,
    (height - drawHeight) / 2,
    drawWidth,
    drawHeight,
  );
}

export default function FreeDesignEditor({ image, onApply, title = "Website design" }: Props) {
  const [open, setOpen] = useState(false);
  const [background, setBackground] = useState(image || "");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [layers, setLayers] = useState<TextLayer[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

  const selected = useMemo(
    () => layers.find((layer) => layer.id === selectedId) || null,
    [layers, selectedId],
  );

  function updateSelected(values: Partial<TextLayer>) {
    if (!selectedId) return;
    setLayers((current) =>
      current.map((layer) => (layer.id === selectedId ? { ...layer, ...values } : layer)),
    );
  }

  function addText() {
    const id = `text-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const layer: TextLayer = {
      id,
      text: "Your text",
      x: 50,
      y: 50,
      size: 54,
      color: "#ffffff",
      rotation: 0,
      bold: true,
      align: "center",
    };
    setLayers((current) => [...current, layer]);
    setSelectedId(id);
  }

  function removeSelected() {
    if (!selectedId) return;
    setLayers((current) => current.filter((layer) => layer.id !== selectedId));
    setSelectedId("");
  }

  async function chooseBackground(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Sirf image file select karo");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setError("Image 12 MB se chhoti honi chahiye");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setBackground(String(reader.result || ""));
      setError("");
    };
    reader.onerror = () => setError("Image read nahi hui");
    reader.readAsDataURL(file);
  }

  function beginDrag(event: ReactPointerEvent<HTMLDivElement>, layer: TextLayer) {
    const stage = stageRef.current;
    if (!stage) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = stage.getBoundingClientRect();
    const pointerX = ((event.clientX - rect.left) / rect.width) * 100;
    const pointerY = ((event.clientY - rect.top) / rect.height) * 100;
    dragRef.current = { id: layer.id, offsetX: pointerX - layer.x, offsetY: pointerY - layer.y };
    setSelectedId(layer.id);
  }

  function moveDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const stage = stageRef.current;
    if (!drag || !stage) return;
    const rect = stage.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100 - drag.offsetX));
    const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100 - drag.offsetY));
    setLayers((current) =>
      current.map((layer) => (layer.id === drag.id ? { ...layer, x, y } : layer)),
    );
  }

  function endDrag() {
    dragRef.current = null;
  }

  async function applyDesign() {
    setBusy(true);
    setError("");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Design export nahi hua");

      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      if (background) {
        const backgroundImage = await loadImage(background);
        drawCover(context, backgroundImage, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      for (const layer of layers) {
        context.save();
        const x = (layer.x / 100) * CANVAS_WIDTH;
        const y = (layer.y / 100) * CANVAS_HEIGHT;
        context.translate(x, y);
        context.rotate((layer.rotation * Math.PI) / 180);
        context.fillStyle = layer.color;
        context.font = `${layer.bold ? "700" : "400"} ${layer.size}px Arial, sans-serif`;
        context.textAlign = layer.align;
        context.textBaseline = "middle";
        context.shadowColor = "rgba(0,0,0,.32)";
        context.shadowBlur = 8;
        context.fillText(layer.text || " ", 0, 0, CANVAS_WIDTH * 0.9);
        context.restore();
      }

      onApply(canvas.toDataURL("image/jpeg", 0.88));
      setOpen(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Design save nahi hua");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className="free-design-open" onClick={() => setOpen(true)}>
        ✦ Open Free Design Editor
      </button>

      {open && (
        <div className="free-design-overlay" role="dialog" aria-modal="true" aria-label="Free design editor">
          <section className="free-design-shell">
            <header>
              <div>
                <small>FREE DESIGN EDITOR</small>
                <h2>{title}</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close editor">×</button>
            </header>

            <div className="free-design-workspace">
              <aside className="free-design-tools">
                <label className="upload-tool">
                  <input type="file" accept="image/*" onChange={chooseBackground} />
                  🖼 Change background
                </label>
                <button type="button" onClick={addText}>＋ Add text</button>
                <label>
                  Background colour
                  <input type="color" value={backgroundColor} onChange={(event) => setBackgroundColor(event.target.value)} />
                </label>
                {selected && (
                  <div className="selected-tools">
                    <label>
                      Text
                      <input value={selected.text} onChange={(event) => updateSelected({ text: event.target.value })} />
                    </label>
                    <label>
                      Text colour
                      <input type="color" value={selected.color} onChange={(event) => updateSelected({ color: event.target.value })} />
                    </label>
                    <label>
                      Size: {selected.size}px
                      <input type="range" min="18" max="160" value={selected.size} onChange={(event) => updateSelected({ size: Number(event.target.value) })} />
                    </label>
                    <label>
                      Rotate: {selected.rotation}°
                      <input type="range" min="-180" max="180" value={selected.rotation} onChange={(event) => updateSelected({ rotation: Number(event.target.value) })} />
                    </label>
                    <div className="tool-row">
                      <button type="button" className={selected.bold ? "active" : ""} onClick={() => updateSelected({ bold: !selected.bold })}>Bold</button>
                      <button type="button" onClick={() => updateSelected({ align: "left" })}>Left</button>
                      <button type="button" onClick={() => updateSelected({ align: "center" })}>Center</button>
                      <button type="button" onClick={() => updateSelected({ align: "right" })}>Right</button>
                    </div>
                    <button type="button" className="delete-layer" onClick={removeSelected}>Delete selected text</button>
                  </div>
                )}
              </aside>

              <div className="free-design-stage-wrap">
                <div
                  ref={stageRef}
                  className="free-design-stage"
                  style={{ backgroundColor, backgroundImage: background ? `url(${background})` : undefined }}
                  onPointerMove={moveDrag}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  onPointerLeave={endDrag}
                >
                  {layers.map((layer) => (
                    <div
                      key={layer.id}
                      className={`design-text-layer${selectedId === layer.id ? " selected" : ""}`}
                      style={{
                        left: `${layer.x}%`,
                        top: `${layer.y}%`,
                        color: layer.color,
                        fontSize: `${Math.max(12, layer.size / 3)}px`,
                        fontWeight: layer.bold ? 700 : 400,
                        textAlign: layer.align,
                        transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
                      }}
                      onPointerDown={(event) => beginDrag(event, layer)}
                    >
                      {layer.text || "Your text"}
                    </div>
                  ))}
                  {layers.length === 0 && <span className="stage-help">Add text karke finger ya mouse se freely move karo</span>}
                </div>
              </div>
            </div>

            {error && <p className="free-design-error">{error}</p>}
            <footer>
              <button type="button" onClick={() => setOpen(false)}>Cancel</button>
              <button type="button" className="apply-design" disabled={busy} onClick={() => void applyDesign()}>
                {busy ? "Saving design…" : "Use this design"}
              </button>
            </footer>
          </section>
        </div>
      )}

      <style jsx global>{`
        .free-design-open{width:100%;border:1px solid #c7181b!important;border-radius:11px!important;background:#fff4f1!important;color:#b51622!important;padding:11px 13px!important;font-weight:900!important;cursor:pointer}
        .free-design-overlay{position:fixed;z-index:100000;inset:0;background:#08100dcc;backdrop-filter:blur(5px);padding:12px;display:grid;place-items:center}
        .free-design-shell{width:min(1180px,100%);max-height:96dvh;overflow:auto;background:#f6f7f6;border-radius:22px;box-shadow:0 28px 90px #0008}
        .free-design-shell>header{position:sticky;z-index:5;top:0;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 18px;background:#fff;border-bottom:1px solid #e5e9e6}
        .free-design-shell>header small{color:#c7181b;font-size:9px;font-weight:950;letter-spacing:1.5px}.free-design-shell>header h2{margin:3px 0 0;font-size:20px}.free-design-shell>header>button{width:38px;height:38px;border:0;border-radius:50%;background:#eef1ef;font-size:24px;cursor:pointer}
        .free-design-workspace{display:grid;grid-template-columns:270px minmax(0,1fr);gap:16px;padding:16px}
        .free-design-tools{display:grid;align-content:start;gap:11px;border-radius:16px;background:#fff;padding:14px;box-shadow:0 6px 22px #14201912}
        .free-design-tools button,.upload-tool{min-height:42px;border:1px solid #dbe2dd;border-radius:10px;background:#fff;padding:10px;color:#26382f;font-weight:850;cursor:pointer;text-align:center}
        .upload-tool input{position:absolute;width:1px;height:1px;opacity:0}.free-design-tools>label,.selected-tools label{display:grid;gap:6px;color:#53635b;font-size:11px;font-weight:850}.free-design-tools input[type=color]{width:100%;height:40px;border:1px solid #dbe2dd;border-radius:9px;padding:3px;background:#fff}.selected-tools{display:grid;gap:10px;border-top:1px solid #edf0ee;padding-top:11px}.selected-tools input:not([type=color]):not([type=range]){width:100%;border:1px solid #dbe2dd;border-radius:9px;padding:10px}.selected-tools input[type=range]{width:100%}.tool-row{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}.tool-row button{min-height:36px;padding:6px;font-size:10px}.tool-row button.active{background:#c7181b;color:#fff}.delete-layer{color:#a51317!important;background:#fff0ef!important;border-color:#f2c8c7!important}
        .free-design-stage-wrap{min-width:0;display:grid;place-items:center;border-radius:16px;background:#252b28;padding:18px;overflow:auto}
        .free-design-stage{position:relative;width:min(100%,900px);aspect-ratio:16/9;overflow:hidden;background-position:center;background-repeat:no-repeat;background-size:cover;box-shadow:0 16px 40px #0007;touch-action:none;user-select:none}
        .design-text-layer{position:absolute;max-width:90%;padding:7px 10px;line-height:1.12;white-space:pre-wrap;word-break:break-word;text-shadow:0 2px 8px #0008;cursor:grab;touch-action:none}.design-text-layer.selected{outline:2px dashed #ffcc26;outline-offset:4px}.design-text-layer:active{cursor:grabbing}.stage-help{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:80%;border-radius:12px;background:#0008;color:#fff;padding:12px;text-align:center;font-size:13px;font-weight:800;pointer-events:none}
        .free-design-error{margin:0 16px 12px;border-radius:10px;background:#fff0ef;color:#a51317;padding:10px 12px;font-size:12px;font-weight:850}.free-design-shell>footer{position:sticky;bottom:0;display:flex;justify-content:flex-end;gap:9px;padding:13px 18px;background:#fff;border-top:1px solid #e5e9e6}.free-design-shell>footer button{border:1px solid #d7dfda;border-radius:10px;background:#fff;padding:11px 17px;font-weight:900;cursor:pointer}.free-design-shell>footer .apply-design{border-color:#c7181b;background:#c7181b;color:#fff}.free-design-shell>footer button:disabled{opacity:.6;cursor:wait}
        @media(max-width:760px){.free-design-overlay{padding:0}.free-design-shell{width:100%;height:100dvh;max-height:none;border-radius:0}.free-design-workspace{grid-template-columns:1fr;padding:10px;gap:10px}.free-design-tools{order:2;grid-template-columns:repeat(2,minmax(0,1fr));border-radius:13px;padding:10px}.free-design-tools>label,.selected-tools{grid-column:1/-1}.selected-tools{grid-template-columns:repeat(2,minmax(0,1fr))}.selected-tools label:first-child,.selected-tools .tool-row,.selected-tools .delete-layer{grid-column:1/-1}.free-design-stage-wrap{order:1;padding:8px;border-radius:12px}.free-design-shell>header{padding:10px 12px}.free-design-shell>footer{padding:10px 12px}.free-design-shell>footer button{flex:1}}
      `}</style>
    </>
  );
}
