import { FileUpload } from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 space-y-8">
      <div className="w-full max-w-md">
        <FileUpload />
      </div> 
    </div>
  );
}
