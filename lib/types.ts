export type ClientProfile = {
  id: string;
  display_name: string;
  username: string;
  must_change_password: boolean;
};

export type AdminProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
};

export type ClientAccount = {
  id: string;
  display_name: string;
  username: string;
  email: string | null;
  phone: string | null;
  status: "active" | "suspended" | "archived";
  must_change_password: boolean;
  created_at: string;
  collections_count?: number;
  photos_count?: number;
};

export type CameraLink = {
  id: string;
  status: string;
  url: string | null;
  created_at: string | null;
  revoked_at: string | null;
};

export type AdminCollection = {
  id: string;
  client_id: string;
  type: "common" | "event";
  name: string;
  event_date: string | null;
  timezone: string | null;
  status: string;
  uploads_enabled: boolean;
  qr_label: string;
  camera_heading: string;
  cover_mobile_url: string | null;
  cover_desktop_url: string | null;
  visible_photo_count: number | null;
  camera_link?: CameraLink | null;
};

export type ClientCollection = {
  id: string;
  type: "common" | "event";
  name: string;
  event_date: string | null;
  visible_photo_count: number;
  cover_photo_id: string | null;
};

export type GalleryPhoto = {
  id: string;
  collection_id: string;
  collection_name: string | null;
  collection_type: "common" | "event" | null;
  width: number | null;
  height: number | null;
  created_at: string;
  thumbnail_url: string;
  preview_url: string;
};

export type AdminPhoto = {
  id: string;
  client_id: string;
  collection_id: string;
  collection_name: string | null;
  client_name: string | null;
  file_size_bytes: number;
  upload_status: string;
  failure_reason: string | null;
  client_hidden_at: string | null;
  created_at: string;
  thumbnail_url: string | null;
  preview_url: string | null;
};

export type DownloadJob = {
  id: string;
  mode: "single" | "archive";
  status: "queued" | "processing" | "ready" | "failed";
  file_name: string | null;
  file_size_bytes: number | null;
  photo_count: number;
  error_message: string | null;
  download_url: string | null;
};

export type CameraContext = {
  heading: string;
  kind: "common" | "event";
  client_name: string;
  upload_note: string;
  instruction: string;
  uploads_enabled: boolean;
  max_upload_bytes: number;
  allowed_types: string[];
  cover_mobile_url: string | null;
  cover_desktop_url: string | null;
};

export type PageMeta = {
  next_cursor?: string | null;
  prev_cursor?: string | null;
  current_page?: number;
  last_page?: number;
  total?: number;
};

export type Envelope<T> = {
  data: T;
  meta?: PageMeta;
};
