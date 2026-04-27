const API_URL = 'https://api.cloudconvert.com/v2'
const POLL_INTERVAL = 2000
const MAX_POLL_ATTEMPTS = 30

interface CloudConvertTask {
  id: string
  name: string
  operation: string
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

/**
 * Converts a .doc file to plain text via CloudConvert API.
 * Returns extracted text content.
 */
export async function convertDocToText(
  file: File,
  apiKey: string
): Promise<string> {
  const job = await createJob(apiKey)

  await uploadFile(job, file)

  const completedJob = await pollJobStatus(job.id, apiKey)

  return downloadResult(completedJob)
}

async function createJob(
  apiKey: string
): Promise<CloudConvertJob> {
  const response = await fetch(`${API_URL}/jobs`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tasks: {
        'import-file': {
          operation: 'import/upload',
        },
        'convert-file': {
          operation: 'convert',
          input: 'import-file',
          input_format: 'doc',
          output_format: 'txt',
        },
        'export-file': {
          operation: 'export/url',
          input: 'convert-file',
        },
      },
    }),
  })

  if (!response.ok) {
    throw new Error(
      `CloudConvert: ошибка создания задачи (${response.status})`
    )
  }

  const data = await response.json() as { data: CloudConvertJob }
  return data.data
}

async function uploadFile(
  job: CloudConvertJob,
  file: File
): Promise<void> {
  const uploadTask = job.tasks.find(
    (t) => t.name === 'import-file'
  )

  if (!uploadTask?.result?.form) {
    throw new Error(
      'CloudConvert: не получены данные для загрузки файла'
    )
  }

  const formData = new FormData()
  const { url, parameters } = uploadTask.result.form

  for (const [key, value] of Object.entries(parameters)) {
    formData.append(key, value)
  }
  formData.append('file', file)

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(
      `CloudConvert: ошибка загрузки файла (${response.status})`
    )
  }
}

async function pollJobStatus(
  jobId: string,
  apiKey: string
): Promise<CloudConvertJob> {
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    await new Promise((resolve) => {
      setTimeout(resolve, POLL_INTERVAL)
    })

    const response = await fetch(`${API_URL}/jobs/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      throw new Error(
        `CloudConvert: ошибка проверки статуса (${response.status})`
      )
    }

    const data = await response.json() as { data: CloudConvertJob }
    const job = data.data

    if (job.status === 'finished') {
      return job
    }

    if (job.status === 'error') {
      const failedTask = job.tasks.find((t) => t.status === 'error')
      throw new Error(
        'CloudConvert: ошибка конвертации'
        + (failedTask ? ` (задача: ${failedTask.name})` : '')
      )
    }
  }

  throw new Error('CloudConvert: таймаут ожидания конвертации')
}

async function downloadResult(
  job: CloudConvertJob
): Promise<string> {
  const exportTask = job.tasks.find(
    (t) => t.name === 'export-file'
  )

  const fileUrl = exportTask?.result?.files?.[0]?.url

  if (!fileUrl) {
    throw new Error('CloudConvert: конвертация не вернула файл')
  }

  const response = await fetch(fileUrl)

  if (!response.ok) {
    throw new Error(
      `CloudConvert: ошибка скачивания файла (${response.status})`
    )
  }

  return response.text()
}
