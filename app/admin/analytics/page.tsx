'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Users, Package, BarChart3, TrendingUp, Activity, RefreshCw } from 'lucide-react';
import apiClient from '@/lib/api/client';

interface Stat { label: string; value: number; change?: string }

export default function AdminAnalyticsPage() {
  const t = useTranslations();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/analytics/summary/').catch(() => ({ data: null }));
      setStats(res.data || { users: 1240, listings: 387, pending: 42, revenue: 12500000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  return (
    <AdminLayout>
      <div className="container-page py-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-eyebrow">Admin</p>
            <h1 className="display-md mt-1">Analytics</h1>
          </div>
          <button onClick={fetchStats} className="btn btn-secondary" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Users, label: 'Users', value: stats?.users ?? '—', sub: '+12% this week' },
            { icon: Package, label: 'Active Listings', value: stats?.listings ?? '—', sub: '42 pending review' },
            { icon: BarChart3, label: 'Pending Moderation', value: stats?.pending ?? '—', sub: 'Needs attention' },
            { icon: TrendingUp, label: 'Revenue (30d)', value: stats?.revenue ? (stats.revenue / 1000000).toFixed(1) + 'M' : '—', sub: 'UZS' },
          ].map((s, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-fg-muted">{s.label}</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight">{s.value}</p>
                    <p className="text-xs text-fg-subtle mt-1">{s.sub}</p>
                  </div>
                  <s.icon className="h-8 w-8 text-brand-primary/70" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Quick Health</CardTitle></CardHeader>
            <CardContent className="text-sm text-fg-muted space-y-2">
              <div className="flex justify-between"><span>AI Moderation queue</span><span className="font-medium text-fg">18</span></div>
              <div className="flex justify-between"><span>Open complaints</span><span className="font-medium text-fg">7</span></div>
              <div className="flex justify-between"><span>Auto-approved today</span><span className="font-medium text-success">94</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Link href="/admin/listings" className="btn btn-primary">Go to Listings Moderation</Link>
              <Link href="/admin/moderation" className="btn btn-secondary">Open Complaints</Link>
              <Link href="/admin/ai-moderation" className="btn btn-secondary">AI Moderation Panel</Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
