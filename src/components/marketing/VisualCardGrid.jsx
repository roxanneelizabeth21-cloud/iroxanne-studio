// Storyboard grid for Visual Grid / Day view cards: narrow vertical columns that
// wrap and align left instead of stretching a few cards across the whole row.
export default function VisualCardGrid({ children }) {
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
      {children}
    </div>
  );
}