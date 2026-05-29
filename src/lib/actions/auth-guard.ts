// 📁 File Target: d:\Erlinshop\src\lib\actions\auth-guard.ts
// 🎯 Purpose: Proteksi administratif (Admin Guard) yang memvalidasi email pengguna Clerk terhadap daftar ADMIN_EMAILS dari env.
// 🔗 Depends on: @clerk/nextjs/server
// 💥 Used by (Blast Radius): Seluruh Server Actions administratif (settings, orders, bank CRUD)

import { auth, currentUser } from '@clerk/nextjs/server';

export async function verifyOwnerSession() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized: Anda harus masuk terlebih dahulu.");
  }

  const user = await currentUser();
  const userEmail = user?.emailAddresses[0]?.emailAddress;
  
  const adminEmailsStr = process.env.ADMIN_EMAILS ?? "";
  const adminEmails = adminEmailsStr.split(",").map(e => e.trim().toLowerCase()).filter(Boolean);

  if (!userEmail || !adminEmails.includes(userEmail.toLowerCase())) {
    throw new Error("Forbidden: Akun Anda tidak memiliki hak akses Administrator.");
  }

  return { userId, userEmail };
}
