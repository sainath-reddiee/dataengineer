const defaults = require('tailwindcss/colors');

/**
 * "Editorial light" design system.
 *
 * paper — warm off-white page and panel neutrals
 * ink   — near-black text
 * rust  — the single accent (links, kickers, primary actions)
 *
 * The site was first built dark: headings are text-white, panels
 * bg-slate-800, accents text-blue-400 on bg-blue-600 buttons. Rather than
 * rewrite ~150 files, every legacy ramp below is INVERTED (shade k maps to
 * the 1000-k end of the light palette) so dark-theme classes render as their
 * light-theme counterparts: slate-900 backgrounds become paper, slate-300
 * text becomes dark ink, blue-400 text becomes rust, and text-white becomes
 * ink. Hand-designed surfaces use the semantic paper / ink / rust names.
 */
const paper = {
	DEFAULT: '#FAF8F4',
	50: '#FFFFFF',
	100: '#FDFCFA',
	200: '#FAF8F4',
	300: '#F4F0E8',
	400: '#ECE6DB',
	500: '#E4DED3',
	600: '#CFC7B8',
};

const ink = {
	DEFAULT: '#1B1A17',
	soft: '#2B2925',
	body: '#33302B',
	muted: '#5E584F',
	faint: '#77705F',
};

const rust = {
	50: '#FCF4EF',
	100: '#F8E4D9',
	200: '#F0C6B2',
	300: '#E2A487',
	400: '#D0714A',
	500: '#B4441F',
	600: '#9C3A1A',
	700: '#7F2F15',
	800: '#632511',
	900: '#4A1C0D',
	950: '#2E1108',
};

// Legacy dark-theme neutrals, inverted: 950/900 were page backgrounds,
// 800/700 panels and borders, 400-300 muted and body text, 100-50 headings.
const legacyNeutral = {
	50: '#1B1A17',
	100: '#24221E',
	200: '#2F2C27',
	300: '#3F3B35',
	400: '#5E584F',
	500: '#77705F',
	600: '#B8B0A2',
	700: '#DCD5C8',
	800: '#EFEAE1',
	900: '#F6F2EB',
	950: '#FAF8F4',
};

// Legacy blue/indigo/purple/pink accents: 300/400 were text on dark (now dark
// rust on paper); 500/600 were button fills under text-white, which is now
// ink, so they become soft rust tints that keep ink text readable.
const legacyAccent = {
	50: rust[900],
	100: rust[800],
	200: rust[700],
	300: rust[600],
	400: rust[500],
	500: rust[300],
	600: rust[200],
	700: '#F3D5C6',
	800: rust[100],
	900: rust[50],
	950: '#FDF7F3',
};

const invert = (ramp) => ({
	50: ramp[950], 100: ramp[900], 200: ramp[800], 300: ramp[700], 400: ramp[600],
	500: ramp[500],
	600: ramp[400], 700: ramp[300], 800: ramp[200], 900: ramp[100], 950: ramp[50],
});

const statusFamilies = ['red', 'rose', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan'];

/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{js,jsx}',
		'./components/**/*.{js,jsx}',
		'./app/**/*.{js,jsx}',
		'./src/**/*.{js,jsx}',
	],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px',
			},
		},
		extend: {
			fontFamily: {
				sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
				serif: ['"Source Serif 4"', 'Georgia', 'Cambria', '"Times New Roman"', 'serif'],
				mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
			},
			colors: {
				paper,
				ink,
				rust,
				white: ink.DEFAULT,
				black: paper.DEFAULT,
				slate: legacyNeutral,
				gray: legacyNeutral,
				zinc: legacyNeutral,
				neutral: legacyNeutral,
				stone: legacyNeutral,
				blue: legacyAccent,
				indigo: legacyAccent,
				sky: legacyAccent,
				purple: legacyAccent,
				violet: legacyAccent,
				fuchsia: legacyAccent,
				pink: legacyAccent,
				...Object.fromEntries(statusFamilies.map((name) => [name, invert(defaults[name])])),
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))',
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
			},
			keyframes: {
				'accordion-down': {
					from: { height: 0 },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: 0 },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
};