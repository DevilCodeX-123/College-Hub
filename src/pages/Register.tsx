import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, GraduationCap, Eye, EyeOff } from 'lucide-react';
import { api } from '@/lib/api';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        college: '',
    });
    const [activeColleges, setActiveColleges] = useState<string[]>([]);
    const [fetchingColleges, setFetchingColleges] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchColleges = async () => {
            try {
                const colleges = await api.getActiveColleges();
                setActiveColleges(colleges);
            } catch (err) {
                console.error("Failed to fetch colleges", err);
            } finally {
                setFetchingColleges(false);
            }
        };
        fetchColleges();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.college) {
            setError('Please select your college');
            return;
        }

        setLoading(true);

        try {
            await api.register(formData);
            // Auto login after register
            await login(formData.email, formData.password);
            navigate('/');
        } catch (err: unknown) {
            const error = err as any;
            setError(error.response?.data?.message || 'Failed to register');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="flex-1 flex items-center justify-center w-full">
                <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-3xl font-bold text-center">Sign Up</CardTitle>
                        <p className="text-center text-muted-foreground text-sm">
                            Create your account to join Campus Hub
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
                                <label className="text-sm font-semibold ml-1">Full Name *</label>
                                <Input
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold ml-1">Email *</label>
                                <Input
                                    type="email"
                                    placeholder="name@college.edu"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold ml-1">College *</label>
                                {fetchingColleges ? (
                                    <div className="h-11 flex items-center justify-center border rounded-md bg-secondary/20">
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        <span className="text-xs text-muted-foreground">Loading colleges...</span>
                                    </div>
                                ) : activeColleges.length > 0 ? (
                                    <Select
                                        value={formData.college}
                                        onValueChange={(val) => setFormData({ ...formData, college: val })}
                                    >
                                        <SelectTrigger className="h-11">
                                            <SelectValue placeholder="Select your college" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {activeColleges.map((clg) => (
                                                <SelectItem key={clg} value={clg}>
                                                    {clg}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-600 flex items-start gap-2">
                                        <GraduationCap className="h-4 w-4 shrink-0" />
                                        <p>No colleges are currently open for registration. Please contact your college admin.</p>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold ml-1">Password *</label>
                                <div className="relative group">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                            <Button
                                className="w-full h-11 text-base font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] mt-2 shadow-lg shadow-primary/20"
                                type="submit"
                                disabled={loading || fetchingColleges || activeColleges.length === 0}
                            >
                                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Create Account'}
                            </Button>
                            <div className="text-center text-sm pt-2 text-muted-foreground">
                                Already have an account?{' '}
                                <Link to="/login" className="text-primary font-bold hover:underline transition-colors">
                                    Sign In
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
            <div className="py-6 text-center text-xs text-muted-foreground animate-fade-in uppercase tracking-wider font-medium">
                <p>Created by <a href="https://www.instagram.com/devil_kk_1?igsh=MTlucnpoZnJ1NHhoag==" target="_blank" rel="noreferrer" className="font-bold text-primary hover:underline transition-all underline-offset-2">DEVIL KK and Team</a></p>
                <p className="mt-2 opacity-70">Special thanks to <span className="font-semibold text-primary">MR. PRAKHAR KHARE</span> and <span className="font-semibold text-primary">MR. OM GUPTA</span></p>
            </div>
        </div>
    );
}
