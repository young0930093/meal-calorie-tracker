export default function NutritionBar({ label, current, target, color, unit = 'g' }) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const over = target > 0 && current > target;

  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-medium" style={{ color: '#6B7280' }}>
          {label}
        </span>
        <span
          className="text-xs font-semibold"
          style={{ color: over ? '#EF4444' : '#374151' }}
        >
          {Math.round(current)}{unit} / {target}{unit}
          {over && <span className="ml-1">⚠️</span>}
        </span>
      </div>
      <div className="w-full rounded-full h-2.5" style={{ backgroundColor: '#F3F4F6' }}>
        <div
          className="h-2.5 rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: over ? '#EF4444' : color,
          }}
        />
      </div>
    </div>
  );
}
