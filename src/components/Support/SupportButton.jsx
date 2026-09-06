import React, { useState } from 'react';
import { Coffee } from 'lucide-react';
import SupportModal from '@/components/Support/SupportModal';
import { trackEvent } from '@/utils/analytics';

const VARIANTS = {
  // Desktop header nav pill — matches the other icon links.
  navPill:
    'whitespace-nowrap flex items-center gap-1.5 2xl:gap-2 text-amber-300 hover:text-amber-200 transition-all duration-200 font-semibold text-xs 2xl:text-base px-1.5 2xl:px-0',
  // Mobile drawer row — matches the other nav links.
  navRow:
    'text-white hover:text-amber-300 transition-colors font-semibold py-3 pl-3 rounded-lg hover:bg-slate-800/50 flex items-center gap-2 min-h-[48px] w-full text-left',
  // Footer link — matches the other footer link rows.
  footerLink: 'text-gray-400 hover:text-amber-400 transition-colors flex items-center group',
  // Small standalone CTA under the footer social icons.
  footerCta:
    'inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 px-4 py-2 text-sm font-semibold transition-colors',
  // Standalone gradient CTA — for the Advertise page section.
  cta: 'inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white px-5 py-2.5 text-sm font-semibold shadow-lg transition-colors',
};

const SupportButton = ({
  variant = 'navPill',
  label = 'Buy me a coffee',
  showIcon = true,
  source,
  className = '',
  onBeforeOpen,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const open = () => {
    trackEvent({ action: 'support_button_click', category: 'monetization', label: source || variant });
    onBeforeOpen?.();
    setIsOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={open}
        className={`${VARIANTS[variant] || VARIANTS.navPill} ${className}`}
        title="Support DataEngineer Hub"
      >
        {showIcon && <Coffee className="w-4 h-4 2xl:w-5 2xl:h-5 shrink-0" />}
        <span>{label}</span>
        {variant === 'footerLink' && (
          <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
        )}
      </button>
      <SupportModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default SupportButton;
