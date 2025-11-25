"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { SERVICES } from "@/config/testnets";

interface Incident {
  timestamp: string;
  service: string;
  status: string;
  errorMessage: string | null;
}

interface RecentIncidentsProps {
  incidents: Incident[];
}

export function RecentIncidents({ incidents }: RecentIncidentsProps) {
  if (incidents.length === 0) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Recent Incidents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
            <AlertTriangle className="h-8 w-8 mb-2 text-emerald-500/50" />
            <p className="text-sm">No incidents in the last 24 hours</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Recent Incidents ({incidents.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-500">Time</TableHead>
              <TableHead className="text-zinc-500">Service</TableHead>
              <TableHead className="text-zinc-500">Status</TableHead>
              <TableHead className="text-zinc-500">Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {incidents.slice(0, 10).map((incident, i) => (
              <TableRow
                key={i}
                className="border-zinc-800 hover:bg-zinc-800/50"
              >
                <TableCell className="text-zinc-400 text-sm">
                  {new Date(incident.timestamp).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </TableCell>
                <TableCell className="text-zinc-300">
                  {SERVICES.find((s) => s.id === incident.service)?.name ||
                    incident.service}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="border-red-800 text-red-400 bg-red-500/10"
                  >
                    {incident.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-zinc-500 text-sm max-w-[200px] truncate">
                  {incident.errorMessage || "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
