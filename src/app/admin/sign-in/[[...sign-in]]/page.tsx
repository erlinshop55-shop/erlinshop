// src/app/admin/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from '@clerk/nextjs';

export default function AdminSignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950">
      <SignIn />
    </main>
  );
}
