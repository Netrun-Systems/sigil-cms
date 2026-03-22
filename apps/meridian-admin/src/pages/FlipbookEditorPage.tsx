/**
 * Flipbook editor — configure display settings, preview, manage pages.
 */

import { ArrowLeft, Save, Settings, Eye, Palette } from 'lucide-react';

export default function FlipbookEditorPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <a href="/flipbooks" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </a>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Flipbook Settings</h1>
          <p className="mt-1 text-gray-600">Configure display settings for this flipbook.</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-meridian-indigo text-white rounded-lg hover:bg-meridian-navy transition-colors">
          <Save className="w-4 h-4" />
          Save Settings
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Display Settings
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Page Animation</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-meridian-sky/50">
                <option value="flip">3D Page Flip</option>
                <option value="slide">Slide</option>
                <option value="fade">Fade</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
              <div className="flex items-center gap-2">
                <input type="color" defaultValue="#1a1a2e" className="w-10 h-10 rounded border border-gray-200 cursor-pointer" />
                <input type="text" defaultValue="#1a1a2e" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono" />
              </div>
            </div>
            <div className="space-y-3">
              <ToggleOption label="Auto-play" description="Automatically advance pages" defaultChecked={false} />
              <ToggleOption label="Show toolbar" description="Display navigation toolbar" defaultChecked={true} />
              <ToggleOption label="Show page count" description="Display page numbers" defaultChecked={true} />
              <ToggleOption label="Enable sharing" description="Allow readers to share flipbook URL" defaultChecked={true} />
              <ToggleOption label="Enable download" description="Allow readers to download the PDF" defaultChecked={false} />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5" />
              Preview
            </h2>
            <div className="aspect-[3/4] bg-gray-900 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Palette className="w-10 h-10 mx-auto mb-2" />
                <p className="text-sm">Flipbook preview</p>
                <p className="text-xs mt-1">Upload a PDF to see the preview</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleOption({ label, description, defaultChecked }: { label: string; description: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input type="checkbox" defaultChecked={defaultChecked} className="mt-1 rounded border-gray-300 text-meridian-indigo focus:ring-meridian-sky" />
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-xs text-gray-600">{description}</p>
      </div>
    </label>
  );
}
