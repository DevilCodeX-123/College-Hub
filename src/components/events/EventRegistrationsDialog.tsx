
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileSpreadsheet, Users } from "lucide-react";

interface EventRegistrationsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    event: any;
}

export function EventRegistrationsDialog({ open, onOpenChange, event }: EventRegistrationsDialogProps) {
    if (!event) return null;

    const registrations = event.registrations || [];

    const handleDownloadCSV = () => {
        if (!registrations.length) return;

        const headers = ["Name", "Email", "Program/Activity", "Comments", "Date"];
        const csvContent = [
            headers.join(","),
            ...registrations.map((r: any) => [
                r.name,
                r.email,
                r.program || "General",
                `"${(r.comments || "").replace(/"/g, '""')}"`, // Escape quotes
                new Date(r.registeredAt).toLocaleDateString()
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${event.title}_registrations.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <div className="flex justify-between items-center pr-8">
                        <div>
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <Users className="h-5 w-5 text-primary" />
                                {event.title} - Registrations
                            </DialogTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                Total Registered: {registrations.length}
                            </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleDownloadCSV} disabled={registrations.length === 0}>
                            <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                            Export CSV
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-auto space-y-6 mt-4">
                    {/* Individual Registrations Section */}
                    <div className="border rounded-lg overflow-hidden border-blue-100">
                        <div className="bg-blue-50 px-4 py-2 flex items-center justify-between">
                            <h3 className="font-bold text-blue-900 flex items-center gap-2">
                                👤 Individual Registrations
                            </h3>
                            <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                                {registrations.filter((r: any) => !r.teamMembers || r.teamMembers.length === 0).length}
                            </span>
                        </div>
                        <Table>
                            <TableHeader className="bg-blue-50/50">
                                <TableRow>
                                    <TableHead className="w-[150px]">Name</TableHead>
                                    <TableHead className="w-[180px]">Email</TableHead>
                                    <TableHead className="w-[100px]">Program</TableHead>
                                    <TableHead className="w-[120px]">Transaction ID</TableHead>
                                    <TableHead className="w-[100px]">Payment Proof</TableHead>
                                    <TableHead className="w-[80px] text-right">Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {registrations.filter((r: any) => !r.teamMembers || r.teamMembers.length === 0).length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-4 text-muted-foreground italic text-sm">
                                            No individual registrations.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    registrations.filter((r: any) => !r.teamMembers || r.teamMembers.length === 0).map((reg: any, idx: number) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-medium text-sm">{reg.name}</TableCell>
                                            <TableCell className="text-xs">{reg.email}</TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800">
                                                    {reg.program || "General"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-xs font-mono">{reg.transactionId || "-"}</TableCell>
                                            <TableCell>
                                                {reg.paymentProofUrl ? (
                                                    <a href={reg.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">View</a>
                                                ) : "-"}
                                            </TableCell>
                                            <TableCell className="text-right text-[10px] text-muted-foreground">
                                                {new Date(reg.registeredAt).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Team Registrations Section */}
                    <div className="border rounded-lg overflow-hidden border-purple-100">
                        <div className="bg-purple-50 px-4 py-2 flex items-center justify-between">
                            <h3 className="font-bold text-purple-900 flex items-center gap-2">
                                👥 Team Registrations
                            </h3>
                            <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-1 rounded-full">
                                {registrations.filter((r: any) => r.teamMembers && r.teamMembers.length > 0).length}
                            </span>
                        </div>
                        <Table>
                            <TableHeader className="bg-purple-50/50">
                                <TableRow>
                                    <TableHead className="w-[120px]">Team Lead</TableHead>
                                    <TableHead className="w-[150px]">Lead Email</TableHead>
                                    <TableHead className="w-[180px]">Team Members</TableHead>
                                    <TableHead className="w-[120px]">Transaction ID</TableHead>
                                    <TableHead className="w-[100px]">Payment Proof</TableHead>
                                    <TableHead className="w-[80px] text-right">Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {registrations.filter((r: any) => r.teamMembers && r.teamMembers.length > 0).length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-4 text-muted-foreground italic text-sm">
                                            No team registrations.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    registrations.filter((r: any) => r.teamMembers && r.teamMembers.length > 0).map((reg: any, idx: number) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-medium text-sm">{reg.name}</TableCell>
                                            <TableCell className="text-xs">{reg.email}</TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    {reg.teamMembers.map((tm: any, tmidx: number) => (
                                                        <div key={tmidx} className="text-[10px] bg-purple-50 px-1.5 py-0.5 rounded">
                                                            {tm.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs font-mono">{reg.transactionId || "-"}</TableCell>
                                            <TableCell>
                                                {reg.paymentProofUrl ? (
                                                    <a href={reg.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-purple-600 underline">View</a>
                                                ) : "-"}
                                            </TableCell>
                                            <TableCell className="text-right text-[10px] text-muted-foreground">
                                                {new Date(reg.registeredAt).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
