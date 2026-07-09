// Following Gemini API guidelines for audio decoding
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


let audioContext: AudioContext | null = null;
const getAudioContext = (): AudioContext => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return audioContext;
};

export const generateAndPlayAudio = async (text: string, lang: string): Promise<void> => {
    try {
        const response = await fetch("/api/generate-audio", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ text, lang }),
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || "Failed to generate audio from server");
        }

        const data = await response.json();
        const base64Audio = data.base64Audio;
        if (!base64Audio) {
            throw new Error("No audio data received from API.");
        }

        const ctx = getAudioContext();
        const audioBuffer = await decodeAudioData(
            decode(base64Audio),
            ctx,
            24000,
            1,
        );

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.start();

    } catch (error) {
        console.error("Error generating or playing audio:", error);
    }
};
