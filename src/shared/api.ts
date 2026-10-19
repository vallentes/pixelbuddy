import { invoke } from '@tauri-apps/api/core';
import type {
  Bootstrap,
  MonitorInfo,
  OverlayStatus,
  Pet,
  PetBootstrap,
  Reward,
  Settings,
  TwitchStatus,
  UpdateInfo,
} from './types';

export const api = {
  bootstrap: () => invoke<Bootstrap>('get_bootstrap'),
  updateSettings: (patch: Partial<Settings>) => invoke<Settings>('update_settings', { patch }),

  petBootstrap: (id: number) => invoke<PetBootstrap>('get_pet_bootstrap', { id }),
  createPet: (species: string, name: string) => invoke<Pet>('create_pet', { species, name }),
  updatePet: (id: number, patch: Partial<Pick<Pet, 'name' | 'color' | 'accessory' | 'visible'>> & { monitor?: string }) =>
    invoke<Pet>('update_pet', { id, patch }),
  deletePet: (id: number) => invoke<void>('delete_pet', { id }),
  petAction: (petId: number | null, action: string) => invoke<void>('pet_action', { petId, action }),
  savePetPosition: (id: number, x: number, y: number, monitor: string | null) =>
    invoke<void>('save_pet_position', { id, x, y, monitor }),
  monitors: () => invoke<MonitorInfo[]>('get_monitors'),
  cursorPosition: () => invoke<[number, number]>('cursor_position'),
  mouseButtonDown: () => invoke<boolean>('mouse_button_down'),

  checkForUpdate: () => invoke<UpdateInfo | null>('check_for_update'),
  installUpdate: () => invoke<void>('install_update'),
  openSupportLink: (kind: 'coffee' | 'revolut' = 'coffee') => invoke<void>('open_support_link', { kind }),

  overlayStatus: () => invoke<OverlayStatus>('overlay_status'),
  sendTestReaction: (action: string) => invoke<void>('send_test_reaction', { action }),
  twitchStatus: () => invoke<TwitchStatus>('twitch_status'),
  twitchBeginLogin: () => invoke<{ userCode: string; verificationUri: string; expiresAt: number }>('twitch_begin_login'),
  twitchCancelLogin: () => invoke<void>('twitch_cancel_login'),
  twitchDisconnect: () => invoke<void>('twitch_disconnect'),
  twitchReconnect: () => invoke<void>('twitch_reconnect'),
  twitchListRewards: () => invoke<Reward[]>('twitch_list_rewards'),
  twitchSetRewardAction: (rewardId: string, rewardTitle: string, action: string, petId: number | null) =>
    invoke<void>('twitch_set_reward_action', { rewardId, rewardTitle, action, petId }),

  showSettings: (section?: string) => invoke<void>('show_settings', { section: section ?? null }),
  openDataFolder: () => invoke<void>('open_data_folder'),
  quit: () => invoke<void>('quit_app'),
};

/** Normalizes an invoke rejection (string or structured error) into a message. */
export function errorMessage(e: unknown): string {
  if (typeof e === 'string') return e;
  if (e && typeof e === 'object' && 'message' in e) return String((e as { message: unknown }).message);
  return 'Something went wrong.';
}
