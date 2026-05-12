import { useState, useEffect, type SyntheticEvent } from "react";
import { ProductWithCategory, UpsertProductInput, upsertProduct, VariantInput, generateDescription } from "../actions";
import { CategorySelect } from "../../categories/actions";
import { parseIDR, formatIDR } from "@/lib/currency";
import { toast } from "sonner";

export interface ProductFormData {
  name: string;
  categoryId: string;
  description: string;
  price: string;
  original_price: string;
  stock: number;
  images: string[];
  specs: Record<string, string>;
  isNew: boolean;
  isFeatured: boolean;
  brand: string;
  genderTarget: 'Men' | 'Women' | 'Kids' | 'Unisex';
  isPublished: boolean;
  variants: VariantInput[];
}

export function useProductForm(
  categories: CategorySelect[],
  onSuccess: (product: ProductWithCategory, isNew: boolean) => void,
  closeModal: () => void
) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithCategory | null>(null);
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    categoryId: categories[0]?.id || "",
    description: "",
    price: "0",
    original_price: "0",
    stock: 0,
    images: [],
    specs: {},
    isNew: false,
    isFeatured: false,
    brand: "Unbranded",
    genderTarget: "Unisex",
    isPublished: true,
    variants: []
  });

  const handleCategoryChange = (newCategoryId: string) => {
    const newCategory = categories.find(c => c.id === newCategoryId);
    const currentSpecs = formData.specs;
    const hasSpecs = Object.keys(currentSpecs).length > 0;

    if (hasSpecs && formData.categoryId !== newCategoryId) {
      const confirm = globalThis.confirm(
        "Changing category will reset current specifications. Continue?"
      );
      if (!confirm) return;
    }

    // Initialize specs from category blueprint
    const newSpecs: Record<string, string> = {};
    if (newCategory?.specifications?.attributes) {
      newCategory.specifications.attributes.forEach(attr => {
        newSpecs[attr] = "";
      });
    }

    setFormData(prev => ({
      ...prev,
      categoryId: newCategoryId,
      specs: newSpecs,
      // Variants now only track name (Size), stock, and price
      variants: prev.variants.map(v => ({
        ...v,
        attributes: {} 
      }))
    }));
  };

  const resetForm = (product: ProductWithCategory | null = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        categoryId: product.categoryId,
        description: product.description || "",
        price: formatIDR(product.price),
        original_price: formatIDR(product.original_price || 0),
        stock: product.stock,
        images: product.images || [],
        specs: (product.specs as Record<string, string>) || {},
        isNew: product.isNew,
        isFeatured: product.isFeatured,
        brand: product.brand,
        genderTarget: product.genderTarget as any,
        isPublished: product.isPublished,
        variants: (product.variants || []).map(v => ({
          ...v,
          attributes: v.attributes as Record<string, any>,
          price: v.price || null
        }))
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        categoryId: categories[0]?.id || "",
        description: "",
        price: "0",
        original_price: "0",
        stock: 0,
        images: [],
        specs: {},
        isNew: false,
        isFeatured: false,
        brand: "Unbranded",
        genderTarget: "Unisex",
        isPublished: true,
        variants: []
      });
    }
  };

  // Effect for Real-Time Total Stock Calculation (Derived State)
  useEffect(() => {
    if (formData.variants.length > 0) {
      const totalStock = formData.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
      if (totalStock !== formData.stock) {
        setFormData(prev => ({ ...prev, stock: totalStock }));
      }
    }
  }, [formData.variants]);

  // Static spec builder logic removed in favor of Spec-Driven Architecture

  // Helper untuk menambah varian kosong
  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          name: "",
          attributes: {},
          stock: 0,
          price: null,
          sku: ""
        }
      ]
    }));
  };

  const bulkAddVariants = (input: string) => {
    if (!input.trim()) return;

    const lastVariant = formData.variants.at(-1);
    // Default price from last variant if available
    const basePrice = lastVariant?.price || null;

    // Parse labels: "40-42" or "40, 41, 42"
    let labels: string[] = [];
    if (input.includes("-")) {
      const [start, end] = input.split("-").map(s => Number.parseInt(s.trim(), 10));
      if (!Number.isNaN(start) && !Number.isNaN(end) && start <= end) {
        for (let i = start; i <= end; i++) {
          labels.push(i.toString());
        }
      }
    } else {
      labels = input.split(/[,|]/).map(s => s.trim()).filter(Boolean);
    }

    if (labels.length === 0) return;

    const newVariants: VariantInput[] = labels.map(label => ({
      name: label,
      attributes: {},
      stock: 0,
      price: basePrice,
      sku: ""
    }));

    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, ...newVariants]
    }));

    toast.success(`Berhasil membuat ${labels.length} varian sekaligus!`);
  };

  const removeVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const updateVariant = (index: number, data: Partial<VariantInput>) => {
    setFormData(prev => {
      const newVariants = [...prev.variants];
      newVariants[index] = { ...newVariants[index], ...data };
      return { ...prev, variants: newVariants };
    });
  };

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Sanitize main data
      const submissionData: UpsertProductInput = {
        ...formData,
        id: editingProduct?.id,
        price: parseIDR(formData.price),
        original_price: parseIDR(formData.original_price),
        // variants are already sanitized in updateVariant (numeric stock)
      };

      console.log("Submitting upsert product data:", submissionData);
      
      const res = await upsertProduct(submissionData);
      
      if (res.success && res.data) {
        const updatedProduct: ProductWithCategory = {
          ...res.data,
          category: categories.find(c => c.id === res.data!.categoryId) || null,
          variants: formData.variants as any // Simplified for UI update, getProducts will fetch real data on refresh
        };
        toast.success(`Produk "${updatedProduct.name}" berhasil ${editingProduct ? "diperbarui" : "ditambahkan"}!`);
        onSuccess(updatedProduct, !editingProduct);
        closeModal();
      } else {
        toast.error(res.error || "Gagal menyimpan produk");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan sistem saat menyimpan produk");
    } finally {
      setIsLoading(false);
    }
  };

  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  
  const generateAIDescription = async () => {
    if (!formData.name) {
      toast.warning("Masukkan nama produk terlebih dahulu");
      return;
    }

    setIsAiLoading(true);
    setAiSuggestions([]); // Clear previous
    try {
      const selectedCategory = categories.find(c => c.id === formData.categoryId);
      const res = await generateDescription(formData.name, selectedCategory?.name || "");
      
      if (res.success && res.data) {
        setAiSuggestions(res.data.suggestions);
        const { totalTokens } = res.data.usage;
        toast.success(`AI berhasil membuat 3 pilihan deskripsi! (Usage: ${totalTokens} tokens)`);
      } else {
        toast.error(res.error || "AI gagal membuat deskripsi");
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal terhubung dengan layanan AI");
    } finally {
      setIsAiLoading(false);
    }
  };

  const selectAiSuggestion = (text: string) => {
    setFormData(prev => ({ ...prev, description: text }));
    setAiSuggestions([]); // Clear after selection
    toast.success("Saran AI berhasil diterapkan!");
  };

  return {
    formData,
    setFormData,
    isLoading,
    editingProduct,
    resetForm,
    handleCategoryChange,
    handleSubmit,
    generateAIDescription,
    selectAiSuggestion,
    aiSuggestions,
    isAiLoading,
    addVariant,
    bulkAddVariants,
    removeVariant,
    updateVariant
  };
}

