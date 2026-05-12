"use client";

import { useState } from "react";
import { ProductWithCategory, deleteProduct, toggleProductPublished } from "./actions";
import { CategorySelect } from "../categories/actions";
import { Modal } from "@/components/ui/Modal";
import { ProductSearchFilters } from "./components/ProductSearchFilters";
import { ProductTable } from "./components/ProductTable";
import { ProductForm } from "./components/ProductForm";
import { useProductForm } from "./hooks/useProductForm";
import { PaginatedResponse } from "@/types";

import { toast } from "sonner";

interface ProductClientProps {
  readonly initialData: PaginatedResponse<ProductWithCategory>;
  readonly categories: CategorySelect[];
}

export default function ProductClient({ initialData, categories }: ProductClientProps) {
  const [products, setProducts] = useState<ProductWithCategory[]>(initialData.data);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const onMutationSuccess = (product: ProductWithCategory, isNew: boolean) => {
    if (isNew) {
      setProducts(prev => [product, ...prev]);
    } else {
      setProducts(prev => prev.map(p => p.id === product.id ? product : p));
    }
  };

  const {
    formData,
    setFormData,
    isLoading: isMutationLoading,
    editingProduct,
    addVariant,
    bulkAddVariants,
    removeVariant,
    updateVariant,
    resetForm,
    handleCategoryChange,
    handleSubmit,
    generateAIDescription,
    selectAiSuggestion,
    aiSuggestions,
    isAiLoading
  } = useProductForm(categories, onMutationSuccess, () => setIsModalOpen(false));

  const openModal = (product: ProductWithCategory | null = null) => {
    resetForm(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!globalThis.confirm("Hapus produk ini beserta semua gambarnya?")) return;
    
    setIsDeleting(true);
    try {
      const res = await deleteProduct(id);
      if (res.success) {
        setProducts(prev => prev.filter(p => p.id !== id));
        toast.success("Produk berhasil dihapus");
      } else {
        toast.error(res.error || "Gagal menghapus produk");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan sistem saat menghapus produk");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePublish = async (id: string, isPublished: boolean) => {
    // Optimistic Update
    const previousProducts = [...products];
    setProducts(prev => prev.map(p => p.id === id ? { ...p, isPublished } : p));

    try {
      const res = await toggleProductPublished(id, isPublished);
      if (res.success) {
        toast.success(isPublished ? "Produk telah dipublikasikan" : "Produk disembunyikan");
      } else {
        // Revert on failure
        setProducts(previousProducts);
        toast.error(res.error || "Gagal mengubah status visibilitas");
      }
    } catch (error) {
      // Revert on error
      setProducts(previousProducts);
      console.error(error);
      toast.error("Terjadi kesalahan sistem saat mengubah visibilitas");
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <ProductSearchFilters 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={categories}
        onAddClick={() => openModal()}
      />

      {/* Product Table */}
      <ProductTable 
        products={filteredProducts}
        metadata={initialData.metadata}
        onEdit={openModal}
        onDelete={handleDelete}
        onTogglePublish={handleTogglePublish}
        isLoading={isDeleting}
      />

      {/* Add/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingProduct ? "Edit Produk" : "Tambah Produk Baru"}
        size="large"
      >
        <ProductForm 
          formData={formData}
          setFormData={setFormData}
          categories={categories}
          isLoading={isMutationLoading}
          editingProduct={!!editingProduct}
          handleCategoryChange={handleCategoryChange}
          handleSubmit={handleSubmit}
          generateAIDescription={generateAIDescription}
          isAiLoading={isAiLoading}
          onCancel={() => setIsModalOpen(false)}
          addVariant={addVariant}
          bulkAddVariants={bulkAddVariants}
          removeVariant={removeVariant}
          updateVariant={updateVariant}
          selectAiSuggestion={selectAiSuggestion}
          aiSuggestions={aiSuggestions}
        />
      </Modal>
    </div>
  );
}
