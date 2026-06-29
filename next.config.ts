import { hostname } from 'os';

export default {
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb'
    }
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        search: ''
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        search: ''
      },
      {
        protocol: 'https',
        hostname: 't4.ftcdn.net'
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com'
      },
      {
        protocol: 'https',
        hostname: 'ckjejxhukysuuzhjxsvo.supabase.co'
      }
    ]
  }
};
