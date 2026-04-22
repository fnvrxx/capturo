import { useLocation } from 'react-router-dom';
import Badge from '../ui/Badge';

const pageTitles = {
  '/': 'Home',
  '/templates': 'Templates',
  '/ocr': 'Scan OCR',
};

export default function Topbar() {
  const { pathname } = useLocation();
  const title = pageTitles[pathname] || 'Capturo';

  return (
    <header className="h-[52px] bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-20">
      <h1 className="text-sm font-medium text-gray-800">{title}</h1>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Azure Document Intelligence</span>
        <Badge color="green">Connected</Badge>
      </div>
    </header>
  );
}
