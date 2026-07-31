"use client";

import {
  useEffect,
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
};

type Props = {
  image: string;
  onApply: (value: string) => void;
  title?: string;
};

const EXPORT_WIDTH = 1200;
const EXPORT_HEIGHT = 675;

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
  const [background, setBackground] = useState(image || "");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [layers, setLayers] = useState<TextLayer[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [toolsOpen, setToolsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

  useEffect(() => {
    setBackground(image || "");
  }, [image]);

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
    setLayers((current) => [
      ...current,
      {
        id,
        text: "Your text",
        x: 50,
        y: 50,
        size: 58,
        color: "#ffffff",
        rotation: 0,
        bold: true,
      },
    ]);
    setSelectedId(id);
    setToolsOpen(true);
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
    dragRef.current = {
      id: layer.id,
      offsetX: pointerX - layer.x,
      offsetY: pointerY - layer.y,
    };
    setSelectedId(layer.id);
    setToolsOpen(true);
  }

  function moveDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const stage = stageRef.current;
    if (!drag || !stage) return;
    const rect = stage.getBoundingClientRect();
    const x = Math.max(
      2,
      Math.min(98, ((event.clientX - rect.left) / rect.width) * 100 - drag.offsetX),
    );
    const y = Math.max(
      4,
      Math.min(96, ((event.clientY - rect.top) / rect.height) * 100 - drag.offsetY),
    );
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
      canvas.width = EXPORT_WIDTH;
      canvas.height = EXPORT_HEIGHT;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Design export nahi hua");

      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);

      if (background) {
        const backgroundImage = await loadImage(background);
        drawCover(context, backgroundImage, EXPORT_WIDTH, EXPORT_HEIGHT);
      }

      for (const layer of layers) {
        context.save();
        context.translate((layer.x / 100) * EXPORT_WIDTH, (layer.y / 100) * EXPORT_HEIGHT);
        context.rotate((layer.rotation * Math.PI) / 180);
        context.fillStyle = layer.color;
        context.font = `${layer.bold ? "700" : "400"} ${layer.size}px Arial, sans-serif`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.shadowColor = "rgba(0,0,0,.38)";
        context.shadowBlur = 9;
        context.fillText(layer.text || " ", 0, 0, EXPORT_WIDTH * 0.9);
        context.restore();
      }

      const result = canvas.toDataURL("image/jpeg", 0.88);
      setBackground(result);
      onApply(result);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Design save nahi hua");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="inline-design-editor" aria-label={`${title} live preview`}>
      <div className="inline-design-head">
        <div>
          <small>FUNCTIONAL LIVE PREVIEW</small>
          <b>{title}</b>
        </div>
        <span>Image par text ko drag karo</span>
      </div>

      <div
        ref={stageRef}
        className="inline-design-stage"
        style={{
          backgroundColor,
          backgroundImage: background ? `url(${background})` : undefined,
        }}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
        onClick={() => setSelectedId("")}
      >
        {layers.map((layer) => (
          <div
            key={layer.id}
            className={`inline-text-layer${selectedId === layer.id ? " selected" : ""}`}
            style={{
              left: `${layer.x}%`,
              top: `${layer.y}%`,
              color: layer.color,
              fontSize: `clamp(13px, ${layer.size / 22}vw, ${Math.max(18, layer.size / 2.8)}px)`,
              fontWeight: layer.bold ? 700 : 400,
              transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
            }}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => beginDrag(event, layer)}
          >
            {layer.text || "Your text"}
          </div>
        ))}
        {!background && layers.length === 0 && (
          <span className="inline-stage-help">Background select karo, phir text add karo</span>
        )}
      </div>

      <div className="inline-design-toolbar">
        <label>
          <input type="file" accept="image/*" onChange={chooseBackground} />
          🖼 Image
        </label>
        <button type="button" onClick={addText}>＋ Text</button>
        <button type="button" onClick={() => setToolsOpen((value) => !value)}>
          ⚙ Edit
        </button>
        <button type="button" className="inline-save-design" disabled={busy} onClick={() => void applyDesign()}>
          {busy ? "Saving…" : "✓ Apply preview"}
        </button>
      </div>

      {toolsOpen && (
        <div className="inline-design-controls">
          <label>
            Canvas colour
            <input type="color" value={backgroundColor} onChange={(event) => setBackgroundColor(event.target.value)} />
          </label>

          {selected ? (
            <>
              <label className="wide-control">
                Text
                <input value={selected.text} onChange={(event) => updateSelected({ text: event.target.value })} />
              </label>
              <label>
                Text colour
                <input type="color" value={selected.color} onChange={(event) => updateSelected({ color: event.target.value })} />
              </label>
              <label className="wide-control">
                Size: {selected.size}px
                <input type="range" min="18" max="160" value={selected.size} onChange={(event) => updateSelected({ size: Number(event.target.value) })} />
              </label>
              <label className="wide-control">
                Rotate: {selected.rotation}°
                <input type="range" min="-180" max="180" value={selected.rotation} onChange={(event) => updateSelected({ rotation: Number(event.target.value) })} />
              </label>
              <button type="button" onClick={() => updateSelected({ bold: !selected.bold })}>
                {selected.bold ? "✓ Bold" : "Bold"}
              </button>
              <button
                type="button"
                className="danger-control"
                onClick={() => {
                  setLayers((current) => current.filter((layer) => layer.id !== selected.id));
                  setSelectedId("");
                }}
              >
                Delete text
              </button>
            </>
          ) : (
            <p>Preview me kisi text ko tap/click karo, phir yahan edit hoga.</p>
          )}
        </div>
      )}

      {error && <p className="inline-design-error">{error}</p>}

      <style jsx global>{`
        .inline-design-editor{display:grid;gap:10px;border:1px solid #dce5df;border-radius:15px;background:#f7faf8;padding:10px}
        .inline-design-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.inline-design-head div{display:grid;gap:2px}.inline-design-head small{color:#c7181b;font-size:8px;font-weight:950;letter-spacing:1.2px}.inline-design-head b{font-size:13px}.inline-design-head span{color:#66756d;font-size:10px;font-weight:750}
        .inline-design-stage{position:relative;width:100%;aspect-ratio:16/9;overflow:hidden;border-radius:12px;background-position:center;background-repeat:no-repeat;background-size:cover;box-shadow:inset 0 0 0 1px #ffffff55,0 8px 20px #15241c25;touch-action:none;user-select:none}
        .inline-text-layer{position:absolute;max-width:90%;padding:5px 8px;line-height:1.08;white-space:pre-wrap;word-break:break-word;text-align:center;text-shadow:0 2px 8px #000b;cursor:grab;touch-action:none}.inline-text-layer.selected{outline:2px dashed #ffd12d;outline-offset:3px;background:#0002}.inline-text-layer:active{cursor:grabbing}.inline-stage-help{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:80%;border-radius:10px;background:#07140db5;color:#fff;padding:10px;text-align:center;font-size:11px;font-weight:850;pointer-events:none}
        .inline-design-toolbar{display:grid;grid-template-columns:repeat(3,minmax(0,1fr)) minmax(120px,1.25fr);gap:6px}.inline-design-toolbar button,.inline-design-toolbar label{display:grid;place-items:center;min-height:38px;border:1px solid #d6dfd9;border-radius:9px;background:#fff;color:#24342b;padding:7px;font-size:11px;font-weight:900;cursor:pointer;text-align:center}.inline-design-toolbar label input{position:absolute;width:1px;height:1px;opacity:0}.inline-design-toolbar .inline-save-design{border-color:#c7181b;background:#c7181b;color:#fff}.inline-design-toolbar button:disabled{opacity:.55;cursor:wait}
        .inline-design-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;border-radius:11px;background:#fff;padding:9px;box-shadow:0 5px 16px #10201812}.inline-design-controls label{display:grid;gap:5px;color:#58675f;font-size:10px;font-weight:850}.inline-design-controls input:not([type=color]):not([type=range]){width:100%;border:1px solid #d8e0db;border-radius:8px;padding:8px}.inline-design-controls input[type=color]{width:100%;height:34px;border:1px solid #d8e0db;border-radius:8px;background:#fff}.inline-design-controls input[type=range]{width:100%}.inline-design-controls button{border:1px solid #d8e0db;border-radius:8px;background:#fff;padding:8px;font-size:10px;font-weight:900;cursor:pointer}.inline-design-controls .wide-control{grid-column:1/-1}.inline-design-controls .danger-control{color:#a5161b;background:#fff1f0;border-color:#efc9c7}.inline-design-controls p{grid-column:1/-1;margin:0;color:#68786f;font-size:10px;font-weight:750}.inline-design-error{margin:0;border-radius:8px;background:#fff0ef;color:#a51317;padding:8px 10px;font-size:10px;font-weight:850}
        @media(max-width:600px){.inline-design-head{align-items:flex-start}.inline-design-head span{max-width:120px;text-align:right}.inline-design-toolbar{grid-template-columns:repeat(3,1fr)}.inline-design-toolbar .inline-save-design{grid-column:1/-1}.inline-design-controls{grid-template-columns:1fr}.inline-design-controls .wide-control{grid-column:auto}}
      `}</style>
    </section>
  );
}
