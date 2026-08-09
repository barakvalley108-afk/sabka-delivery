"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";

async function compressImage(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Image file select karo");
  if (file.size > 10 * 1024 * 1024)
    throw new Error("Photo 10 MB se chhota hona chahiye");

  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Photo read nahi hua"));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("Photo open nahi hua"));
    element.src = source;
  });

  const scale = Math.min(1, 960 / image.width, 720 / image.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Photo process nahi hua");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.76);
}

export default function ImagePicker({
  value,
  onChange,
  label = "Choose photo",
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function processFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      onChange(await compressImage(file));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Photo select nahi hua");
    } finally {
      setBusy(false);
    }
  }

  async function select(event: ChangeEvent<HTMLInputElement>) {
    await processFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLLabelElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setDragging(false);
    }
  }

  async function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    await processFile(event.dataTransfer.files?.[0]);
  }

  return (
    <div className="image-picker">
      <label
        className={`image-picker-dropzone${dragging ? " image-picker-dragging" : ""}${busy ? " image-picker-busy" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={select}
          disabled={busy}
        />

        {value ? (
          <img src={value} alt="Selected preview" />
        ) : (
          <i aria-hidden="true">＋</i>
        )}

        <span>
          {busy
            ? "Photo preparing…"
            : dragging
              ? "Drop photo here"
              : value
                ? "Change photo"
                : label}
        </span>

        {!busy && !value && !dragging && (
          <small>Click to choose or drag &amp; drop an image</small>
        )}
      </label>

      {value && (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            onChange("");
            if (inputRef.current) inputRef.current.value = "";
          }}
        >
          Remove
        </button>
      )}

      {error && <small>{error}</small>}
    </div>
  );
}
