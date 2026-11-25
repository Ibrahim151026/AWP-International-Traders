import { buildWhatsAppUrl } from '../utils/exportReports';

export function WhatsAppIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2Zm5.81 14.07c-.24.69-1.41 1.31-1.95 1.39-.51.07-1.15.1-1.85-.12-.43-.14-.98-.32-1.69-.63-2.97-1.28-4.91-4.27-5.06-4.47-.15-.2-1.21-1.61-1.21-3.07 0-1.46.76-2.18 1.03-2.48.27-.3.59-.37.79-.37.2 0 .4 0 .57.01.18.01.43-.07.67.51.24.6.84 2.05.91 2.2.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.39-.44.52-.15.15-.3.31-.13.61.17.3.77 1.27 1.65 2.06 1.14 1.01 2.1 1.33 2.4 1.48.3.15.47.12.64-.07.17-.2.74-.86.94-1.16.2-.3.4-.25.67-.15.27.1 1.73.82 2.03.96.3.15.5.22.57.34.07.12.07.72-.17 1.41Z" />
    </svg>
  );
}

export function FloatingWhatsAppButton({ whatsappNumber }: { whatsappNumber: string }) {
  const href = buildWhatsAppUrl(whatsappNumber);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp Business"
      title="Chat on WhatsApp"
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-white shadow-lg flex items-center justify-center transition-transform duration-150 hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15803D] touch-manipulation"
    >
      <WhatsAppIcon className="w-7 h-7" />
    </a>
  );
}
