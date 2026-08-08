/**
 * Shapes of the Deadlock assets API responses.
 *
 * This is the adapter boundary. Only fields we actually read are declared, and
 * everything upstream is optional, because a field vanishing in a patch should
 * surface as a normalisation error we can read — not a TypeError at runtime.
 *
 * If upstream changes shape, this file and `normalise.ts` are the only two that
 * should need touching.
 */

export const API_BASE = 'https://api.deadlock-api.com'

export const ENDPOINTS = {
  heroes: `${API_BASE}/v1/assets/heroes`,
  items: `${API_BASE}/v1/assets/items`,
  patches: `${API_BASE}/v1/patches`,
  clientVersions: `${API_BASE}/v1/assets/client-versions`,
} as const

/** Upstream wraps descriptions in an object, and the text contains HTML. */
export interface UpstreamDescription {
  desc?: string
}

/** One entry in an ability's `properties` map. */
export interface UpstreamProperty {
  value?: number | string
  label?: string
  postfix?: string
}

export interface UpstreamHero {
  id?: number
  class_name?: string
  name?: string
  player_selectable?: boolean
  disabled?: boolean
  in_development?: boolean
  images?: Record<string, string | null>
  /** Maps slot names (`signature1`..`signature4`, innates, weapons) to item `class_name`s. */
  items?: Record<string, string | null>
}

export interface UpstreamItem {
  id?: number
  class_name?: string
  name?: string
  type?: 'upgrade' | 'ability' | 'weapon'
  description?: UpstreamDescription
  image?: string | null
  image_webp?: string | null
  shop_image?: string | null
  shop_image_webp?: string | null
  properties?: Record<string, UpstreamProperty>
  // Upgrade-only
  cost?: number
  item_tier?: number
  item_slot_type?: string
  shopable?: boolean
  disabled?: boolean
  is_active_item?: boolean
  // Ability-only
  ability_type?: string
}

export interface UpstreamPatch {
  title?: string
  pub_date?: string
  link?: string
}
