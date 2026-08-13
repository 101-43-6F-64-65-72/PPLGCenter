/** @type {import('next').NextConfig} */

// Derive backend hostname from NEXT_PUBLIC_API_BASE_URL if set, so image remotePatterns
// automatically follow the configured backend without hardcoding any specific host.
const backendHostname = (() => {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!raw) return null;
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
})();

const remotePatterns = [
  // localhost (dev)
  { protocol: 'http', hostname: 'localhost', pathname: '/**' },
  { protocol: 'https', hostname: 'localhost', pathname: '/**' },
  { protocol: 'http', hostname: '127.0.0.1', pathname: '/**' },
  // Cloudinary
  { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
  { protocol: 'https', hostname: '*.cloudinary.com', pathname: '/**' },
  // Supabase storage
  { protocol: 'https', hostname: '*.supabase.co', pathname: '/**' },
  // Dev/placeholder image services
  { protocol: 'https', hostname: 'picsum.photos' },
  { protocol: 'https', hostname: 'images.unsplash.com' },
  { protocol: 'https', hostname: 'placehold.co' },
];

// Append the configured backend hostname at runtime if available and non-localhost
if (backendHostname && backendHostname !== 'localhost' && backendHostname !== '127.0.0.1') {
  remotePatterns.push({ protocol: 'https', hostname: backendHostname, pathname: '/**' });
}

const nextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns,
  },
};

export default nextConfig;
