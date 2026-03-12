import { Cat } from '../../types';
import { Cat as CatIcon } from 'lucide-react';
import { getDriveImageUrl } from '../../utils/driveImage';

interface CatAvatarProps {
  cat: Cat;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: { outer: 'w-10 h-10', icon: 16 },
  md: { outer: 'w-16 h-16', icon: 28 },
  lg: { outer: 'w-24 h-24', icon: 40 },
  xl: { outer: 'w-32 h-32', icon: 52 },
};

export default function CatAvatar({ cat, size = 'md', className = '' }: CatAvatarProps) {
  const { outer, icon } = sizeMap[size];

  const imgSrc = getDriveImageUrl(cat.photoUrl) || getDriveImageUrl(cat.driveUrl) || cat.photoUrl;

  if (imgSrc) {
    return (
      <div className={`${outer} rounded-full overflow-hidden flex-shrink-0 ${className}`}>
        <img src={imgSrc} alt={cat.name} className="w-full h-full object-cover" />
      </div>
    );
  }

  // Generate a deterministic color from the cat's name
  const colors = [
    'bg-teal-100 text-teal-600',
    'bg-purple-100 text-purple-600',
    'bg-amber-100 text-amber-600',
    'bg-pink-100 text-pink-600',
    'bg-blue-100 text-blue-600',
    'bg-green-100 text-green-600',
  ];
  const colorIndex = cat.name.charCodeAt(0) % colors.length;

  return (
    <div className={`${outer} rounded-full flex items-center justify-center flex-shrink-0 ${colors[colorIndex]} ${className}`}>
      <CatIcon size={icon} />
    </div>
  );
}
