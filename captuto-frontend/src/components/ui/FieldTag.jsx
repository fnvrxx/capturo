export default function FieldTag({ name, type }) {
  const typeColors = {
    text: 'bg-blue-50 text-blue-600',
    number: 'bg-purple-50 text-purple-600',
    date: 'bg-green-50 text-green-600',
    currency: 'bg-amber-50 text-amber-600',
    email: 'bg-pink-50 text-pink-600',
  };

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border border-gray-100 bg-gray-50 text-gray-700">
      {name}
      <span className={`px-1 py-0.5 rounded text-[10px] font-medium ${typeColors[type] || 'bg-gray-100 text-gray-500'}`}>
        {type}
      </span>
    </span>
  );
}
