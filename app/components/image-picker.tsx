"use client";

import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

async function compressImage(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Sirf image file upload karo");
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Photo 10 MB se chhota hona chahiye");
  }

  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () =>
      reject(new Error("Photo read nahi hua"));

    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>(
    (resolve, reject) => {
      const element = new Image();

      element.onload = () => resolve(element);
      element.onerror = () =>
        reject(new Error("Photo open nahi hua"));

      element.src = source;
    },
  );

  const scale = Math.min(
    1,
    960 / image.width,
    720 / image.height,
  );

  const canvas = document.createElement("canvas");

  canvas.width = Math.max(
    1,
    Math.round(image.width * scale),
  );
  canvas.height = Math.max(
    1,
    Math.round(image.height * scale),
  );

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Photo process nahi hua");
  }

  context.drawImage(
    image,
    0,
    0,
    canvas.width,
    canvas.height,
  );

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
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);

  async function useFile(file: File | undefined) {
    if (!file || busy) return;

    setBusy(true);
    setError("");

    try {
      const compressed = await compressImage(file);
      onChange(compressed);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Photo select nahi hua",
      );
    } finally {
      setBusy(false);
    }
  }

  async function select(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    await useFile(file);
    event.target.value = "";
  }

  function dragEnter(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();

    dragDepth.current += 1;
    setDragging(true);
  }

  function dragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();

    event.dataTransfer.dropEffect = "copy";
    setDragging(true);
  }

  function dragLeave(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();

    dragDepth.current = Math.max(
      0,
      dragDepth.current - 1,
    );

    if (dragDepth.current === 0) {
      setDragging(false);
    }
  }

  function drop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();

    dragDepth.current = 0;
    setDragging(false);

    const files = Array.from(
      event.dataTransfer.files || [],
    );

    const imageFile =
      files.find((file) =>
        file.type.startsWith("image/"),
      ) || files[0];

    void useFile(imageFile);
  }

  return (
    <div
      className={`image-picker${dragging ? " is-dragging" : ""}`}
      aria-busy={busy}
      style={
        dragging
          ? {
              borderColor: "#d92330",
              background: "#fff3f4",
              boxShadow: "0 0 0 3px #d923301a",
            }
          : undefined
      }
    >
      <label
        onDragEnter={dragEnter}
        onDragOver={dragOver}
        onDragLeave={dragLeave}
        onDrop={drop}
        title="Photo click karke select karo ya yahan drag and drop karo"
      >
        <input
          type="file"
          accept="image/*"
          onChange={select}
          disabled={busy}
        />

        {value ? (
          <img
            src={value}
            alt="Selected preview"
          />
        ) : (
          <i aria-hidden="true">
            {dragging ? "↓" : "＋"}
          </i>
        )}

        <span>
          {busy
            ? "Photo preparing…"
            : dragging
              ? "Photo yahan drop karo"
              : value
                ? "Change photo • drag & drop bhi chalega"
                : `${label} • ya drag & drop`}
        </span>
      </label>

      {value && (
        <button
          type="button"
          disabled={busy}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();

            setError("");
            onChange("");
          }}
        >
          Remove
        </button>
      )}

      {error && <small role="alert">{error}</small>}
    </div>
  );
}
