import { Link } from 'react-router-dom';
import { Cat } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Cat size={64} className="text-teal-300 mb-4" />
      <h1 className="text-4xl font-bold text-gray-700 mb-2">404</h1>
      <p className="text-gray-400 mb-6">This page wandered off like a curious cat.</p>
      <Link to="/" className="btn-primary">Go back home</Link>
    </div>
  );
}
