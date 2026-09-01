import JSZip from 'jszip'

export interface ZipFile {
  name: string
  blob: Blob
}

export async function createZip(files: ZipFile[]): Promise<Blob> {
  const zip = new JSZip()

  files.forEach(file => {
    zip.file(file.name, file.blob)
  })

  return await zip.generateAsync({ type: 'blob' })
}
