import React from 'react';
import { getSettings } from '@/lib/actions/settings';
import SettingsClient from './SettingsClient';

export const metadata = {
  title: 'Settings | Admin Erlinshop',
  description: 'Manage shop identity and configuration',
};

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-4xl font-black bg-linear-to-br from-[#B28D27] via-[#D4AF37] to-[#F9D976] bg-clip-text text-transparent tracking-tighter uppercase leading-none">
            Shop Settings
          </h1>
          <p className="bg-linear-to-r from-[#B28D27] to-[#F9D976] bg-clip-text text-transparent mt-2 text-[10px] font-black uppercase tracking-[0.3em]">
            Manage your luxury brand identity and store configuration.
          </p>
        </div>
      </div>

      <SettingsClient initialSettings={settings} />
    </div>
  );
}

