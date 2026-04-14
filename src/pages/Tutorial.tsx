import Layout from "@/components/Layout";

const Tutorial = () => (
  <Layout>
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="rounded-lg bg-card p-6 text-card-foreground shadow-lg">
        <h1 className="mb-6 text-2xl font-bold">How to Use</h1>
        <div className="space-y-6">
          <section>
            <h2 className="mb-2 text-lg font-semibold text-primary">Step 1: Find a Level</h2>
            <p className="text-card-foreground/80">
              Go to <a href="https://grabvr.quest/levels" target="_blank" rel="noopener noreferrer" className="text-primary underline">grabvr.quest/levels</a> and find the level you want to download. Copy the URL from your browser.
            </p>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-semibold text-primary">Step 2: Paste the URL</h2>
            <p className="text-card-foreground/80">
              Go to the Download page and paste the level URL or ID into the input field. You can use either the full URL or just the level ID (e.g., <code className="rounded bg-input/50 px-1.5 py-0.5 text-sm">user_id:iteration</code>).
            </p>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-semibold text-primary">Step 3: Download</h2>
            <p className="text-card-foreground/80">
              Click the search button or press Enter. The .level file will be downloaded automatically.
            </p>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-semibold text-primary">Multi Download</h2>
            <p className="text-card-foreground/80">
              Use the Multi Download tab to download multiple levels at once. Paste one URL per line and click "Parse Links" to download them all.
            </p>
          </section>
        </div>
      </div>
    </div>
  </Layout>
);

export default Tutorial;
