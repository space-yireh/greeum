import type { NextConfig } from 'next';
const config: NextConfig = { poweredByHeader: false, outputFileTracingIncludes: {'/api/generate': ['./assets/**/*']}, async headers() { return [{source:'/:path*',headers:[{key:'Referrer-Policy',value:'no-referrer'},{key:'X-Content-Type-Options',value:'nosniff'},{key:'X-Frame-Options',value:'DENY'}]}]; } }; export default config;
