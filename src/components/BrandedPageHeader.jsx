import React from 'react';

/**
 * Branded header for client-facing pages (contract, intake, proposals).
 * Prints cleanly with the logo and project info.
 */
export default function BrandedPageHeader({ title, subtitle, projectTitle, clientName }) {
  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .ir-branded-header { background: #2D2A4A !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .ir-app-bg, .bg-background { background: white !important; }
          .rounded-2xl, .rounded-\\[22px\\], .rounded-\\[18px\\] { border-radius: 0 !important; }
          .shadow-sm, .shadow-lg { box-shadow: none !important; }
          .backdrop-blur-xl { backdrop-filter: none !important; }
        }
      `}</style>
      <div className="ir-branded-header rounded-[18px] overflow-hidden mb-6 print:rounded-none" style={{ background: 'linear-gradient(135deg, #2D2A4A 0%, #4A3F6B 50%, #2D2A4A 100%)' }}>
        <div className="px-6 py-5 md:px-8 md:py-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-lg" style={{ fontFamily: 'serif' }}>R</div>
            <span className="text-white/60 text-xs font-medium tracking-widest uppercase">iRoxanne Studio</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white">{title}</h1>
          {subtitle && <p className="text-white/70 text-sm mt-1">{subtitle}</p>}
          {(projectTitle || clientName) && (
            <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-sm">
              {projectTitle && <span className="text-amber-300/90 font-medium">{projectTitle}</span>}
              {clientName && <span className="text-white/60">Prepared for {clientName}</span>}
            </div>
          )}
        </div>
        <div className="h-1" style={{ background: 'linear-gradient(90deg, #C9A84C 0%, #E8D5A0 50%, #C9A84C 100%)' }} />
      </div>
    </>
  );
}

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="no-print inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
      Print / Save as PDF
    </button>
  );
}

export function BrandedFooter() {
  return (
    <div className="text-center text-xs text-gray-400 dark:text-gray-600 mt-8 pt-4 border-t border-gray-200 dark:border-gray-800">
      <p className="font-medium">iRoxanne Studio</p>
      <p className="mt-0.5">Custom apps built by a real person. • roxanne@iroxannestudio.com</p>
    </div>
  );
}
