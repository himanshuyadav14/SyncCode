import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_ZEGO_APP_ID: process.env.NEXT_PUBLIC_ZEGO_APP_ID,
    NEXT_PUBLIC_ZEGO_SERVER_SECRET: process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET,
  },
  // Socket.io runs on the same server (custom server.js). For split deployment
  // (e.g. Next on Vercel + Socket server elsewhere), set NEXT_PUBLIC_SOCKET_URL
  // and enable CORS on the Socket server for your frontend origin.
};

export default nextConfig;
