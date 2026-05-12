import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not set in environment variables");
}

const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

export interface AiDescriptionResponse {
  suggestions: string[];
  usage: {
    promptTokens: number;
    candidatesTokens: number;
    totalTokens: number;
  };
}

export async function generateProductDescription(productName: string, categoryName?: string): Promise<AiDescriptionResponse> {
  try {
    const categoryText = categoryName ? ` kategori "${categoryName}"` : "";
    const prompt = `Buatkan 3 pilihan paragraf deskripsi produk e-commerce bergaya premium (seperti Zalora) dalam bahasa Indonesia untuk produk bernama "${productName}"${categoryText}. 
    
    Persyaratan:
    1. Gaya bahasa menarik, elegan, dan fokus pada keunggulan/kualitas.
    2. Maksimal 100 kata per pilihan.
    3. Kembalikan dalam format JSON array of strings: ["Opsi 1", "Opsi 2", "Opsi 3"].
    4. Hanya kirimkan JSON saja, tanpa teks penjelasan lain.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const usage = result.response.usageMetadata;
    
    // Clean JSON if model includes markdown code blocks
    const cleanJson = responseText.replaceAll("```json", "").replaceAll("```", "").trim();
    const suggestions = JSON.parse(cleanJson);

    return {
      suggestions: Array.isArray(suggestions) ? suggestions : [responseText],
      usage: {
        promptTokens: usage?.promptTokenCount || 0,
        candidatesTokens: usage?.candidatesTokenCount || 0,
        totalTokens: usage?.totalTokenCount || 0,
      }
    };
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw new Error("Gagal menghasilkan deskripsi dengan AI");
  }
}
