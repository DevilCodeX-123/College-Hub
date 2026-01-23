import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CollegeAdminView } from './CollegeAdminView';
import { Building2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateCollegeDialog } from './CreateCollegeDialog';

export function CollegeManagementPanel() {
    const [selectedCollege, setSelectedCollege] = useState<string>('');
    const [isAddCollegeOpen, setIsAddCollegeOpen] = useState(false);

    // Fetch all data to get unique colleges
    const { data: users = [] } = useQuery<any[]>({
        queryKey: ['all-users'],
        queryFn: () => api.getUsers()
    });

    // Get unique colleges
    const colleges = Array.from(new Set((users as any[]).map((u: any) => u.college))).filter(Boolean) as string[];

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Button onClick={() => setIsAddCollegeOpen(true)}>
                    <Building2 className="mr-2 h-4 w-4" />
                    <Plus className="mr-1 h-3 w-3" />
                    Add New College
                </Button>
            </div>
            {/* College Selector */}
            <Card>
                <CardHeader>
                    <CardTitle>Select College to Manage</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label>College Name</Label>
                        <Select value={selectedCollege} onValueChange={setSelectedCollege}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a college..." />
                            </SelectTrigger>
                            <SelectContent>
                                {colleges.map((college: string) => (
                                    <SelectItem key={college} value={college}>
                                        {college}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {selectedCollege ? (
                <div className="border-t pt-6">
                    <CollegeAdminView collegeName={selectedCollege} />
                </div>
            ) : (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Building2 className="h-16 w-16 mx-auto mb-4 opacity-20" />
                        <p className="text-muted-foreground">Select a college to view its admin panel data</p>
                    </CardContent>
                </Card>
            )}

            <CreateCollegeDialog
                open={isAddCollegeOpen}
                onClose={() => setIsAddCollegeOpen(false)}
            />
        </div>
    );
}
