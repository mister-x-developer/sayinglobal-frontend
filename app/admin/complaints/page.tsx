import { redirect } from 'next/navigation';

/**
 * Complaints view is unified with the moderation queue. /admin/complaints
 * is kept as a familiar URL for older bookmarks; it redirects to the
 * canonical /admin/moderation page.
 */
export default function AdminComplaintsRedirect() {
  redirect('/admin/moderation');
}
