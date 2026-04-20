export default function JsonPreview({ data }) {
  return (
    <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs font-mono overflow-auto max-h-80 text-gray-700 whitespace-pre-wrap">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
