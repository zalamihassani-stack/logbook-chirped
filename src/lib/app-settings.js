export const DEFAULT_APP_SETTINGS = {
  push_notifications: false,
  validation_required: true,
  allow_hors_objectifs: true,
  compte_rendu_required: false,
}

export function isMissingAppSettingsTable(error) {
  return error?.code === 'PGRST205' || error?.message?.includes("app_settings")
}

export async function getAppSettings(supabase, columns = '*') {
  const { data, error } = await supabase
    .from('app_settings')
    .select(columns)
    .eq('id', 1)
    .maybeSingle()

  if (error) {
    if (isMissingAppSettingsTable(error)) return { settings: DEFAULT_APP_SETTINGS, missingTable: true }
    return { settings: DEFAULT_APP_SETTINGS, error }
  }

  return { settings: { ...DEFAULT_APP_SETTINGS, ...(data ?? {}) }, missingTable: false }
}
