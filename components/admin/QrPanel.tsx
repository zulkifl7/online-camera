"use client";

import { Copy, Download } from "lucide-react";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function QrPanel({
  label,
  url,
  status,
  uploadsEnabled,
  onPause,
  onResume,
  onRotate,
  busy,
}: {
  label: string;
  url: string | null;
  status?: string;
  uploadsEnabled?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onRotate?: () => void;
  busy?: boolean;
}) {
  const [image, setImage] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!url) {
      setImage("");
      return;
    }
    QRCode.toDataURL(url, { width: 640, margin: 2, errorCorrectionLevel: "M" })
      .then(setImage)
      .catch(() => setImage(""));
  }, [url]);

  async function copy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="grid gap-4 p-4 sm:grid-cols-[160px_1fr] sm:items-center">
      <div className="flex items-center justify-center rounded-md bg-surface">
        {image ? <img src={image} alt="" className="h-40 w-40" /> : <div className="grid h-40 w-40 place-items-center text-xs text-muted">QR unavailable</div>}
      </div>
      <div className="grid gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-ink">{label}</h3>
          {status ? <StatusBadge status={status} /> : null}
          {uploadsEnabled === false ? <StatusBadge status="paused" /> : null}
        </div>
        {url ? <p className="break-all text-xs text-muted">{url}</p> : <p className="text-sm text-muted">Rotate the link to create a new camera URL.</p>}
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={copy} disabled={!url}>
            <Copy size={16} aria-hidden />
            {copied ? "Copied" : "Copy link"}
          </Button>
          {image ? (
            <a className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line px-4 text-sm font-semibold" href={image} download={`${label.replaceAll(/[^\w]+/g, "-").toLowerCase()}.png`}>
              <Download size={16} aria-hidden />
              Download QR
            </a>
          ) : null}
          {onPause && uploadsEnabled ? (
            <Button variant="secondary" onClick={onPause} disabled={busy}>Pause uploads</Button>
          ) : null}
          {onResume && uploadsEnabled === false ? (
            <Button variant="secondary" onClick={onResume} disabled={busy}>Resume uploads</Button>
          ) : null}
          {onRotate ? (
            <Button variant="secondary" onClick={onRotate} disabled={busy}>Rotate link</Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
