import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Settings,
    Globe,
    Lock,
    Bell,
    Save,
    Zap,
    Megaphone,
    Send,
    Loader2
} from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface PlatformSettingsDialogProps {
    open: boolean;
    onClose: () => void;
}

export function PlatformSettingsDialog({ open, onClose }: PlatformSettingsDialogProps) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);

    // Config Settings
    const [settings, setSettings] = useState({
        appName: "Campus link",
        maintenanceMode: false,
        registrationEnabled: true,
        premiumFeatures: true
    });

    // Broadcast State
    const [broadcast, setBroadcast] = useState({
        title: "",
        message: "",
        type: "info",
        recipient: "all"
    });

    useEffect(() => {
        const saved = localStorage.getItem('platform_settings');
        if (saved) {
            setSettings(JSON.parse(saved));
        }
    }, [open]);

    const sendNotificationMutation = useMutation({
        mutationFn: (data: any) => api.sendNotification(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success("Broadcast Sent Successfully", {
                description: `Notification has been delivered to ${broadcast.recipient === 'all' ? 'everyone' : broadcast.recipient}.`
            });
            setBroadcast({ ...broadcast, title: "", message: "" });
        },
        onError: (error: any) => {
            toast.error("Failed to send broadcast", {
                description: error.response?.data?.message || "Something went wrong"
            });
        }
    });

    const handleSendBroadcast = () => {
        if (!broadcast.title.trim() || !broadcast.message.trim()) {
            toast.error("Required Fields Missing", {
                description: "Please provide both a title and message for the broadcast."
            });
            return;
        }

        if (!user) return;

        sendNotificationMutation.mutate({
            recipient: broadcast.recipient,
            title: broadcast.title,
            message: broadcast.message,
            senderId: user.id,
            type: broadcast.type
        });
    };

    const handleSaveConfig = async () => {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        localStorage.setItem('platform_settings', JSON.stringify(settings));
        setLoading(false);
        toast.success("Platform Configuration Saved");
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Settings className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">Platform Settings</DialogTitle>
                            <DialogDescription>
                                Master controls for the supreme authority.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid gap-8 py-4">
                    {/* Config Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                Configuration
                            </h3>
                            <div className="grid gap-2">
                                <Label htmlFor="appName">App Name</Label>
                                <Input
                                    id="appName"
                                    value={settings.appName}
                                    onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 rounded-xl border bg-card/30">
                                    <Label className="cursor-pointer">Maintenance</Label>
                                    <Switch
                                        checked={settings.maintenanceMode}
                                        onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                                    />
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-xl border bg-card/30">
                                    <Label className="cursor-pointer">Registrations</Label>
                                    <Switch
                                        checked={settings.registrationEnabled}
                                        onCheckedChange={(checked) => setSettings({ ...settings, registrationEnabled: checked })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Notifications / Broadcast Section */}
                        <div className="space-y-4 p-5 rounded-2xl bg-primary/5 border border-primary/10 relative overflow-hidden">
                            <h3 className="text-sm font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                                <Megaphone className="h-4 w-4" />
                                Global Broadcast
                            </h3>

                            <div className="space-y-3 relative z-10">
                                <Input
                                    placeholder="Broadcast Title"
                                    value={broadcast.title}
                                    onChange={(e) => setBroadcast({ ...broadcast, title: e.target.value })}
                                    className="bg-background/50 border-primary/20"
                                />
                                <Textarea
                                    placeholder="Announcement Message..."
                                    value={broadcast.message}
                                    onChange={(e) => setBroadcast({ ...broadcast, message: e.target.value })}
                                    className="bg-background/50 border-primary/20 resize-none min-h-[80px]"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <Select value={broadcast.type} onValueChange={(val) => setBroadcast({ ...broadcast, type: val })}>
                                        <SelectTrigger className="bg-background/50 border-primary/20">
                                            <SelectValue placeholder="Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="info">Info</SelectItem>
                                            <SelectItem value="alert">Alert</SelectItem>
                                            <SelectItem value="success">Success</SelectItem>
                                            <SelectItem value="warning">Warning</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={broadcast.recipient} onValueChange={(val) => setBroadcast({ ...broadcast, recipient: val })}>
                                        <SelectTrigger className="bg-background/50 border-primary/20">
                                            <SelectValue placeholder="Audience" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Everyone</SelectItem>
                                            <SelectItem value="students">Students</SelectItem>
                                            <SelectItem value="admins">Admins</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    className="w-full gap-2 shadow-lg"
                                    onClick={handleSendBroadcast}
                                    disabled={sendNotificationMutation.isPending}
                                >
                                    {sendNotificationMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                    Push Notification
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Premium Toggle */}
                    <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-600">
                                <Zap className="h-5 w-5" />
                            </div>
                            <div className="space-y-0.5">
                                <Label className="text-base font-semibold text-amber-700 dark:text-amber-400">Supreme Features</Label>
                                <p className="text-xs text-amber-600 dark:text-amber-500/80">
                                    Experimental features for all colleges.
                                </p>
                            </div>
                        </div>
                        <Switch
                            checked={settings.premiumFeatures}
                            onCheckedChange={(checked) => setSettings({ ...settings, premiumFeatures: checked })}
                        />
                    </div>
                </div>

                <DialogFooter className="pt-4 border-t">
                    <Button variant="ghost" onClick={onClose}>
                        Close
                    </Button>
                    <Button onClick={handleSaveConfig} disabled={loading} className="gap-2 px-8">
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Save Configuration
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
