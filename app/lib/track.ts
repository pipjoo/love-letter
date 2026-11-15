// Pushes a named moment to Google Tag Manager's dataLayer. GTM only loads when
// NEXT_PUBLIC_GTM_ID is set, so on a default copy there is no dataLayer and
// this does nothing.
export function track(event: string, params: Record<string, string> = {}) {
  const w = window as unknown as { dataLayer?: object[] };
  w.dataLayer?.push({ event, ...params });
}
