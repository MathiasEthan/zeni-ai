'use client'
import { Button } from "@/components/ui/button";
import { HeroHighlight, Highlight } from "@/components/ui/hero-highlight";
import { motion } from "motion/react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen">
      <HeroHighlight>
        <div className="text-center px-4">
          <motion.h1
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: [20, -5, 0],
            }}
            transition={{
              duration: 0.5,
              ease: [0.4, 0.0, 0.2, 1],
            }}
            className="text-2xl px-4 md:text-4xl lg:text-5xl font-bold text-neutral-700 dark:text-white max-w-4xl leading-relaxed lg:leading-snug text-center mx-auto"
          >
            Transform your documents with{" "}
            <Highlight className="text-black dark:text-white">
              Zeni AI
            </Highlight>
            {" "}intelligence
          </motion.h1>
          <motion.p
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.5,
              delay: 0.2,
              ease: [0.4, 0.0, 0.2, 1],
            }}
            className="text-lg text-neutral-600 dark:text-neutral-300 mt-6 max-w-2xl mx-auto"
          >
            Extract insights, generate knowledge graphs, and chat with your PDFs. 
            Unlock the power of AI-driven document analysis and understanding.
          </motion.p>
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.5,
              delay: 0.4,
              ease: [0.4, 0.0, 0.2, 1],
            }}
            className="flex flex-col sm:flex-row gap-4 justify-center mt-8"
          >
            <Link href="/pdf-extractor">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Extract from PDF
              </Button>
            </Link>
            <Link href="/knowledge-graph">
              <Button variant="outline" size="lg">
                Create Knowledge Graph
              </Button>
            </Link>
            <Link href="/chat">
              <Button variant="outline" size="lg">
                Chat with Documents
              </Button>
            </Link>
          </motion.div>
        </div>
      </HeroHighlight>
    </div>
  );
}
