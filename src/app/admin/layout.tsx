import { AdminLayoutClient } from "@/components/admin/AdminLayoutClient";

export default function AdminLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <AdminLayoutClient>
      {children}
    </AdminLayoutClient>
  );
}
