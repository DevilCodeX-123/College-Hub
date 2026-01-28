import { Layout } from "@/components/layout/Layout";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Trophy,
    Target,
    Calendar,
    FolderKanban,
    Zap,
    Info,
    HelpCircle,
    Award,
    Star,
    Users,
    MessageSquare,
    AlertTriangle,
    Lightbulb,
    Send,
    User as UserIcon,
    ShieldAlert,
    Loader2
} from "lucide-react";

import { useQuery } from "@tanstack/react-query";

const iconMap: Record<string, any> = {
    Zap: <Zap className="h-5 w-5 text-amber-500" />,
    Target: <Target className="h-5 w-5 text-rose-500" />,
    Calendar: <Calendar className="h-5 w-5 text-blue-500" />,
    FolderKanban: <FolderKanban className="h-5 w-5 text-emerald-500" />,
    Trophy: <Trophy className="h-5 w-5 text-gold" />,
    HelpCircle: <HelpCircle className="h-5 w-5 text-primary" />,
};

export default function Help() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data: faqs = [], isLoading: isLoadingFAQs } = useQuery({
        queryKey: ['faqs'],
        queryFn: () => api.getFAQs(),
    });

    const [feedbackData, setFeedbackData] = useState({
        type: 'Suggestion',
        recipient: 'admin',
        againstName: '',
        againstDesignation: '',
        message: ''
    });

    const handleSubmitFeedback = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!feedbackData.message.trim()) {
            toast({ title: "Message is required", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            const title = `${feedbackData.type} from ${user?.name || 'User'}`;
            let fullMessage = feedbackData.message;
            if (feedbackData.type === 'Complaint' && feedbackData.againstName) {
                fullMessage = `Against: ${feedbackData.againstName} (${feedbackData.againstDesignation})\n\n${fullMessage}`;
            }

            await api.sendNotification({
                recipient: feedbackData.recipient === 'owner' ? 'owner' : 'admins',
                title,
                message: fullMessage,
                senderId: user?.id || user?._id,
                type: feedbackData.type === 'Complaint' ? 'alert' : 'info',
                category: 'feedback'
            });

            toast({
                title: "Submitted Successfully",
                description: `Your ${feedbackData.type.toLowerCase()} has been sent to the ${feedbackData.recipient}.`,
            });

            setFeedbackData({
                type: 'Suggestion',
                recipient: 'admin',
                againstName: '',
                againstDesignation: '',
                message: ''
            });
        } catch (err: any) {
            toast({
                title: "Submission Failed",
                description: err.message || "Something went wrong",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-12 animate-fade-in pb-12">
                {/* Header Section */}
                <div className="text-center space-y-4 pt-8">
                    <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-2">
                        <HelpCircle className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-4xl font-black bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                        Help & Support
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Need assistance? Send us your feedback or browse the FAQs below.
                    </p>
                </div>

                {/* Feedback Box - Top */}
                <Card className="border-0 shadow-2xl shadow-primary/10 ring-1 ring-primary/5 overflow-hidden">
                    <CardHeader className="bg-primary/5 pb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary text-primary-foreground rounded-lg shadow-lg shadow-primary/20">
                                <MessageSquare className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold">Feedback & Support Box</CardTitle>
                                <CardDescription>Submit your suggestions, complaints, or questions directly to the team.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmitFeedback} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">I want to submit a...</Label>
                                    <Select
                                        value={feedbackData.type}
                                        onValueChange={(val) => setFeedbackData({ ...feedbackData, type: val })}
                                    >
                                        <SelectTrigger className="h-11 bg-slate-50 border-0 ring-1 ring-slate-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Suggestion">
                                                <div className="flex items-center gap-2">
                                                    <Lightbulb className="h-4 w-4 text-amber-500" />
                                                    <span>Suggestion</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="Complaint">
                                                <div className="flex items-center gap-2">
                                                    <AlertTriangle className="h-4 w-4 text-rose-500" />
                                                    <span>Complaint</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="Feedback">
                                                <div className="flex items-center gap-2">
                                                    <MessageSquare className="h-4 w-4 text-blue-500" />
                                                    <span>General Feedback</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Send to</Label>
                                    <Select
                                        value={feedbackData.recipient}
                                        onValueChange={(val) => setFeedbackData({ ...feedbackData, recipient: val })}
                                    >
                                        <SelectTrigger className="h-11 bg-slate-50 border-0 ring-1 ring-slate-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">
                                                <div className="flex items-center gap-2">
                                                    <ShieldAlert className="h-4 w-4 text-slate-600" />
                                                    <span>Admin</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="owner">
                                                <div className="flex items-center gap-2">
                                                    <Zap className="h-4 w-4 text-amber-600" />
                                                    <span>Owner</span>
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {feedbackData.type === 'Complaint' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-rose-50/50 rounded-xl border border-rose-100 animate-in slide-in-from-top-2">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-rose-700">Complaint Against (Name)</Label>
                                        <div className="relative">
                                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-400" />
                                            <Input
                                                placeholder="Enter full name"
                                                value={feedbackData.againstName}
                                                onChange={(e) => setFeedbackData({ ...feedbackData, againstName: e.target.value })}
                                                className="pl-10 bg-white border-rose-200 focus:ring-rose-200"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-rose-700">Designation</Label>
                                        <Input
                                            placeholder="e.g. Club Lead, Student"
                                            value={feedbackData.againstDesignation}
                                            onChange={(e) => setFeedbackData({ ...feedbackData, againstDesignation: e.target.value })}
                                            className="bg-white border-rose-200 focus:ring-rose-200"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Message</Label>
                                <Textarea
                                    placeholder={feedbackData.type === 'Complaint' ? "Describe the issue in detail..." : "Tell us what's on your mind..."}
                                    className="min-h-[120px] bg-slate-50 border-0 ring-1 ring-slate-200 focus-visible:ring-primary"
                                    value={feedbackData.message}
                                    onChange={(e) => setFeedbackData({ ...feedbackData, message: e.target.value })}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 text-sm font-bold shadow-xl shadow-primary/20 hover:scale-[1.01] transition-transform"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                ) : (
                                    <Send className="h-4 w-4 mr-2" />
                                )}
                                {isSubmitting ? "Sending..." : `Send ${feedbackData.type} to ${feedbackData.recipient === 'admin' ? "Admin" : "Owner"}`}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-4 text-slate-400 font-bold tracking-[0.2em]">Frequent Questions</span>
                    </div>
                </div>

                {/* FAQ Sections */}
                <div className="grid gap-8">
                    {isLoadingFAQs ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        faqs.map((section: any, idx: number) => (
                            <Card key={idx} className="border-0 shadow-xl shadow-slate-200/50 overflow-hidden ring-1 ring-slate-100">
                                <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-background rounded-lg shadow-sm">
                                            {iconMap[section.icon] || <HelpCircle className="h-5 w-5 text-primary" />}
                                        </div>
                                        <CardTitle className="text-xl font-bold">{section.name}</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Accordion type="single" collapsible className="w-full">
                                        {section.items.map((item: any, itemIdx: number) => (
                                            <AccordionItem
                                                key={itemIdx}
                                                value={`item-${idx}-${itemIdx}`}
                                                className="border-b border-slate-100 last:border-0"
                                            >
                                                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-slate-50/50 transition-colors text-left font-semibold text-slate-700">
                                                    {item.question}
                                                </AccordionTrigger>
                                                <AccordionContent className="px-6 pb-4 text-muted-foreground leading-relaxed">
                                                    {item.answer}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Extra Info Card */}
                <Card className="bg-primary text-primary-foreground border-0 overflow-hidden relative">
                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 opacity-10">
                        <Star className="h-64 w-64" />
                    </div>
                    <CardContent className="p-8 flex flex-col md:flex-row items-center gap-6 relative z-10">
                        <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl">
                            <Award className="h-12 w-12" />
                        </div>
                        <div className="flex-1 space-y-2 text-center md:text-left">
                            <h3 className="text-2xl font-black">Join the Community</h3>
                            <p className="opacity-90 max-w-xl">
                                The hub is built for students, by students. Participate in events, lead projects, and climb the leaderboard to make your mark on campus legacy.
                            </p>
                        </div>
                        <div className="flex items-center gap-4 text-sm font-bold bg-white/10 px-4 py-2 rounded-full border border-white/20">
                            <Users className="h-4 w-4" />
                            1,200+ Active Members
                        </div>
                    </CardContent>
                </Card>

                {/* Footer info */}
                <div className="text-center pt-8 text-slate-400 text-sm italic">
                    <p>© 2026 Campus Community Hub. Designed for excellence.</p>
                </div>
            </div>
        </Layout>
    );
}
