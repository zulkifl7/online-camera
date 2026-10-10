"use client";

import { AlertCircle, Camera, Check, RotateCcw, Settings2, SwitchCamera, Timer, Upload, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BrandBar } from "@/components/brand/BrandBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/EmptyState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { apiBaseUrl, ApiError, ensureCsrf } from "@/lib/api";
import type { CameraContext, Envelope } from "@/lib/types";

type Stage = "loading" | "landing" | "requesting" | "capturing" | "preview" | "uploading" | "success" | "error" | "unavailable";
type Facing = "environment" | "user";
type TimerSeconds = 0 | 3 | 5 | 10;

const FILTERS = [
  { id: "original", label: "Original", css: "none" },
  { id: "eighties", label: "80s", css: "contrast(1.2) saturate(1.65) hue-rotate(325deg) brightness(1.06) sepia(0.08)" },
  { id: "polaroid", label: "Polaroid", css: "sepia(0.38) contrast(0.86) brightness(1.16) saturate(0.78)" },
  { id: "mono", label: "Black & white", css: "grayscale(1) contrast(1.15) brightness(1.02)" },
] as const;

const FILTER_SAMPLE =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7ec8e3"/><stop offset="1" stop-color="#f6d7b0"/></linearGradient></defs><rect width="80" height="80" fill="url(#sky)"/><circle cx="58" cy="20" r="9" fill="#ffe08a"/><path d="M0 54 L20 38 L38 50 L56 32 L80 56 L80 80 L0 80 Z" fill="#3d7a4a"/><circle cx="30" cy="42" r="9" fill="#e7b89a"/><path d="M16 64 Q30 50 44 64 L44 80 L16 80 Z" fill="#2c4d72"/></svg>`,
  );

const TIMERS: { seconds: TimerSeconds; label: string }[] = [
  { seconds: 0, label: "Off" },
  { seconds: 3, label: "3s" },
  { seconds: 5, label: "5s" },
  { seconds: 10, label: "10s" },
];

type FilterId = (typeof FILTERS)[number]["id"];

function newIdempotencyKey() {
  return crypto.randomUUID().replaceAll("-", "");
}

function filterCss(id: FilterId) {
  return FILTERS.find((filter) => filter.id === id)?.css ?? "none";
}

function clampByte(value: number) {
  return Math.max(0, Math.min(255, value));
}

function bakeFilter(context: CanvasRenderingContext2D, id: FilterId) {
  if (id === "original") return;
  const { width, height } = context.canvas;
  const image = context.getImageData(0, 0, width, height);
  const data = image.data;
  const steps = id === "eighties"
    ? [contrast(1.2), saturate(1.65), hueRotate(325), brightness(1.06), sepia(0.08)]
    : id === "polaroid"
      ? [sepia(0.38), contrast(0.86), brightness(1.16), saturate(0.78)]
      : [grayscale(1), contrast(1.15), brightness(1.02)];

  for (let index = 0; index < data.length; index += 4) {
    let red = data[index];
    let green = data[index + 1];
    let blue = data[index + 2];
    for (const step of steps) {
      [red, green, blue] = step(red, green, blue);
    }
    data[index] = clampByte(red);
    data[index + 1] = clampByte(green);
    data[index + 2] = clampByte(blue);
  }

  context.putImageData(image, 0, 0);
}

function brightness(amount: number) {
  return (red: number, green: number, blue: number): [number, number, number] => [red * amount, green * amount, blue * amount];
}

function contrast(amount: number) {
  return (red: number, green: number, blue: number): [number, number, number] => [
    (red / 255 - 0.5) * amount * 255 + 127.5,
    (green / 255 - 0.5) * amount * 255 + 127.5,
    (blue / 255 - 0.5) * amount * 255 + 127.5,
  ];
}

function saturate(amount: number) {
  return (red: number, green: number, blue: number): [number, number, number] => {
    const gray = red * 0.2126 + green * 0.7152 + blue * 0.0722;
    return [gray + (red - gray) * amount, gray + (green - gray) * amount, gray + (blue - gray) * amount];
  };
}

function grayscale(amount: number) {
  return (red: number, green: number, blue: number): [number, number, number] => {
    const gray = red * 0.2126 + green * 0.7152 + blue * 0.0722;
    return [red + (gray - red) * amount, green + (gray - green) * amount, blue + (gray - blue) * amount];
  };
}

