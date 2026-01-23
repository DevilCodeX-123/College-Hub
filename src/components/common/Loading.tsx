import React from "react";
import { Loader2 } from "lucide-react";

/**
 * Loading component that displays a centered spinner.
 * Used as a fallback for React Suspense during lazy loading of routes.
 */
const Loading = () => {
    return (
        <div className="flex items-center justify-center min-h-screen w-full bg-background/50">
            <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
            </div>
        </div>
    );
};

export default Loading;
