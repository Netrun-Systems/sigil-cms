import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * POSReports — Daily sales, per-artist commission, and settlement reports
 */
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BarChart3, Users, FileText, Loader2, Download, Calendar } from 'lucide-react';
import { Card, CardContent, cn } from '@netrun-cms/ui';
import { api } from '../../lib/api';
function formatDate(dateStr) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
    });
}
function getDefaultDateRange() {
    const now = new Date();
    const to = now.toISOString().split('T')[0];
    const from = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];
    return { from, to };
}
export function POSReports() {
    const { siteId } = useParams();
    const basePath = `/sites/${siteId}`;
    const [tab, setTab] = useState('daily');
    const [dateRange, setDateRange] = useState(getDefaultDateRange);
    const [loading, setLoading] = useState(false);
    const [dailyData, setDailyData] = useState([]);
    const [artistData, setArtistData] = useState([]);
    const [settlementData, setSettlementData] = useState([]);
    const loadReport = async () => {
        setLoading(true);
        try {
            if (tab === 'daily') {
                const res = await api.get(`${basePath}/pos/reports/daily?from=${dateRange.from}&to=${dateRange.to}`);
                setDailyData(res.data ?? []);
            }
            else if (tab === 'artist') {
                const res = await api.get(`${basePath}/pos/reports/artist?from=${dateRange.from}&to=${dateRange.to}`);
                setArtistData(res.data ?? []);
            }
            else {
                const res = await api.get(`${basePath}/pos/reports/settlement?from=${dateRange.from}&to=${dateRange.to}`);
                setSettlementData(res.data ?? []);
            }
        }
        catch {
            // empty state
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { loadReport(); }, [tab, dateRange.from, dateRange.to]);
    // CSV export
    const exportCSV = () => {
        let csvContent = '';
        if (tab === 'daily') {
            csvContent = 'Date,Sales,Refunds,Total Sales,Total Refunds,Tax,Card,Cash\n';
            dailyData.forEach((d) => {
                csvContent += `${d.sale_date},${d.sale_count},${d.refund_count},${d.total_sales},${d.total_refunds},${d.total_tax},${d.card_total},${d.cash_total}\n`;
            });
        }
        else if (tab === 'artist') {
            csvContent = 'Artist,Transactions,Items Sold,Total Sales,Commission,Store Share,Avg Rate\n';
            artistData.forEach((a) => {
                csvContent += `"${a.artist_name}",${a.transaction_count},${a.items_sold},${a.total_sales},${a.total_commission},${a.total_store_share},${Number(a.avg_commission_rate).toFixed(2)}\n`;
            });
        }
        else {
            csvContent = 'Artist,Items,Total Sales,Amount Owed,Store Share\n';
            settlementData.forEach((s) => {
                csvContent += `"${s.artist_name}",${s.item_count},${s.total_sales},${s.total_owed},${s.total_store_share}\n`;
            });
        }
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pos-${tab}-report-${dateRange.from}-to-${dateRange.to}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };
    const tabs = [
        { key: 'daily', label: 'Daily Sales', icon: BarChart3 },
        { key: 'artist', label: 'Artist Sales', icon: Users },
        { key: 'settlement', label: 'Settlement', icon: FileText },
    ];
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "POS Reports" }), _jsxs("button", { onClick: exportCSV, className: "flex h-9 items-center gap-2 rounded-md border border-input px-4 text-sm font-medium hover:bg-accent", children: [_jsx(Download, { className: "h-4 w-4" }), " Export CSV"] })] }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Calendar, { className: "h-4 w-4 text-muted-foreground" }), _jsx("span", { className: "text-sm text-muted-foreground", children: "Date Range:" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "date", value: dateRange.from, onChange: (e) => setDateRange((prev) => ({ ...prev, from: e.target.value })), className: "h-9 rounded-md border border-input bg-background px-3 text-sm" }), _jsx("span", { className: "flex items-center text-sm text-muted-foreground", children: "to" }), _jsx("input", { type: "date", value: dateRange.to, onChange: (e) => setDateRange((prev) => ({ ...prev, to: e.target.value })), className: "h-9 rounded-md border border-input bg-background px-3 text-sm" })] }), _jsx("div", { className: "ml-auto flex gap-1", children: tabs.map(({ key, label, icon: Icon }) => (_jsxs("button", { onClick: () => setTab(key), className: cn('flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors', tab === key
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'), children: [_jsx(Icon, { className: "h-3.5 w-3.5" }), label] }, key))) })] }) }) }), loading ? (_jsx("div", { className: "flex h-32 items-center justify-center", children: _jsx(Loader2, { className: "h-5 w-5 animate-spin text-muted-foreground" }) })) : tab === 'daily' ? (
            /* Daily Sales Table */
            dailyData.length === 0 ? (_jsx("div", { className: "flex h-32 items-center justify-center text-sm text-muted-foreground", children: "No sales data for this period" })) : (_jsx(Card, { children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-border", children: [_jsx("th", { className: "px-6 py-3 text-left text-sm font-medium text-muted-foreground", children: "Date" }), _jsx("th", { className: "px-6 py-3 text-right text-sm font-medium text-muted-foreground", children: "Sales" }), _jsx("th", { className: "px-6 py-3 text-right text-sm font-medium text-muted-foreground", children: "Total" }), _jsx("th", { className: "px-6 py-3 text-right text-sm font-medium text-muted-foreground", children: "Card" }), _jsx("th", { className: "px-6 py-3 text-right text-sm font-medium text-muted-foreground", children: "Cash" }), _jsx("th", { className: "px-6 py-3 text-right text-sm font-medium text-muted-foreground", children: "Tax" }), _jsx("th", { className: "px-6 py-3 text-right text-sm font-medium text-muted-foreground", children: "Refunds" })] }) }), _jsx("tbody", { children: dailyData.map((day) => (_jsxs("tr", { className: "border-b border-border last:border-0 hover:bg-accent/50", children: [_jsx("td", { className: "px-6 py-3 text-sm font-medium", children: formatDate(day.sale_date) }), _jsx("td", { className: "px-6 py-3 text-right text-sm", children: day.sale_count }), _jsxs("td", { className: "px-6 py-3 text-right text-sm font-medium", children: ["$", Number(day.total_sales).toFixed(2)] }), _jsxs("td", { className: "px-6 py-3 text-right text-sm", children: ["$", Number(day.card_total).toFixed(2)] }), _jsxs("td", { className: "px-6 py-3 text-right text-sm", children: ["$", Number(day.cash_total).toFixed(2)] }), _jsxs("td", { className: "px-6 py-3 text-right text-sm text-muted-foreground", children: ["$", Number(day.total_tax).toFixed(2)] }), _jsx("td", { className: "px-6 py-3 text-right text-sm text-red-600", children: Number(day.total_refunds) > 0 ? `-$${Number(day.total_refunds).toFixed(2)}` : '-' })] }, day.sale_date))) }), _jsx("tfoot", { children: _jsxs("tr", { className: "bg-muted/50 font-medium", children: [_jsx("td", { className: "px-6 py-3 text-sm", children: "Total" }), _jsx("td", { className: "px-6 py-3 text-right text-sm", children: dailyData.reduce((s, d) => s + d.sale_count, 0) }), _jsxs("td", { className: "px-6 py-3 text-right text-sm", children: ["$", dailyData.reduce((s, d) => s + Number(d.total_sales), 0).toFixed(2)] }), _jsxs("td", { className: "px-6 py-3 text-right text-sm", children: ["$", dailyData.reduce((s, d) => s + Number(d.card_total), 0).toFixed(2)] }), _jsxs("td", { className: "px-6 py-3 text-right text-sm", children: ["$", dailyData.reduce((s, d) => s + Number(d.cash_total), 0).toFixed(2)] }), _jsxs("td", { className: "px-6 py-3 text-right text-sm", children: ["$", dailyData.reduce((s, d) => s + Number(d.total_tax), 0).toFixed(2)] }), _jsxs("td", { className: "px-6 py-3 text-right text-sm text-red-600", children: ["-$", dailyData.reduce((s, d) => s + Number(d.total_refunds), 0).toFixed(2)] })] }) })] }) }) }))) : tab === 'artist' ? (
            /* Artist Sales Table */
            artistData.length === 0 ? (_jsx("div", { className: "flex h-32 items-center justify-center text-sm text-muted-foreground", children: "No artist sales data for this period" })) : (_jsx(Card, { children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-border", children: [_jsx("th", { className: "px-6 py-3 text-left text-sm font-medium text-muted-foreground", children: "Artist" }), _jsx("th", { className: "px-6 py-3 text-right text-sm font-medium text-muted-foreground", children: "Transactions" }), _jsx("th", { className: "px-6 py-3 text-right text-sm font-medium text-muted-foreground", children: "Items" }), _jsx("th", { className: "px-6 py-3 text-right text-sm font-medium text-muted-foreground", children: "Sales" }), _jsx("th", { className: "px-6 py-3 text-right text-sm font-medium text-muted-foreground", children: "Commission" }), _jsx("th", { className: "px-6 py-3 text-right text-sm font-medium text-muted-foreground", children: "Store Share" }), _jsx("th", { className: "px-6 py-3 text-right text-sm font-medium text-muted-foreground", children: "Rate" })] }) }), _jsx("tbody", { children: artistData.map((artist) => (_jsxs("tr", { className: "border-b border-border last:border-0 hover:bg-accent/50", children: [_jsx("td", { className: "px-6 py-3 text-sm font-medium", children: artist.artist_name }), _jsx("td", { className: "px-6 py-3 text-right text-sm", children: artist.transaction_count }), _jsx("td", { className: "px-6 py-3 text-right text-sm", children: artist.items_sold }), _jsxs("td", { className: "px-6 py-3 text-right text-sm font-medium", children: ["$", Number(artist.total_sales).toFixed(2)] }), _jsxs("td", { className: "px-6 py-3 text-right text-sm text-green-700 dark:text-green-400", children: ["$", Number(artist.total_commission).toFixed(2)] }), _jsxs("td", { className: "px-6 py-3 text-right text-sm", children: ["$", Number(artist.total_store_share).toFixed(2)] }), _jsxs("td", { className: "px-6 py-3 text-right text-sm text-muted-foreground", children: [(Number(artist.avg_commission_rate) * 100).toFixed(0), "%"] })] }, artist.artist_id))) }), _jsx("tfoot", { children: _jsxs("tr", { className: "bg-muted/50 font-medium", children: [_jsx("td", { className: "px-6 py-3 text-sm", children: "Total" }), _jsx("td", { className: "px-6 py-3 text-right text-sm", children: artistData.reduce((s, a) => s + a.transaction_count, 0) }), _jsx("td", { className: "px-6 py-3 text-right text-sm", children: artistData.reduce((s, a) => s + a.items_sold, 0) }), _jsxs("td", { className: "px-6 py-3 text-right text-sm", children: ["$", artistData.reduce((s, a) => s + Number(a.total_sales), 0).toFixed(2)] }), _jsxs("td", { className: "px-6 py-3 text-right text-sm text-green-700 dark:text-green-400", children: ["$", artistData.reduce((s, a) => s + Number(a.total_commission), 0).toFixed(2)] }), _jsxs("td", { className: "px-6 py-3 text-right text-sm", children: ["$", artistData.reduce((s, a) => s + Number(a.total_store_share), 0).toFixed(2)] }), _jsx("td", { className: "px-6 py-3 text-right text-sm", children: "-" })] }) })] }) }) }))) : (
            /* Settlement Report */
            settlementData.length === 0 ? (_jsx("div", { className: "flex h-32 items-center justify-center text-sm text-muted-foreground", children: "No settlement data for this period" })) : (_jsx("div", { className: "space-y-4", children: settlementData.map((artist) => (_jsx(Card, { children: _jsxs(CardContent, { className: "pt-6", children: [_jsxs("div", { className: "mb-4 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold", children: artist.artist_name }), _jsxs("p", { className: "text-sm text-muted-foreground", children: [artist.item_count, " items sold"] })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Amount Owed" }), _jsxs("p", { className: "text-xl font-bold text-green-700 dark:text-green-400", children: ["$", Number(artist.total_owed).toFixed(2)] })] })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-border", children: [_jsx("th", { className: "px-3 py-2 text-left font-medium text-muted-foreground", children: "Date" }), _jsx("th", { className: "px-3 py-2 text-left font-medium text-muted-foreground", children: "Receipt" }), _jsx("th", { className: "px-3 py-2 text-left font-medium text-muted-foreground", children: "Product" }), _jsx("th", { className: "px-3 py-2 text-right font-medium text-muted-foreground", children: "Qty" }), _jsx("th", { className: "px-3 py-2 text-right font-medium text-muted-foreground", children: "Amount" }), _jsx("th", { className: "px-3 py-2 text-right font-medium text-muted-foreground", children: "Commission" })] }) }), _jsx("tbody", { children: artist.line_items.map((item, i) => (_jsxs("tr", { className: "border-b border-border last:border-0", children: [_jsx("td", { className: "px-3 py-2 text-muted-foreground", children: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }), _jsx("td", { className: "px-3 py-2 font-mono text-xs", children: item.receipt }), _jsx("td", { className: "px-3 py-2", children: item.product }), _jsx("td", { className: "px-3 py-2 text-right", children: item.quantity }), _jsxs("td", { className: "px-3 py-2 text-right", children: ["$", Number(item.line_total).toFixed(2)] }), _jsxs("td", { className: "px-3 py-2 text-right text-green-700 dark:text-green-400", children: ["$", Number(item.commission_amount).toFixed(2)] })] }, i))) })] }) }), _jsx("div", { className: "mt-3 flex justify-between border-t border-border pt-3 text-sm", children: _jsxs("span", { className: "text-muted-foreground", children: ["Total Sales: $", Number(artist.total_sales).toFixed(2), " | Store Share: $", Number(artist.total_store_share).toFixed(2)] }) })] }) }, artist.artist_id))) })))] }));
}
export default POSReports;
//# sourceMappingURL=POSReports.js.map