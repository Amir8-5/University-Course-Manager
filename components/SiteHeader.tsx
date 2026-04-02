import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { auth } from "@clerk/nextjs/server";
import { UserButton, SignInButton } from "@clerk/nextjs";

const clerkAppearance = {
  variables: {
    colorPrimary: "#ff4747",
    colorBackground: "#ffffff",
    colorText: "#111111",
    colorTextSecondary: "#333333",
    colorInputBackground: "#ffffff",
    colorInputText: "#111111",
    borderRadius: "0px",
    fontFamily: "Arial, Helvetica, sans-serif",
    fontWeight: { bold: 900, normal: 800, medium: 800 },
  },
  elements: {
    card: "border-[3px] border-foreground shadow-[8px_8px_0px_0px_var(--foreground)] rounded-none",
    formButtonPrimary:
      "border-[3px] border-foreground bg-primary text-primary-foreground font-black uppercase rounded-none shadow-[4px_4px_0px_0px_var(--foreground)] hover:bg-accent hover:text-foreground hover:shadow-[6px_6px_0px_0px_var(--foreground)] transition-all",
    footerActionLink: "text-primary font-black uppercase hover:underline",
    socialButtonsBlockButton:
      "border-[3px] border-foreground font-black uppercase rounded-none shadow-[4px_4px_0px_0px_var(--foreground)] hover:bg-accent transition-all",
    dividerLine: "border-foreground border-[1px]",
    input:
      "border-[3px] border-foreground rounded-none font-bold shadow-none focus:border-primary focus:shadow-[4px_4px_0px_0px_var(--primary)]",
    avatarBox: "border-[3px] border-foreground shadow-[3px_3px_0px_0px_var(--foreground)] rounded-none",
    userButtonPopoverCard:
      "border-[3px] border-foreground shadow-[8px_8px_0px_0px_var(--foreground)] rounded-none",
    userButtonPopoverActions: "border-t-[3px] border-foreground pt-2",
    userButtonPopoverActionButton:
      "font-black uppercase hover:bg-accent rounded-none",
    userButtonPopoverActionButtonText: "font-black uppercase",
    userPreviewMainIdentifier: "font-black uppercase",
    userPreviewSecondaryIdentifier: "font-bold text-muted-foreground",
    badge: "bg-primary text-primary-foreground font-black uppercase rounded-none border-[2px] border-foreground",
  },
};

export async function SiteHeader() {
  const { userId } = await auth();
  return (
    <header className="border-b-[3px] border-foreground bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="text-xl font-black uppercase tracking-tight text-foreground hover:text-primary transition-colors"
        >
          Course Manager
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {userId ? (
            <UserButton appearance={clerkAppearance} />
          ) : (
            <SignInButton mode="modal">
              <button className="border-[3px] border-foreground bg-primary px-4 py-1.5 text-sm font-black uppercase text-primary-foreground shadow-[4px_4px_0px_0px_var(--foreground)] transition-all hover:bg-accent hover:text-foreground hover:shadow-[6px_6px_0px_0px_var(--foreground)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">
                Sign In
              </button>
            </SignInButton>
          )}
        </div>
      </div>
    </header>
  );
}
