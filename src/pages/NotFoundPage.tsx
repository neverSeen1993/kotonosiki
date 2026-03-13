import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Cat } from 'lucide-react';
import catFacts from '../data/catFacts';

function getRandomFact() {
  return catFacts[Math.floor(Math.random() * catFacts.length)];
}

export default function NotFoundPage() {
  const [fact] = useState(getRandomFact);

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
      <Cat size={64} className="text-teal-300 mb-4" />
      <h1 className="text-4xl font-bold text-gray-700 mb-2">404</h1>
      <p className="text-gray-400 mb-6">Ця сторінка загубилася, як цікавий кіт.</p>
      <div className="bg-teal-50 rounded-xl px-5 py-4 max-w-md mb-8">
        <p className="text-sm text-teal-700 italic">🐾 {fact}</p>
      </div>
      <Link to="/" className="btn-primary">На головну</Link>
    </div>
  );
}
