export default function LandingFooter({ theme }) {
  return (
    <footer className="px-4 py-10 border-t" style={{ borderColor: theme.border }}>
      <div className="max-w-3xl mx-auto text-center">
        <div
          className="mx-auto mb-6 h-px w-16"
          style={{ background: `linear-gradient(to right, transparent, ${theme.accent}, transparent)` }}
        />
        <p className="text-sm" style={{ color: theme.textMuted }}>
          © Roxsan Music. All rights reserved.
        </p>
      </div>
    </footer>
  );
}