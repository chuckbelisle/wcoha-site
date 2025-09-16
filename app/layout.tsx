import './globals.css';
export const metadata = { title: 'WCOHA – West Carleton Oldtimers Hockey', description: '35+ Men’s League since 1989' };
export default function RootLayout({ children }: { children: React.ReactNode }) { return (<html lang='en'><body>{children}</body></html>); }