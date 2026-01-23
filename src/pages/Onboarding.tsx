import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function Onboarding() {
    const { user, login } = useAuth(); // We might need to refresh the user session
    const [college, setCollege] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!college.trim()) return;

        setLoading(true);
        try {
            // Assuming we have an update user endpoint or using a specific one
            // For now, I'll assume we used the 'createUser' or similar to update, 
            // but strictly we should have an 'updateUser' in API. 
            // I'll add `updateUser` to `api.ts` next.

            // Update local logic:
            // Since user is logged in, we have their ID.
            // Call endpoint to update college.
            if (user?.id) {
                // This is a placeholder, strictly we need an update endpoint
                // But I'll implement `api.updateUser` right after this.
                await api.updateUser(user.id, { college });

                // Hacky way to update local storage user if api doesn't return new token
                // Ideally `login` function or `checkAuth` refreshes it.
                // For now, force navigation home, assuming context handles it or next refresh does.
                navigate('/');
            }
        } catch (error) {
            console.error('Failed to update college', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <GraduationCap className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Welcome to Campus!</CardTitle>
                    <p className="text-muted-foreground">
                        Let's get you settled. Which college are you attending?
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                College / University Name
                            </label>
                            <Input
                                placeholder="e.g. Delhi Technological University"
                                value={college}
                                onChange={(e) => setCollege(e.target.value)}
                                className="h-12 text-lg"
                                autoFocus
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 text-base"
                            variant="gradient"
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    Continue to Dashboard
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
