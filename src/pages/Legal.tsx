import Layout from "@/components/Layout";

const Legal = () => (
  <Layout>
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="rounded-lg bg-card p-6 text-card-foreground shadow-lg">
        <h1 className="mb-6 text-2xl font-bold">Legal</h1>
        <div className="space-y-4 text-card-foreground/80">
          <p>This tool is not affiliated with, endorsed by, or connected to SlinDev or GRAB VR in any way.</p>
          <p>This tool uses the publicly available GRAB VR API to fetch level data. We do not host, store, or redistribute any level data.</p>
          <p className="font-semibold text-destructive">
            Do not use this tool to steal other people's maps. Only download levels you have permission to use.
          </p>
          <p>We are not responsible for how downloaded levels are used. By using this tool, you agree to use it responsibly and ethically.</p>
          <p>All GRAB VR content and trademarks belong to their respective owners.</p>
        </div>
      </div>
    </div>
  </Layout>
);

export default Legal;
