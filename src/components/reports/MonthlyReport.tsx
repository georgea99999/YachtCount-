import { useState } from 'react';
import { Download, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UsageEntry } from '@/types/inventory';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface MonthlyReportProps {
  usageHistory?: UsageEntry[];
  availableMonths: string[];
  getMonthlyUsage: (month: string) => { itemName: string; box: string; quantity: number }[];
}

const MonthlyReport = ({ availableMonths, getMonthlyUsage, usageHistory = [] }: MonthlyReportProps) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  const usageData = selectedMonth ? getMonthlyUsage(selectedMonth) : [];
  const activity = usageHistory.filter(entry => {
    const date = new Date(entry.date);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` === selectedMonth;
  });

  const handleExport = () => {
    if (!selectedMonth || usageData.length === 0) {
      alert('Please select a month with data first');
      return;
    }

    const currentDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Monthly Usage Report - ${formatMonth(selectedMonth)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          h1 { color: #1a365d; margin-bottom: 5px; }
          .date { color: #666; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #5f8b9a; color: white; padding: 12px 8px; text-align: left; }
          td { padding: 10px 8px; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
          .action-btns {
            position: fixed;
            top: 20px;
            right: 20px;
            display: flex;
            gap: 10px;
            z-index: 1000;
          }
          .back-btn { 
            padding: 10px 20px; 
            background: #5f8b9a; 
            color: white; 
            border: none; 
            border-radius: 6px; 
            cursor: pointer;
            font-size: 14px;
          }
          .back-btn:hover { background: #4a7585; }
          @media print { 
            .action-btns { display: none; } 
          }
        </style>
      </head>
      <body>
        <div class="action-btns">
          <button class="back-btn" onclick="window.print()">🖨️ Print / Save PDF</button>
          <button class="back-btn" onclick="window.close()">✕ Close</button>
        </div>
        <h1>YachtCount - Monthly Usage Report</h1>
        <p class="date">${formatMonth(selectedMonth)} | Generated: ${currentDate}</p>
        <table>
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Box</th>
              <th style="text-align: right;">Units Used</th>
            </tr>
          </thead>
          <tbody>
            ${usageData.map(row => `
              <tr>
                <td>${row.itemName}</td>
                <td>${row.box}</td>
                <td style="text-align: right; font-weight: 600;">${row.quantity}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          <p>Total Products: ${usageData.length} | Total Units Used: ${usageData.reduce((sum, r) => sum + r.quantity, 0)}</p>
          <p>Professional Inventory Systems for Maritime Excellence.</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
  };

  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-accent" />
          Monthly Usage Report
        </h2>
      </div>

      {/* Month Selector */}
      <div className="flex items-center gap-2 p-4">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select a month..." />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            {availableMonths.length === 0 ? (
              <SelectItem value="none" disabled>No data available</SelectItem>
            ) : (
              availableMonths.map(month => (
                <SelectItem key={month} value={month}>
                  {formatMonth(month)}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={handleExport} disabled={!selectedMonth || usageData.length === 0}>
          <Download className="h-4 w-4 mr-1" />
          Export
        </Button>
      </div>

      {/* Report Content */}
      <div className="flex-1 overflow-auto px-4 pb-4">
        {!selectedMonth ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mb-3 opacity-50" />
            <p>Select a month to view usage data</p>
          </div>
        ) : usageData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mb-3 opacity-50" />
            <p>No products used in this month</p>
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary hover:bg-primary">
                  <TableHead className="text-primary-foreground font-semibold">Product Name</TableHead>
                  <TableHead className="text-primary-foreground font-semibold">Box</TableHead>
                  <TableHead className="text-primary-foreground font-semibold text-right">Units Used</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageData.map((row, index) => (
                  <TableRow key={index} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{row.itemName}</TableCell>
                    <TableCell className="text-muted-foreground">{row.box}</TableCell>
                    <TableCell className="text-right font-semibold">{row.quantity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {selectedMonth && activity.length > 0 && <section className="mt-6">
          <h3 className="mb-3 font-semibold">Crew activity</h3>
          <ul className="divide-y divide-border">
            {activity.map((entry,index) => <li key={`${entry.date}-${index}`} className="py-3 text-sm">
              <div className="flex items-start justify-between gap-3"><span className="font-medium break-words min-w-0">{entry.itemName}</span><span className="shrink-0 tabular-nums">{entry.quantity > 0 ? `−${entry.quantity}` : `+${Math.abs(entry.quantity)}`}</span></div>
              <p className="text-xs text-muted-foreground break-words">{entry.actorUsername ?? 'Earlier activity'} · {entry.box} · {new Date(entry.date).toLocaleString('en-GB')}</p>
            </li>)}
          </ul>
        </section>}
      </div>
    </div>
  );
};

export default MonthlyReport;
