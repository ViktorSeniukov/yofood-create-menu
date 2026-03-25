import ConvertApi from 'convertapi-js'

/**
 * Converts a .doc file to plain text via ConvertAPI (browser-side).
 * Returns extracted text content.
 */
export async function convertDocToText(
  file: File,
  apiSecret: string
): Promise<string> {
  const client = ConvertApi.auth(apiSecret)
  const params = client.createParams()
  params.add('file', file)

  const result = await client.convert('doc', 'txt', params)
  const fileUrl = result.files[0]?.Url

  if (!fileUrl) {
    throw new Error('ConvertAPI: конвертация не вернула файл')
  }

  const response = await fetch(fileUrl)

  if (!response.ok) {
    throw new Error(
      `ConvertAPI: ошибка загрузки файла (${response.status})`
    )
  }

  return response.text()
}
