/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during builds
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer, webpack }) => {
    // webpack is provided by Next.js, no need to import it
    // Exclude balena-sdk from client-side bundling
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    // Use webpack IgnorePlugin to ignore LICENSE and other non-JS files from balena-sdk
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /\.(LICENSE|md|txt)$/,
        contextRegExp: /node_modules\/balena-sdk/,
      })
    );

    // Also add a rule to ignore these files using ignore-loader
    config.module.rules.push({
      test: /node_modules\/balena-sdk\/.*\.(LICENSE|md|txt)$/,
      use: 'ignore-loader',
    });

    // For server-side, properly externalize balena-sdk
    if (isServer) {
      const originalExternals = config.externals;
      config.externals = [
        ...(Array.isArray(originalExternals) ? originalExternals : [originalExternals]),
        ({ request }, callback) => {
          // Externalize balena-sdk and its dependencies
          if (request && (request === 'balena-sdk' || request.startsWith('balena-sdk/'))) {
            return callback(null, `commonjs ${request}`);
          }
          callback();
        },
      ];
    }

    return config;
  },
  // Experimental: Better handling of server components
  experimental: {
    serverComponentsExternalPackages: ['balena-sdk'],
  },
};

export default nextConfig;
