'use server';

import { generateProductDescription } from '@/lib/gemini';

export async function generateDescriptionAction(productName: string, categoryName?: string) {
  try {
    if (!productName) {
      return { success: false, error: 'Product name is required' };
    }

    const description = await generateProductDescription(productName, categoryName);
    return { success: true, description };
  } catch (error) {
    console.error('Action Error:', error);
    return { success: false, error: 'Failed to generate AI description' };
  }
}
