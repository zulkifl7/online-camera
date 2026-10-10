import type { Viewport } from "next";
import { CameraExperience } from "@/components/camera/CameraExperience";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function CameraPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <CameraExperience token={token} />;
}
