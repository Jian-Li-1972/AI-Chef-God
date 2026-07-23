import { GoogleGenAI, Modality } from "@google/genai";

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
  // Ensure we don't try to read past the end of the buffer if it's odd-lengthed
  const numSamples = Math.floor(data.byteLength / 2);
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, numSamples);
  const frameCount = Math.floor(numSamples / numChannels);
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

// Fix: Initialize GoogleGenAI with named apiKey parameter using GEMINI_API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const getLanguageName = (code: string): string => {
    const names: Record<string, string> = {
        'en': 'English',
        'es': 'Spanish',
        'fr': 'French',
        'zh-CN': 'Chinese (Simplified)',
        'zh-TW': 'Chinese (Traditional)'
    };
    return names[code] || 'English';
};

export const generateAndPlayAudio = async (text: string, lang: string): Promise<void> => {
    try {
        const languageName = getLanguageName(lang);
        // Fix: Use ai.models.generateContent for TTS with a clearer prompt
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `Please say the following text in ${languageName}: ${text}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' }, // A versatile voice
                    },
                },
            },
        });
        
        let base64Audio: string | undefined;
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData?.data) {
                    base64Audio = part.inlineData.data;
                    break;
                }
            }
        }

        if (!base64Audio) {
            console.error("Gemini API Response:", JSON.stringify(response, null, 2));
            throw new Error("No audio data received from API.");
        }

        const ctx = getAudioContext();
        if (ctx.state === 'suspended') {
            await ctx.resume();
        }

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
        throw error; // Re-throw to be caught by the component
    }
};
