export function formatTime(seconds: number): string {
  return new Date(seconds * 1000).toISOString().slice(14, 19)
}

export function bufferToWave(abuffer: AudioBuffer): Blob {
  const numOfChan = abuffer.numberOfChannels
  const length = abuffer.length * numOfChan * 2 + 44
  const buffer = new ArrayBuffer(length)
  const view = new DataView(buffer)
  const channels: Float32Array[] = []

  const setUint16 = (data: number) => {
    view.setUint16(view.byteLength - buffer.byteLength + 44, data, true)
  }

  const setUint32 = (data: number) => {
    view.setUint32(view.byteLength - buffer.byteLength + 44, data, true)
  }

  let pos = 0
  const setUint16At = (offset: number, data: number) => {
    view.setUint16(offset, data, true)
  }
  const setUint32At = (offset: number, data: number) => {
    view.setUint32(offset, data, true)
  }

  // RIFF header
  setUint32At(0, 0x46464952) // "RIFF"
  setUint32At(4, length - 8)
  setUint32At(8, 0x45564157) // "WAVE"
  setUint32At(12, 0x20746d66) // "fmt "
  setUint32At(16, 16)
  setUint16At(20, 1) // PCM
  setUint16At(22, numOfChan)
  setUint32At(24, abuffer.sampleRate)
  setUint32At(28, abuffer.sampleRate * 2 * numOfChan)
  setUint16At(32, numOfChan * 2)
  setUint16At(34, 16) // bits per sample
  setUint32At(36, 0x61746164) // "data"
  setUint32At(40, length - pos - 4)

  pos = 44
  for (let i = 0; i < abuffer.numberOfChannels; i++) {
    channels.push(abuffer.getChannelData(i))
  }

  let offset = 0
  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]))
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0
      view.setInt16(pos, sample, true)
      pos += 2
    }
    offset++
  }

  return new Blob([view], { type: 'audio/wav' })
}

export function encodeToMp3(audioBuffer: AudioBuffer, bitrate: number = 192): Blob | null {
  if (typeof lamejs === 'undefined') {
    console.error('lamejs library not loaded')
    return null
  }

  const channels = audioBuffer.numberOfChannels
  const mp3encoder = new lamejs.Mp3Encoder(channels, audioBuffer.sampleRate, bitrate)
  const mp3Data: Uint8Array[] = []
  const pcmLeft = audioBuffer.getChannelData(0)
  const pcmRight = channels > 1 ? audioBuffer.getChannelData(1) : pcmLeft

  const convert = (p: Float32Array) => {
    const buffer = new Int16Array(p.length)
    for (let i = 0; i < p.length; i++) {
      buffer[i] = p[i] < 0 ? p[i] * 0x8000 : p[i] * 0x7fff
    }
    return buffer
  }

  const samplesLeft = convert(pcmLeft)
  const samplesRight = convert(pcmRight)
  const sampleBlockSize = 1152

  for (let i = 0; i < samplesLeft.length; i += sampleBlockSize) {
    const leftChunk = samplesLeft.subarray(i, i + sampleBlockSize)
    let rightChunk = null
    if (channels > 1) {
      rightChunk = samplesRight.subarray(i, i + sampleBlockSize)
    }
    const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk)
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf)
    }
  }

  const mp3buf = mp3encoder.flush()
  if (mp3buf.length > 0) {
    mp3Data.push(mp3buf)
  }

  return new Blob(mp3Data, { type: 'audio/mpeg' })
}
