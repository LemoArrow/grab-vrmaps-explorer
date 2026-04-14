import { Link } from "react-router-dom";
import { Download, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import grabLogo from "@/assets/grab-logo.png";

const Index = () => (
  <Layout>
    <div className="flex flex-col items-center justify-center px-4 py-16">
      <img
        src={grabLogo}
        alt="GRAB Level Grabber"
        className="mb-8 max-w-sm drop-shadow-xl"
        width={800}
        height={600}
      />
      <p className="mb-8 text-center text-lg text-foreground/80">
        Convert grabvr.quest level pages into downloadable .level files
      </p>
      <div className="flex gap-0 overflow-hidden rounded-lg shadow-lg">
        <Button asChild className="rounded-none rounded-l-lg bg-accent px-6 py-3 text-accent-foreground hover:bg-accent/90">
          <Link to="/download">
            <Download className="mr-2 h-4 w-4" />
            Single Download
          </Link>
        </Button>
        <Button asChild variant="secondary" className="rounded-none rounded-r-lg bg-secondary px-6 py-3 text-secondary-foreground hover:bg-secondary/80">
          <Link to="/download?tab=multi">
            <Layers className="mr-2 h-4 w-4" />
            Multi Download
          </Link>
        </Button>
      </div>
    </div>
  </Layout>
);

export default Index;
