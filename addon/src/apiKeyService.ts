function saveApiKey(key: string): void {
  PropertiesService.getUserProperties().setProperty(PROPS_API_KEY, key)
}

function getApiKey(): string | null {
  return PropertiesService.getUserProperties().getProperty(PROPS_API_KEY)
}

function clearApiKey(): void {
  PropertiesService.getUserProperties().deleteProperty(PROPS_API_KEY)
}

function hasApiKey(): boolean {
  return !!getApiKey()
}