function sepia(amount: number) {
  return (red: number, green: number, blue: number): [number, number, number] => {
    const nextRed = red * 0.393 + green * 0.769 + blue * 0.189;
    const nextGreen = red * 0.349 + green * 0.686 + blue * 0.168;
    const nextBlue = red * 0.272 + green * 0.534 + blue * 0.131;
    return [
      red + (nextRed - red) * amount,
      green + (nextGreen - green) * amount,
      blue + (nextBlue - blue) * amount,
    ];
  };
}

function hueRotate(degrees: number) {
  const angle = (degrees * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const matrix = [
    0.213 + cos * 0.787 - sin * 0.213,
    0.715 - cos * 0.715 - sin * 0.715,
    0.072 - cos * 0.072 + sin * 0.928,
    0.213 - cos * 0.213 + sin * 0.143,
    0.715 + cos * 0.285 + sin * 0.14,
    0.072 - cos * 0.072 - sin * 0.283,
    0.213 - cos * 0.213 - sin * 0.787,
    0.715 - cos * 0.715 + sin * 0.715,
    0.072 + cos * 0.928 + sin * 0.072,
  ];
  return (red: number, green: number, blue: number): [number, number, number] => [
    red * matrix[0] + green * matrix[1] + blue * matrix[2],
    red * matrix[3] + green * matrix[4] + blue * matrix[5],
    red * matrix[6] + green * matrix[7] + blue * matrix[8],
  ];
}

function coverSnapshot(video: HTMLVideoElement) {
  if (!video.videoWidth) return null;
  const size = 160;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context2d = canvas.getContext("2d");
  if (!context2d) return null;
  const scale = Math.max(size / video.videoWidth, size / video.videoHeight);
  const width = video.videoWidth * scale;
  const height = video.videoHeight * scale;
  context2d.drawImage(video, (size - width) / 2, (size - height) / 2, width, height);
  return canvas.toDataURL("image/jpeg", 0.72);
}

export function CameraExperience({ token }: { token: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const openId = useRef(0);
  const shooting = useRef(false);
  const takePhotoRef = useRef<() => Promise<void>>(async () => undefined);
  const facingRef = useRef<Facing>("user");
  const filterRef = useRef<FilterId>("original");
  const [stage, setStage] = useState<Stage>("loading");
  const [context, setContext] = useState<CameraContext | null>(null);
  const [message, setMessage] = useState("This camera link is not available.");
  const [capture, setCapture] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [loadError, setLoadError] = useState("");
  const [facing, setFacing] = useState<Facing>("user");
  const [filter, setFilter] = useState<FilterId>("original");
  const [timerSeconds, setTimerSeconds] = useState<TimerSeconds>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [filterSample, setFilterSample] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);

  facingRef.current = facing;
  filterRef.current = filter;

  const cameraOpen = stage === "requesting" || stage === "capturing" || stage === "preview" || stage === "uploading" || stage === "success" || (stage === "error" && Boolean(context));

  useEffect(() => {
    let cancelled = false;
    fetch(`${apiBaseUrl()}/api/v1/public/camera/${encodeURIComponent(token)}`, {
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        const body = await response.json().catch(() => null);
        if (!response.ok) {
          throw new ApiError(body?.message ?? "This camera link is not available.", response.status);
        }
        return body as Envelope<CameraContext>;
      })
      .then((body) => {
        if (cancelled) return;
        setContext(body.data);
        setStage("landing");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setMessage(error instanceof Error ? error.message : "This camera link is not available.");
        setStage("unavailable");
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    const url = previewUrl;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!cameraOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [cameraOpen]);

  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (stage !== "capturing" || !video || !stream) return;
    video.srcObject = stream;
    void video.play().catch(() => undefined);
  }, [stage, facing]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setCountdown(null);
      void takePhotoRef.current();
      return;
    }
    const id = window.setTimeout(() => {
      setCountdown((current) => (current === null ? null : current - 1));
    }, 1000);
    return () => window.clearTimeout(id);
  }, [countdown]);

  function stopStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  function closeCamera() {
    openId.current += 1;
    setCountdown(null);
    setSettingsOpen(false);
    stopStream();
    setStage("landing");
  }

  async function startCamera(nextFacing: Facing) {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage("This browser cannot open the camera. Use a current phone browser and allow camera access.");
      setStage("error");
      return;
    }

    const id = ++openId.current;
    setCountdown(null);
    setSettingsOpen(false);
    setStage("requesting");
    setSwitching(true);
    stopStream();

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { exact: nextFacing } },
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: nextFacing } },
        });
      }
      if (id !== openId.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      setFacing(nextFacing);
      setStage("capturing");
    } catch {
      if (id !== openId.current) return;
      setMessage("Camera permission was denied or this camera is unavailable. Allow camera access, then try again.");
      setStage("error");
    } finally {
      if (id === openId.current) setSwitching(false);
    }
  }

  async function switchCamera() {
    if (switching || countdown !== null) return;
    const nextFacing: Facing = facingRef.current === "environment" ? "user" : "environment";
    await startCamera(nextFacing);
  }

  async function takePhoto() {
    if (shooting.current) return;
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    shooting.current = true;
    try {
      const max = 2560;
      const scale = Math.min(1, max / Math.max(video.videoWidth, video.videoHeight));
      const width = Math.max(1, Math.round(video.videoWidth * scale));
      const height = Math.max(1, Math.round(video.videoHeight * scale));
      const source = document.createElement("canvas");
      source.width = width;
      source.height = height;
      const sourceContext = source.getContext("2d", { willReadFrequently: true });
      if (!sourceContext) return;
      if (facingRef.current === "user") {
        sourceContext.translate(width, 0);
        sourceContext.scale(-1, 1);
      }
      sourceContext.drawImage(video, 0, 0, width, height);

      bakeFilter(sourceContext, filterRef.current);

      const blob = await new Promise<Blob | null>((resolve) => source.toBlob(resolve, "image/jpeg", 0.92));
      if (!blob) {
        setMessage("The photo could not be captured. Try again.");
        setStage("error");
        return;
      }

      setCapture(blob);
      setPreviewUrl(URL.createObjectURL(blob));
      setIdempotencyKey(newIdempotencyKey());
      stopStream();
      setStage("preview");
    } finally {
      shooting.current = false;
    }
  }

  takePhotoRef.current = takePhoto;

  function onShutter() {
    if (switching) return;
    if (countdown !== null) {
      setCountdown(null);
      return;
    }
    setSettingsOpen(false);
    if (timerSeconds > 0) {
      setCountdown(timerSeconds);
      return;
    }
    void takePhoto();
  }

  function retake() {
    setPreviewUrl(null);
    setCapture(null);
    void startCamera(facingRef.current);
  }

  async function upload() {
    if (!capture) return;
    setStage("uploading");
    setProgress(0);
    setProcessing(false);
    setLoadError("");

    try {
      await ensureCsrf();
      const xsrf = document.cookie
        .split("; ")
        .find((part) => part.startsWith("XSRF-TOKEN="))
        ?.slice("XSRF-TOKEN=".length);

      const body = new FormData();
      body.append("photo", capture, "capture.jpg");

      const result = await new Promise<{ id: string; status: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${apiBaseUrl()}/api/v1/public/camera/${encodeURIComponent(token)}/photos`);
        xhr.withCredentials = true;
        xhr.setRequestHeader("Accept", "application/json");
        xhr.setRequestHeader("Idempotency-Key", idempotencyKey);
        if (xsrf) xhr.setRequestHeader("X-XSRF-TOKEN", decodeURIComponent(xsrf));
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 100));
        };
        xhr.upload.onload = () => {
          setProgress(100);
          setProcessing(true);
        };
        xhr.onerror = () => reject(new ApiError("The upload could not be completed. Check the connection and try again.", 0));
        xhr.onload = () => {
          const payload = xhr.responseText ? JSON.parse(xhr.responseText) : null;
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(payload.data);
            return;
          }
          reject(new ApiError(payload?.message ?? "The photo was not accepted.", xhr.status, payload?.errors));
        };
        xhr.send(body);
      });

      if (result.status === "failed") {
        throw new ApiError("The photo was received but could not be prepared. Try again.", 422);
      }

      setStage("success");
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "The photo was not uploaded.");
      setStage("error");
    }
  }

  function another() {
    setPreviewUrl(null);
    setCapture(null);
    setProgress(null);
    setProcessing(false);
    void startCamera(facingRef.current);
  }

  const liveFilter = filterCss(filter);

  if (cameraOpen && context) {
    return (
      <div className="fixed inset-0 z-40 h-dvh w-full overflow-hidden overscroll-none bg-brand text-white">
        <CoverBackdrop mobile={context.cover_mobile_url} desktop={context.cover_desktop_url} />
        {stage === "capturing" ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              filter: liveFilter,
              transform: facing === "user" ? "scaleX(-1)" : undefined,
            }}
          />
        ) : null}

        {stage === "preview" && previewUrl ? (
          <img src={previewUrl} alt="Captured photo preview" className="absolute inset-0 h-full w-full object-contain" />
        ) : null}

        <div className="relative flex h-full flex-col">
          <div className="flex items-center justify-between gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <IconButton label="Close camera" onClick={closeCamera}>
              <X size={22} aria-hidden />
            </IconButton>
            <p className="min-w-0 truncate text-sm font-semibold">{context.heading}</p>
            <span className="size-11" />
          </div>

          <div className="min-h-0 flex-1">
            {stage === "requesting" ? <CenterNote text={switching ? "Switching camera..." : "Opening camera..."} /> : null}
            {stage === "uploading" ? (
              <CenterNote
                text={processing ? "Processing photo..." : progress === null ? "Uploading photo..." : `Uploading photo... ${progress}%`}
              >
                <div className="mt-4 w-full max-w-xs">
                  <ProgressBar label="Photo upload progress" value={progress ?? undefined} indeterminate={processing || progress === null} />
                </div>
              </CenterNote>
            ) : null}
            {stage === "success" ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center" aria-live="polite">
                <Check size={28} aria-hidden />
                <p className="text-base font-semibold">Photo uploaded successfully</p>
                <Button className="w-full max-w-xs" onClick={another}>
                  Take another photo
                </Button>
              </div>
            ) : null}
            {stage === "error" ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center" role="alert">
                <AlertCircle size={28} aria-hidden />
                <p className="text-sm leading-6">{loadError || message}</p>
                {capture ? (
                  <Button className="w-full max-w-xs" onClick={upload}>Try again</Button>
                ) : (
                  <Button className="w-full max-w-xs" onClick={() => startCamera(facing)}>Try again</Button>
                )}
              </div>
            ) : null}
            {countdown !== null && countdown > 0 ? (
              <button
                type="button"
                className="flex h-full w-full flex-col items-center justify-center bg-brand/35"
                onClick={() => setCountdown(null)}
                aria-live="assertive"
              >
                <span className="text-7xl font-semibold tabular-nums">{countdown}</span>
                <span className="mt-3 text-sm">Tap to cancel</span>
              </button>
            ) : null}
          </div>

          {stage === "capturing" && countdown === null ? (
            <div className="grid grid-cols-[4.5rem_1fr_4.5rem] items-end px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <div className="flex flex-col items-center gap-1">
                {timerSeconds > 0 ? <span className="text-xs font-semibold text-white">{timerSeconds}s</span> : null}
                <IconButton
                  label="Camera settings"
                  pressed={settingsOpen}
                  onClick={() => {
                    setFilterSample(videoRef.current ? coverSnapshot(videoRef.current) : null);
                    setSettingsOpen((open) => !open);
                  }}
                >
                  <Settings2 size={22} aria-hidden />
                </IconButton>
              </div>
              <div className="flex justify-center pb-1">
                <button
                  type="button"
                  aria-label={timerSeconds > 0 ? `Capture with ${timerSeconds} second timer` : "Capture"}
                  disabled={switching}
                  onClick={onShutter}
                  className="size-[4.5rem] rounded-full border-4 border-white bg-white/90 disabled:opacity-50"
                />
              </div>
              <div className="flex justify-end">
                <IconButton
                  label={facing === "user" ? "Switch to rear camera" : "Switch to front camera"}
                  onClick={switchCamera}
                  disabled={switching}
                >
                  <SwitchCamera size={22} aria-hidden />
                </IconButton>
              </div>
            </div>
          ) : null}

          {stage === "preview" ? (
            <div className="grid grid-cols-2 gap-3 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <Button variant="secondary" onClick={retake}>
                <RotateCcw size={18} aria-hidden />
                Retake
              </Button>
              <Button onClick={upload}>
                <Upload size={18} aria-hidden />
                Upload
              </Button>
            </div>
          ) : null}
        </div>

        {settingsOpen && stage === "capturing" ? (
          <SettingsSheet
            filter={filter}
            timerSeconds={timerSeconds}
            sample={filterSample ?? FILTER_SAMPLE}
            mirrored={facing === "user"}
            onFilter={setFilter}
            onTimer={setTimerSeconds}
            onClose={() => setSettingsOpen(false)}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-page">
      <CoverBackdrop mobile={context?.cover_mobile_url ?? null} desktop={context?.cover_desktop_url ?? null} />
      <BrandBar compact linked={false} />
      <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 items-center px-4">
        <Card className="w-full p-5 sm:p-6">
          {stage === "loading" ? <p className="text-sm text-muted">Opening camera link...</p> : null}
          {stage === "unavailable" ? <ErrorState message={message} /> : null}
          {context && stage !== "unavailable" && stage !== "loading" ? (
            <div className="grid gap-5">
              <div>
                <p className="text-xs font-semibold tracking-wide text-muted uppercase">
                  {context.kind === "common" ? "Common camera" : "Event camera"}
                </p>
                <h1 className="mt-1 text-2xl font-semibold text-ink">{context.heading}</h1>
                <p className="mt-2 text-sm leading-6 text-muted">{context.instruction}</p>
              </div>
              {!context.uploads_enabled ? <ErrorState message="Uploads are paused for this camera link." /> : null}
              {context.uploads_enabled ? (
                <div className="grid gap-3">
                  <Button className="w-full" onClick={() => startCamera("user")}>
                    <Camera size={18} aria-hidden />
                    Click a Pic
                  </Button>
                  <p className="text-xs leading-5 text-muted">{context.upload_note}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </Card>
      </main>
    </div>
  );
}

function CoverBackdrop({ mobile, desktop }: { mobile: string | null; desktop: string | null }) {
  if (!mobile && !desktop) return null;
  const phone = mobile || desktop;
  const wide = desktop || mobile;

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {phone ? <div className="absolute inset-0 bg-cover bg-center md:hidden" style={{ backgroundImage: `url(${JSON.stringify(phone)})` }} /> : null}
      {wide ? <div className="absolute inset-0 hidden bg-cover bg-center md:block" style={{ backgroundImage: `url(${JSON.stringify(wide)})` }} /> : null}
    </div>
  );
}

function IconButton({
  label,
  pressed,
  disabled,
  onClick,
  children,
}: {
  label: string;
  pressed?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex size-11 items-center justify-center rounded-full bg-black/35 text-white disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function CenterNote({ text, children }: { text: string; children?: ReactNode }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center" aria-live="polite">
      <p className="text-sm font-semibold">{text}</p>
      {children}
    </div>
  );
}

function SettingsSheet({
  filter,
  timerSeconds,
  sample,
  mirrored,
  onFilter,
  onTimer,
  onClose,
}: {
  filter: FilterId;
  timerSeconds: TimerSeconds;
  sample: string;
  mirrored: boolean;
  onFilter: (id: FilterId) => void;
  onTimer: (seconds: TimerSeconds) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="absolute inset-0 z-20 flex items-end">
      <button type="button" aria-label="Close settings" className="absolute inset-0 bg-overlay" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="camera-settings-title"
        className="relative z-10 max-h-[70dvh] w-full overflow-y-auto rounded-t-lg bg-surface p-5 text-ink shadow-floating pb-[max(1.25rem,env(safe-area-inset-bottom))]"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="camera-settings-title" className="text-base font-semibold">Settings</h2>
          <button type="button" aria-label="Close settings" onClick={onClose} className="inline-flex size-11 items-center justify-center rounded-full text-ink">
            <X size={20} aria-hidden />
          </button>
        </div>

        <div className="grid gap-5">
          <div className="grid gap-2">
            <p className="text-sm font-medium">Filter</p>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {FILTERS.map((item) => {
                const selected = item.id === filter;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onFilter(item.id)}
                    className="flex w-[4.5rem] shrink-0 flex-col items-center gap-2"
                  >
                    <span className={`size-16 overflow-hidden rounded-full border-2 ${selected ? "border-primary" : "border-line"}`}>
                      <img
                        src={sample}
                        alt=""
                        className="size-full object-cover"
                        style={{
                          filter: item.css,
                          transform: mirrored ? "scaleX(-1)" : undefined,
                        }}
                      />
                    </span>
                    <span className={`text-center text-xs font-semibold ${selected ? "text-ink" : "text-muted"}`}>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-2">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Timer size={16} aria-hidden />
              Timer
            </p>
            <div className="grid grid-cols-4 gap-2">
              {TIMERS.map((item) => {
                const selected = item.seconds === timerSeconds;
                return (
                  <button
                    key={item.seconds}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onTimer(item.seconds)}
                    className={`min-h-11 rounded-md border text-sm font-semibold ${selected ? "border-primary bg-primary-soft text-ink" : "border-line bg-surface text-muted"}`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
