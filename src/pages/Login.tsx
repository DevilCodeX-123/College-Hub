import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Mail, Eye, EyeOff } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Proper Fix: Auto-correct common email typos
        let fixedEmail = email.trim().toLowerCase();
        if (fixedEmail.includes('@gamil.com')) fixedEmail = fixedEmail.replace('@gamil.com', '@gmail.com');
        if (fixedEmail.includes('@gmailcom')) fixedEmail = fixedEmail.replace('@gmailcom', '@gmail.com');
        if (fixedEmail.includes('@yahoocom')) fixedEmail = fixedEmail.replace('@yahoocom', '@yahoo.com');
        if (fixedEmail.includes('@outlookcom')) fixedEmail = fixedEmail.replace('@outlookcom', '@outlook.com');
        if (fixedEmail.includes('@hotmailcom')) fixedEmail = fixedEmail.replace('@hotmailcom', '@hotmail.com');

        // Final sanity check: if it ends with 'com' but missing the dot
        if (fixedEmail.endsWith('com') && !fixedEmail.endsWith('.com')) {
            fixedEmail = fixedEmail.replace(/com$/, '.com');
        }

        try {
            await login(fixedEmail, password);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to login');
            // If it failed and we fixed a typo, show the fixed email to help them notice
            if (fixedEmail !== email.trim().toLowerCase()) {
                setError(`Login failed. We tried fixing a typo to "${fixedEmail}" but it was still rejected.`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!forgotEmail) return;

        setForgotLoading(true);
        try {
            await api.forgotPassword(forgotEmail);
            toast.success('Temporary password sent to your email!');
            setForgotPasswordOpen(false);
            setForgotEmail('');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to send reset email');
        } finally {
            setForgotLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="flex-1 flex items-center justify-center w-full">
                <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-3xl font-bold text-center">Sign In</CardTitle>
                        <p className="text-center text-muted-foreground text-sm">
                            Welcome back to Campus Hub
                        </p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg text-center animate-shake">
                                    {error}
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold ml-1">Email</label>
                                <Input
                                    type="email"
                                    placeholder="name@college.edu"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold ml-1">Password</label>
                                <div className="relative group">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-11 transition-all focus:ring-2 focus:ring-primary/20 pr-10"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            <Button className="w-full h-11 text-base font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] mt-2 shadow-lg shadow-primary/20" type="submit" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Log In'}
                            </Button>
                            <div className="text-center text-sm pt-2 text-muted-foreground">
                                Don't have an account?{' '}
                                <Link to="/register" className="text-primary font-bold hover:underline transition-colors">
                                    Sign Up
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Forgot Password</DialogTitle>
                        <DialogDescription>
                            Enter your email and we'll send you a temporary password.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="email"
                                    placeholder="your@email.com"
                                    className="pl-10"
                                    value={forgotEmail}
                                    onChange={(e) => setForgotEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={forgotLoading} className="w-full">
                                {forgotLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Send Temporary Password'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <div className="py-6 text-center text-xs text-muted-foreground animate-fade-in uppercase tracking-wider font-medium">
                <p>Created by <a href="https://www.instagram.com/devil_kk_1?igsh=MTlucnpoZnJ1NHhoag==" target="_blank" rel="noreferrer" className="font-bold text-primary hover:underline transition-all underline-offset-2">DEVIL KK and Team</a></p>
                <p className="mt-2 opacity-70">Special thanks to <a href="https://www.linkedin.com/in/prakhar-khare12" target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline transition-all underline-offset-2">MR. PRAKHAR KHARE</a> and <a href="https://www.linkedin.com/in/omgupta6325?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline transition-all underline-offset-2">MR. OM GUPTA</a></p>
            </div>
        </div>
    );
}
