"use client";

import { useState, type FormEvent } from "react";
import ImagePicker from "./image-picker";
import BannerManager from "./banner-manager";

export type WebsiteContentBlock = {
  key: string;
  title: string;
  body: string;
  image: string;
};

type Send = (
  method: "POST" | "PATCH" | "DELETE",
  body: Record<string, unknown>,
) => Promise<boolean>;

function ContentCard({ block, send }: { block: WebsiteContentBlock; send: Send }) {
  const [image, setImage] = useState(block.image || "");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    await send("PATCH", {
      action: "content",
      key: block.key,
      title: form.get("title"),
      body: form.get("body"),
      image,
    });
    setSaving(false);
  }

  return (
    <form className="content-edit-card" onSubmit={submit}>
      <header>
        <span>{block.key.replaceAll("_", " ")}</span>
        <b>Customer website</b>
      </header>
      <label>
        Heading / main text
        <input name="title" defaultValue={block.title} />
      </label>
      <label>
        Description / secondary text
        <textarea name="body" defaultValue={block.body} rows={3} />
      </label>
      <ImagePicker value={image} onChange={setImage} label="Select section image" />
      <button disabled={saving}>{saving ? "Saving…" : "Save section"}</button>
    </form>
  );
}

export default function AdminWebsiteEditor({
  content,
  settings,
  send,
  busy,
}: {
  content: WebsiteContentBlock[];
  settings: Record<string, string>;
  send: Send;
  busy: boolean;
}) {
  function saveTheme(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void send("PATCH", {
      action: "website",
      values: {
        website_name: form.get("website_name"),
        theme_primary: form.get("theme_primary"),
        theme_accent: form.get("theme_accent"),
        theme_background: form.get("theme_background"),
      },
    });
  }

  return (
    <section className="website-editor">
      <form className="theme-editor" onSubmit={saveTheme}>
        <div>
          <small>LIVE WEBSITE CONTROL</small>
          <h2>Brand & theme</h2>
          <p>Save karte hi customer website par automatically update hoga.</p>
        </div>
        <label>
          Website name
          <input name="website_name" defaultValue={settings.website_name || "SABKA DELIVERY"} />
        </label>
        <label>
          Primary colour
          <input name="theme_primary" type="color" defaultValue={settings.theme_primary || "#c7181b"} />
        </label>
        <label>
          Accent colour
          <input name="theme_accent" type="color" defaultValue={settings.theme_accent || "#ffc21c"} />
        </label>
        <label>
          Background colour
          <input name="theme_background" type="color" defaultValue={settings.theme_background || "#fffdf7"} />
        </label>
        <button disabled={busy}>Apply website theme</button>
      </form>

      <BannerManager />

      <div className="website-editor-head">
        <div>
          <small>ALL CUSTOMER CONTENT</small>
          <h2>Text & image editor</h2>
        </div>
        <span>{content.length} editable sections</span>
      </div>
      <div className="content-editor-grid">
        {content.map((block) => (
          <ContentCard key={block.key} block={block} send={send} />
        ))}
      </div>
    </section>
  );
}
