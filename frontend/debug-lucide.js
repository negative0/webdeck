
import * as LucideIcons from 'lucide-react';

const keys = Object.keys(LucideIcons);
console.log('Sample key:', keys[0]);
console.log('Type of Sample key value:', typeof LucideIcons[keys[0]]);
console.log('Sample key value:', LucideIcons[keys[0]]);

console.log('Is createLucideIcon present?', 'createLucideIcon' in LucideIcons);

const icons = Object.keys(LucideIcons).filter(
  (key) => typeof LucideIcons[key] !== 'undefined' && key !== 'createLucideIcon' && key !== 'icons'
);

console.log('Filtered icons length (non-undefined):', icons.length);
