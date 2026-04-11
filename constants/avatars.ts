/**
 * Avatar System - Nilah / Korat Flow
 * 16 NFT-style avatars for beauty professionals
 */

export interface AvatarOption {
  id: string;
  name: string;
  role: string;
  // Sprite sheet coords: which batch image + row/col (0-indexed in 2x2 grid)
  batch: 1 | 2 | 3 | 4;
  row: 0 | 1;
  col: 0 | 1;
  // Accent color for the avatar halo/glow effect
  accent: string;
  emoji: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  // Batch 1
  { id: 'av1', name: 'Nail Queen',         role: 'Nail Artist',     batch: 1, row: 0, col: 0, accent: '#FF6BAE', emoji: '💅' },
  { id: 'av2', name: 'Stylist Star',       role: 'Estilista',       batch: 1, row: 0, col: 1, accent: '#C0A060', emoji: '✂️' },
  { id: 'av3', name: 'Lash Boss',          role: 'Lashista',        batch: 1, row: 1, col: 0, accent: '#8B5CF6', emoji: '👁️' },
  { id: 'av4', name: 'Salon Director',     role: 'Dueña del Salón', batch: 1, row: 1, col: 1, accent: '#F0A0A0', emoji: '👑' },
  // Batch 2
  { id: 'av5', name: 'Glow Expert',        role: 'Esteticista',     batch: 2, row: 0, col: 0, accent: '#E94F4F', emoji: '🌿' },
  { id: 'av6', name: 'Glam Artist',        role: 'Maquilladora',    batch: 2, row: 0, col: 1, accent: '#F59E0B', emoji: '💄' },
  { id: 'av7', name: 'Edge Barber',        role: 'Barbera',         batch: 2, row: 1, col: 0, accent: '#7C3AED', emoji: '⚡' },
  { id: 'av8', name: 'Beauty Creator',     role: 'Influencer',      batch: 2, row: 1, col: 1, accent: '#D97706', emoji: '📸' },
  // Batch 3
  { id: 'av9',  name: 'Natural Queen',     role: 'Tricóloga',       batch: 3, row: 0, col: 0, accent: '#D97706', emoji: '🌸' },
  { id: 'av10', name: 'Spa Goddess',       role: 'Masajista',       batch: 3, row: 0, col: 1, accent: '#10B981', emoji: '🧿' },
  { id: 'av11', name: 'Rock Stylist',      role: 'Colorista',       batch: 3, row: 1, col: 0, accent: '#34D399', emoji: '🤘' },
  { id: 'av12', name: 'Silver CEO',        role: 'Empresaria',      batch: 3, row: 1, col: 1, accent: '#94A3B8', emoji: '🏆' },
  // Batch 4
  { id: 'av13', name: 'Boho Soul',         role: 'Stylist',         batch: 4, row: 0, col: 0, accent: '#F59E0B', emoji: '🌻' },
  { id: 'av14', name: 'Tech Visionary',    role: 'Innovadora',      batch: 4, row: 0, col: 1, accent: '#A78BFA', emoji: '🚀' },
  { id: 'av15', name: 'Latina Fire',       role: 'Colorista',       batch: 4, row: 1, col: 0, accent: '#EF4444', emoji: '🔥' },
  { id: 'av16', name: 'Fitness Beauty',    role: 'Coach',           batch: 4, row: 1, col: 1, accent: '#06B6D4', emoji: '💪' },
];

export const getAvatarById = (id: string): AvatarOption | undefined =>
  AVATAR_OPTIONS.find(a => a.id === id);

export const getRandomAvatar = (): AvatarOption =>
  AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
