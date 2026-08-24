declare class Mp3Encoder {
  constructor(channels: number, sampleRate: number, bitrate: number)
  encodeBuffer(left: Int16Array, right: Int16Array | null): Uint8Array
  flush(): Uint8Array
}

declare namespace lamejs {
  export { Mp3Encoder }
}

declare global {
  const lamejs: {
    Mp3Encoder: typeof Mp3Encoder
  }
}

export {}
