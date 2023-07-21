/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        instrumentationHook: true // See https://nextjs.org/docs/pages/building-your-application/optimizing/open-telemetry#custom-spans
    },                            // for information on customizing instrumentation
}

module.exports = nextConfig
