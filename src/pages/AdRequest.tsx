import { Megaphone } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { AdRequestForm } from '@/components/common/AdRequestForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function AdRequest() {
    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <Megaphone className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Request Advertisement</h1>
                        <p className="text-muted-foreground">Submit a campaign for platform-wide or targeted display.</p>
                    </div>
                </div>

                <Card className="border-border/50 shadow-xl overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b">
                        <CardTitle>Campaign Details</CardTitle>
                        <CardDescription>Your request will be reviewed by the platform owner before going live.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <AdRequestForm />
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
