
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

                <div className="flex-1 overflow-auto border rounded-md mt-4">
                    <Table>
                        <TableHeader className="bg-muted/50 sticky top-0 z-10">
                            <TableRow>
                                <TableHead className="w-[200px]">Name</TableHead>
                                <TableHead className="w-[200px]">Email</TableHead>
                                <TableHead className="w-[150px]">Program</TableHead>
                                <TableHead className="w-[250px]">Comments</TableHead>
                                <TableHead className="w-[100px] text-right">Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {registrations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground italic">
                                        No registrations yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                registrations.map((reg: any, idx: number) => (
                                    <TableRow key={idx}>
                                        <TableCell className="font-medium">{reg.name}</TableCell>
                                        <TableCell>{reg.email}</TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {reg.program || "General"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm truncate max-w-[250px]" title={reg.comments}>
                                            {reg.comments || "-"}
                                        </TableCell>
                                        <TableCell className="text-right text-xs text-muted-foreground">
                                            {new Date(reg.registeredAt).toLocaleDateString()}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    );
}
