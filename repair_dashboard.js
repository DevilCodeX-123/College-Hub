import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'src/pages/AdminDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const startMarker = 'function CollegePollsList({ college }: { college: string }) {';
const startIndex = content.indexOf(startMarker);

if (startIndex === -1) {
    console.error('Could not find CollegePollsList function');
    process.exit(1);
}

const correctFunction = `function CollegePollsList({ college }: { college: string }) {
    const { user } = useAuth();
    const { data: polls = [], isLoading } = useQuery<any[]>({
        queryKey: ["college-polls", college],
        queryFn: () => api.getPolls(user?.id, user?.role, user?.email, undefined, college)
    });

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-4">
            {polls.length === 0 ? (
                <div className="text-center py-8 opacity-50">
                    <Target className="h-12 w-12 mx-auto mb-4" />
                    <p>No active college polls.</p>
                </div>
            ) : (
                polls.map((p: any) => (
                    <Card key={p._id} className="p-4">
                        <p className="font-bold mb-3">{p.question}</p>
                        <div className="space-y-2">
                            {p.options.map((o: any, i: number) => (
                                <div key={i} className="flex justify-between text-sm py-2 px-3 bg-secondary/20 rounded-lg">
                                    <span>{o.text}</span>
                                    <span className="font-semibold">{o.votes} votes</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                ))
            )}
        </div>
    );
}`;

// Keep everything before the function, and append the correct function
const newContent = content.substring(0, startIndex) + correctFunction;

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Successfully repaired AdminDashboard.tsx');
