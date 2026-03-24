// In-memory storage for development purposes
// In a real app, this would be a database like Supabase or PostgreSQL

export interface Snapshot {
  id: string;
  linkId: string;
  imageData: string; // Base64
  timestamp: number;
}

export interface CaptureLink {
  id: string;
  style: 'standard' | 'video' | 'social' | 'reward' | 'virtual' | 'digital';
  createdAt: number;
  label: string;
}

// Global state (reset on server restart)
const storage = {
  links: [] as CaptureLink[],
  snapshots: [] as Snapshot[],
  activeSessions: new Set<string>(),
};

export async function getLinks() {
  return storage.links;
}

export async function getLink(id: string) {
  return storage.links.find(l => l.id === id);
}

export async function createLink(style: CaptureLink['style'], label: string) {
  const newLink: CaptureLink = {
    id: Math.random().toString(36).substring(2, 9),
    style,
    label,
    createdAt: Date.now(),
  };
  storage.links.push(newLink);
  return newLink;
}

export async function saveSnapshot(linkId: string, imageData: string) {
  const snapshot: Snapshot = {
    id: Math.random().toString(36).substring(2, 11),
    linkId,
    imageData,
    timestamp: Date.now(),
  };
  storage.snapshots.push(snapshot);
  return snapshot;
}

export async function getSnapshots(linkId?: string) {
  if (linkId) {
    return storage.snapshots.filter(s => s.linkId === linkId);
  }
  return storage.snapshots;
}

export async function deleteSnapshot(id: string) {
  storage.snapshots = storage.snapshots.filter(s => s.id !== id);
}

export async function clearSnapshots(linkId?: string) {
  if (linkId) {
    storage.snapshots = storage.snapshots.filter(s => s.linkId !== linkId);
  } else {
    storage.snapshots = [];
  }
}
