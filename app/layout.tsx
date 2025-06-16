import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "InstaBids - Autonomous Agent Project Manager",
  description: "Real-time visualization of multi-agent system for project bidding",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CopilotKit runtimeUrl="/api/copilotkit">
          <CopilotSidebar
            defaultIsOpen={false}
            labels={{
              title: "InstaBids Assistant",
              initial: "Welcome! I can help you track project progress and understand agent activities.",
            }}
            clickOutsideToClose={true}
          >
            {children}
          </CopilotSidebar>
        </CopilotKit>
      </body>
    </html>
  );
}