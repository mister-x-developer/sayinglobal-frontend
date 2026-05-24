'use client';

/**
 * Admin Plans Management — full CRUD.
 * No unlimited plans. Every plan has monthly + active limits.
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Archive, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { toast } from '@/components/ui/Toast';
import { plansApi, type Plan } from '@/lib/api/plans';
import { formatPrice } from '@/lib/utils/format';

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<Plan>>({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await plansApi.adminList();
      setPlans(data);
    } catch {
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({
      name: '', name_uz: '', name_ru: '', name_en: '',
      monthly_listing_limit: 5, active_listing_limit: 3,
      price_uzs: 0, price_usd: 0, duration_days: 30,
      order: plans.length + 1, is_default: false, status: 'active',
    });
    setCreating(true);
    setEditing(null);
  };

  const openEdit = (plan: Plan) => {
    setForm({ ...plan });
    setEditing(plan);
    setCreating(false);
  };

  const save = async () => {
    if (!form.name || !form.monthly_listing_limit || !form.active_listing_limit) {
      toast.error('Name and limits are required');
      return;
    }
    if ((form.monthly_listing_limit ?? 0) < 1 || (form.active_listing_limit ?? 0) < 1) {
      toast.error('No unlimited plans — limits must be ≥ 1');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await plansApi.adminUpdate(editing.id, form);
        toast.success('Plan updated');
      } else {
        await plansApi.adminCreate(form);
        toast.success('Plan created');
      }
      setEditing(null);
      setCreating(false);
      await load();
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const archive = async (plan: Plan) => {
    if (!confirm(`Archive plan "${plan.name}"?`)) return;
    try {
      await plansApi.adminArchive(plan.id);
      toast.success('Plan archived');
      await load();
    } catch {
      toast.error('Archive failed');
    }
  };

  return (
    <AdminLayout>
      <div className="container-page py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-eyebrow">Admin</p>
            <h1 className="display-md mt-1">Tariflar boshqaruvi</h1>
            <p className="mt-1 text-sm text-fg-muted">
              Har bir tarif oylik va faol e'lon limitiga ega. Limitsiz tariflar yo'q.
            </p>
          </div>
          <button onClick={openCreate} className="btn btn-primary btn-sm">
            <Plus className="h-4 w-4" strokeWidth={2.25} />
            Yangi tarif
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="surface-elevated p-6"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-lg font-bold text-fg">{plan.name}</h3>
                      {plan.is_default && (
                        <span className="rounded-full bg-brand-primary/10 px-2 py-0.5 text-[10px] font-bold text-brand-primary uppercase">
                          Default
                        </span>
                      )}
                      {plan.status === 'archived' && (
                        <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-bold text-danger uppercase">
                          Archived
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-fg-muted">{plan.description_uz || plan.description}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-bg-subtle p-3 text-center">
                    <p className="font-display text-2xl font-bold text-brand-primary">
                      {plan.monthly_listing_limit}
                    </p>
                    <p className="text-[11px] text-fg-subtle">Oylik limit</p>
                  </div>
                  <div className="rounded-xl bg-bg-subtle p-3 text-center">
                    <p className="font-display text-2xl font-bold text-info">
                      {plan.active_listing_limit}
                    </p>
                    <p className="text-[11px] text-fg-subtle">Faol limit</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="font-bold text-fg">
                    {plan.price_uzs > 0 ? formatPrice(plan.price_uzs, 'UZS') : 'Bepul'}
                  </span>
                  <span className="text-fg-subtle">{plan.duration_days} kun</span>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => openEdit(plan)}
                    className="btn btn-secondary btn-sm flex-1"
                  >
                    <Edit className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Tahrirlash
                  </button>
                  {plan.status === 'active' && (
                    <button
                      onClick={() => archive(plan)}
                      className="btn btn-secondary btn-sm"
                    >
                      <Archive className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Create/Edit form */}
        {(creating || editing) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="surface-elevated w-full max-w-lg p-6">
              <h2 className="display-sm mb-4">
                {editing ? 'Tarifni tahrirlash' : 'Yangi tarif'}
              </h2>
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-fg-subtle">Nomi (UZ)</label>
                    <input
                      value={form.name_uz || ''}
                      onChange={(e) => setForm((p) => ({ ...p, name_uz: e.target.value, name: e.target.value }))}
                      className="input-base mt-1 w-full"
                      placeholder="Boshlang'ich"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-fg-subtle">Nomi (RU)</label>
                    <input
                      value={form.name_ru || ''}
                      onChange={(e) => setForm((p) => ({ ...p, name_ru: e.target.value }))}
                      className="input-base mt-1 w-full"
                      placeholder="Начальный"
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-fg-subtle">
                      Oylik limit <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={form.monthly_listing_limit || ''}
                      onChange={(e) => setForm((p) => ({ ...p, monthly_listing_limit: Number(e.target.value) }))}
                      className="input-base mt-1 w-full"
                    />
                    <p className="mt-1 text-[11px] text-fg-subtle">Min: 1 (limitsiz tariflar yo'q)</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-fg-subtle">
                      Faol limit <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={form.active_listing_limit || ''}
                      onChange={(e) => setForm((p) => ({ ...p, active_listing_limit: Number(e.target.value) }))}
                      className="input-base mt-1 w-full"
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="text-xs font-semibold text-fg-subtle">Narx (UZS)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.price_uzs || 0}
                      onChange={(e) => setForm((p) => ({ ...p, price_uzs: Number(e.target.value) }))}
                      className="input-base mt-1 w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-fg-subtle">Narx (USD)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.price_usd || 0}
                      onChange={(e) => setForm((p) => ({ ...p, price_usd: Number(e.target.value) }))}
                      className="input-base mt-1 w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-fg-subtle">Davomiyligi (kun)</label>
                    <input
                      type="number"
                      min={1}
                      value={form.duration_days || 30}
                      onChange={(e) => setForm((p) => ({ ...p, duration_days: Number(e.target.value) }))}
                      className="input-base mt-1 w-full"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!form.is_default}
                    onChange={(e) => setForm((p) => ({ ...p, is_default: e.target.checked }))}
                    className="h-4 w-4 rounded border-border text-brand-primary"
                  />
                  Yangi foydalanuvchilar uchun standart tarif
                </label>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => { setEditing(null); setCreating(false); }}
                  className="btn btn-secondary flex-1"
                  disabled={saving}
                >
                  Bekor qilish
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="btn btn-primary flex-1"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Saqlash
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
