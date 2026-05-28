import { inviteAdmin, updateSiteSettings } from "../actions";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cfg } = await (supabase.from("site_settings") as any).select("key, value");
  const settings: Record<string, string> = Object.fromEntries(
    ((cfg ?? []) as { key: string; value: string }[]).map((r) => [r.key, r.value])
  );
  const featuredDays = settings["featured_days_window"] ?? "30";
  return (
    <div className="p-4 sm:p-8 max-w-xl space-y-6">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Settings</h1>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Invite an admin</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Send an invitation email. They will be granted admin access automatically when they sign up.
          </p>
        </div>
        <form action={inviteAdmin} className="flex flex-col sm:flex-row gap-2">
          <input
            name="email"
            type="email"
            required
            placeholder="colleague@example.com"
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium bg-blue-950 dark:bg-blue-200 text-white dark:text-blue-950 rounded-lg hover:bg-blue-900 dark:hover:bg-blue-300 transition-colors whitespace-nowrap"
          >
            Send invite
          </button>
        </form>
        <p className="text-xs text-gray-400">
          To promote an existing user, go to the <a href="/admin/users" className="underline hover:text-gray-600 dark:hover:text-gray-200">Users</a> page and click "Make admin" next to their name.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Featured sections</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Products appear in Trending, Best Selling, and New Arrivals for this many days after upload. If fewer than 3 qualify, the most recent products fill the gap.
          </p>
        </div>
        <form action={updateSiteSettings} className="flex items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Days window</label>
            <input
              name="featured_days_window"
              type="number"
              min="1"
              max="365"
              defaultValue={featuredDays}
              className="w-28 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button type="submit" className="px-4 py-2 text-sm font-medium bg-blue-950 dark:bg-blue-200 text-white dark:text-blue-950 rounded-lg hover:bg-blue-900 dark:hover:bg-blue-300 transition-colors">
            Save
          </button>
        </form>
      </div>
    </div>
  );
}
