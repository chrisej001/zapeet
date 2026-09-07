"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type UploadState = { status: "idle" } | { status: "uploading" } | { status: "done"; url: string } | { status: "error"; message: string };

export function DevicePhotoInput() {
  const [state, setState] = useState<UploadState>({ status: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setState({ status: "uploading" });
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("device-photos").upload(path, file, {
        contentType: file.type || "image/jpeg",
      });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("device-photos").getPublicUrl(path);
      setState({ status: "done", url: data.publicUrl });
    } catch (err) {
      setState({ status: "error", message: err instanceof Error ? err.message : "Upload failed." });
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-bold tracking-[0.06em] text-ink-60 uppercase">
        Photo of the device (optional)
      </span>
      <input type="hidden" name="device_image_url" value={state.status === "done" ? state.url : ""} />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {state.status === "done" ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={state.url} alt="Device" className="h-16 w-16 rounded-[10px] object-cover" />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-xs font-semibold text-ink underline"
          >
            Retake
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={state.status === "uploading"}
          className="rounded-[10px] border border-dashed border-ink/25 bg-white py-3 text-sm font-semibold text-ink disabled:opacity-60"
        >
          {state.status === "uploading" ? "Uploading…" : "📷 Take a photo"}
        </button>
      )}
      {state.status === "error" && <p className="text-xs text-terracotta">{state.message}</p>}
    </div>
  );
}
