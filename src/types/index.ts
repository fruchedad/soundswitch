// Extension types and interfaces

export interface SoundCloudUser {
  id: number;
  username: string;
  full_name?: string;
  avatar_url?: string;
  followers_count?: number;
  followings_count?: number;
  track_count?: number;
  playlist_count?: number;
}

export interface SavedAccount {
  id: number;
  username: string;
  displayName: string;
  avatarUrl?: string;
  cookies: CookieData[];
  savedAt: number;
}

export interface CookieData {
  name: string;
  value: string;
  domain: string;
  path: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite?: chrome.cookies.SameSiteStatus;
}

export interface StorageData {
  viewMode: 'public' | 'user';
  darkMode: boolean;
  statsCache: Record<string, CachedData>;
  accounts: Record<number, SavedAccount>;
  activeAccount: number | null;
}

export interface CachedData {
  data: any;
  timestamp: number;
}

export interface MessageRequest {
  action: string;
  [key: string]: any;
}

export interface MessageResponse {
  success?: boolean;
  error?: string;
  [key: string]: any;
}

export interface FollowerGrowth {
  total: number;
  newThisWeek: number;
  growthRate: number;
}

export interface ViewModeSettings {
  hidePrivateTracks: boolean;
  showStats: boolean;
  autoHidePrivate: boolean;
}

// Chrome extension specific types
export interface ExtensionManifest {
  manifest_version: 3;
  name: string;
  version: string;
  description: string;
  permissions: string[];
  host_permissions: string[];
  background: {
    service_worker: string;
    type?: 'module';
  };
  content_scripts: Array<{
    matches: string[];
    js: string[];
    css?: string[];
    run_at?: 'document_start' | 'document_end' | 'document_idle';
  }>;
  action: {
    default_popup: string;
    default_icon: Record<string, string>;
  };
  icons: Record<string, string>;
  web_accessible_resources: Array<{
    resources: string[];
    matches: string[];
  }>;
} 