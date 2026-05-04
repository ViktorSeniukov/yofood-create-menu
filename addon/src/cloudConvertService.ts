interface CloudConvertTask {
  id: string
  name: string
  status: string
  result?: {
    files?: Array<{ url: string; filename: string }>
    form?: { url: string; parameters: Record<string, string> }
  }
}

interface CloudConvertJob {
  id: string
  status: string
  tasks: CloudConvertTask[]
}

function convertDocToText(base64Data: string, mimeType: string): string {
  const ccKey = getCloudConvertKey()
  if (!ccKey) throw new Error('CloudConvert API-ключ не задан')

  const base64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data
  const bytes = Utilities.base64Decode(base64)

  const job = createCloudConvertJob(ccKey)
  uploadToCloudConvert(job, bytes, mimeType)
  const done = pollCloudConvert(job.id, ccKey)
  return fetchConvertedText(done)
}

function createCloudConvertJob(apiKey: string): CloudConvertJob {
  const response = UrlFetchApp.fetch(`${CLOUDCONVERT_API_URL}/jobs`, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: `Bearer ${apiKey}` },
    payload: JSON.stringify({
      tasks: {
        'import-file': { operation: 'import/upload' },
        'convert-file': {
          operation: 'convert',
          input: 'import-file',
          input_format: 'doc',
          output_format: 'txt',
        },
        'export-file': { operation: 'export/url', input: 'convert-file' },
      },
    }),
    muteHttpExceptions: true,
  })

  if (response.getResponseCode() !== 201) {
    throw new Error(`CloudConvert: ошибка создания задачи (${response.getResponseCode()})`)
  }

  const data = JSON.parse(response.getContentText()) as { data: CloudConvertJob }
  return data.data
}

function uploadToCloudConvert(job: CloudConvertJob, bytes: number[], mimeType: string): void {
  const importTask = job.tasks.find((t) => t.name === 'import-file')
  if (!importTask?.result?.form) {
    throw new Error('CloudConvert: нет данных для загрузки файла')
  }

  const { url, parameters } = importTask.result.form
  const payload: Record<string, string | GoogleAppsScript.Base.Blob> = {}
  for (const [k, v] of Object.entries(parameters)) {
    payload[k] = v
  }
  const filename = mimeType === 'application/msword' ? 'menu.doc' : 'menu.docx'
  payload['file'] = Utilities.newBlob(bytes, mimeType, filename)

  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    payload,
    muteHttpExceptions: true,
  })

  if (response.getResponseCode() >= 300) {
    throw new Error(`CloudConvert: ошибка загрузки файла (${response.getResponseCode()})`)
  }
}

function pollCloudConvert(jobId: string, apiKey: string): CloudConvertJob {
  for (let i = 0; i < CLOUDCONVERT_MAX_POLLS; i++) {
    Utilities.sleep(CLOUDCONVERT_POLL_INTERVAL_MS)

    const response = UrlFetchApp.fetch(`${CLOUDCONVERT_API_URL}/jobs/${jobId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      muteHttpExceptions: true,
    })

    const data = JSON.parse(response.getContentText()) as { data: CloudConvertJob }
    const job = data.data

    if (job.status === 'finished') return job
    if (job.status === 'error') {
      const failed = job.tasks.find((t) => t.status === 'error')
      throw new Error('CloudConvert: ошибка конвертации' + (failed ? ` (${failed.name})` : ''))
    }
  }

  throw new Error('CloudConvert: таймаут конвертации')
}

function fetchConvertedText(job: CloudConvertJob): string {
  const exportTask = job.tasks.find((t) => t.name === 'export-file')
  const fileUrl = exportTask?.result?.files?.[0]?.url
  if (!fileUrl) throw new Error('CloudConvert: нет URL результата')

  const response = UrlFetchApp.fetch(fileUrl, { muteHttpExceptions: true })
  if (response.getResponseCode() !== 200) {
    throw new Error(`CloudConvert: ошибка скачивания результата (${response.getResponseCode()})`)
  }

  return response.getContentText()
}
