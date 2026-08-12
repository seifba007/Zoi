
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Zoi brand palette — charcoal, cream, and the logo's orange + green
				cream: {
					50: '#FDFBF7',
					100: '#FAF5EC',
					200: '#F3E9D8',
					300: '#E9DAC1',
					400: '#DCC7A4',
					500: '#CBAF84',
					600: '#B4936A',
					700: '#937655',
					800: '#6F5941',
					900: '#4B3C2C',
				},
				ink: {
					50: '#F5F4F3',
					100: '#E3E0DD',
					200: '#C0BAB4',
					300: '#948B83',
					400: '#6B625B',
					500: '#4A423C',
					600: '#332D29',
					700: '#241F1C',
					800: '#181413',
					900: '#0F0C0B',
					950: '#080606',
				},
				// pulled from the Zoi logo
				ember: {
					50: '#FEF4ED',
					100: '#FBE2D0',
					200: '#F6BE9C',
					300: '#EE9566',
					400: '#E5713C',
					500: '#D8551E',
					600: '#B84318',
					700: '#933414',
					800: '#6E2711',
					900: '#4A1A0C',
				},
				basil: {
					50: '#F2F8EE',
					100: '#DFECD6',
					200: '#BFD9AC',
					300: '#98BF7C',
					400: '#73A455',
					500: '#57893C',
					600: '#446E2F',
					700: '#365726',
					800: '#28401D',
					900: '#1B2B14',
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				'4xl': '2rem',
				'5xl': '2.75rem',
			},
			fontFamily: {
				'display': ['Bricolage Grotesque', 'Georgia', 'serif'],
				'sans': ['Manrope', 'system-ui', 'sans-serif'],
				'playfair': ['Bricolage Grotesque', 'serif'],
				'inter': ['Manrope', 'sans-serif'],
			},
			boxShadow: {
				'soft': '0 2px 8px -2px rgb(24 20 19 / 0.06), 0 12px 32px -12px rgb(24 20 19 / 0.10)',
				'lift': '0 8px 20px -6px rgb(24 20 19 / 0.12), 0 24px 60px -20px rgb(24 20 19 / 0.22)',
				'glow': '0 12px 40px -12px rgb(185 58 47 / 0.45)',
			},
			backgroundImage: {
				'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-in-up': {
					'0%': { opacity: '0', transform: 'translateY(20px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'fade-in': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				'shimmer': {
					'100%': { transform: 'translateX(100%)' }
				},
				'ticker': {
					'0%': { transform: 'translateX(0)' },
					'100%': { transform: 'translateX(-50%)' }
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in-up': 'fade-in-up 0.6s ease-out',
				'fade-in': 'fade-in 0.6s ease-out',
				'shimmer': 'shimmer 1.8s infinite',
				'ticker': 'ticker 45s linear infinite',
			}
		}
	},
} satisfies Config;
