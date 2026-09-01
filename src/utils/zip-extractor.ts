import JSZip from 'jszip'

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']

export async function extractImagesFromZip(zipFile: File): Promise<File[]> {
  try {
    const zip = new JSZip()
    const loaded = await zip.loadAsync(zipFile)

    const imageFiles: File[] = []

    for (const [filename, file] of Object.entries(loaded.files)) {
      if (file.dir) continue

      const data = await file.async('blob')
      const isImage = IMAGE_MIME_TYPES.includes(data.type) ||
                      /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(filename)

      if (isImage) {
        imageFiles.push(new File([data], filename, { type: data.type || 'application/octet-stream' }))
      }
    }

    return imageFiles
  } catch (error) {
    throw new Error('Erro ao extrair arquivo ZIP')
  }
}

export function filterImageFiles(files: File[]): File[] {
  return files.filter(file =>
    file.type.startsWith('image/') ||
    /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.name)
  )
}
