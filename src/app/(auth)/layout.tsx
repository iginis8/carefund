import Link from "next/link";
import { Heart } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 text-lg font-bold tracking-tight"
      >
        <Heart className="size-6 text-primary fill-primary" />
        CareFund
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
