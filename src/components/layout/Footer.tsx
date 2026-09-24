import { Link } from '@/lib/navigation';
import { Glasses } from 'lucide-react';

const footerSections = [
  {
    title: 'Shop',
    links: [
      { to: '/shop', label: 'All Eyewear' },
      { to: '/shop/sunglasses', label: 'Sunglasses' },
      { to: '/shop/optical', label: 'Optical' },
    ],
  },
  {
    title: 'Experience',
    links: [
      { to: '/try-on', label: 'Virtual Try-On' },
      { to: '/assistant', label: 'AI Assistant' },
    ],
  },
  {
    title: 'Company',
    links: [
      { to: '/about', label: 'About' },
      { to: '/contact', label: 'Contact' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-ink-200 bg-white">
      <div className="container-app py-14">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold">
              <Glasses className="h-5 w-5 text-primary-600" aria-hidden />
              Vuera
            </Link>
            <p className="mt-3 text-sm text-ink-500 text-pretty">
              AI-powered eyewear. Find your perfect pair.
            </p>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-ink-900">{section.title}</h3>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-ink-500 transition-colors hover:text-ink-900"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-ink-200 pt-6">
          <p className="text-sm text-ink-400">
            &copy; {new Date().getFullYear()} Vuera. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
