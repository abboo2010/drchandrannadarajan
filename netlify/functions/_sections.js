// build-marker: 2026-09-02-b
// Canonical list of CMS sections, used to validate per-user permissions
// (admin_users.sections) and as the default "everything" set granted to
// the very first (bootstrap) account. 'users' is not a real content
// section — it means "can manage other logins from the Manage Users
// panel". Keep this in sync with the SECTIONS array in admin/index.html
// whenever a section is added, renamed, or removed there.
module.exports.ALL_SECTIONS = [
  'conditions', 'treatments', 'doctor-bio', 'education', 'videos',
  'testimonials', 'reviews', 'site-text', 'site-images', 'users',
];
