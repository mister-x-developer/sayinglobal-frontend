'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { ChevronDown, ChevronUp, CornerDownRight, Flag, ShieldCheck, LogIn, MessageSquare } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { TranslateButton } from '@/components/shared/TranslateButton';
import { ReportDialog } from '@/components/shared/ReportDialog';
import { toast } from '@/components/ui/Toast';
import { useAuthStore } from '@/lib/store/auth';
import { formatRelativeTime } from '@/lib/utils/format';

export interface Comment {
  id: number | string;
  user: { id: number | string; full_name: string; avatar_url?: string; is_seller?: boolean };
  content: string;
  created_at: string;
  is_edited?: boolean;
  replies?: Comment[];
  parent?: number | string;
}

interface CommentItemProps {
  comment: Comment;
  depth?: number;
  sellerId?: number | string;
  onReply?: (parentId: number | string, content: string) => Promise<void>;
}

export function CommentItem({ comment, depth = 0, sellerId, onReply }: CommentItemProps) {
  const t = useTranslations();
  const locale = useLocale();
  // Always show replies by default when they exist
  const [repliesOpen, setRepliesOpen] = useState(false); // collapsed by default
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  const { user } = useAuthStore();
  const isSeller = comment.user.id === sellerId;
  const hasReplies = (comment.replies?.length ?? 0) > 0;

  const handleReply = async () => {
    if (!replyText.trim() || !onReply) return;
    setSubmitting(true);
    try {
      await onReply(comment.id, replyText.trim());
      setReplyText('');
      setReplyOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={depth > 0 ? 'ml-8 border-l-2 border-border pl-4' : ''}>
      <div className="group flex gap-3 py-3">
        <Link href={user?.public_id == comment.user.id ? '/profile' : `/sellers/detail?id=${comment.user.id}`} className="flex-shrink-0">
          <Avatar src={comment.user.avatar_url} name={comment.user.full_name} size="sm" />
        </Link>

        <div className="min-w-0 flex-1">
          {/* Name row */}
          <div className="flex flex-wrap items-center gap-2">
            {isSeller && (
              <Badge variant="primary" size="sm">
                <ShieldCheck className="h-3 w-3" strokeWidth={2.25} />
                {t('listings.seller')}
              </Badge>
            )}
            <Link
              href={user?.public_id === comment.user.id ? '/profile' : `/sellers/detail?id=${comment.user.id}`}
              className="text-sm font-semibold text-fg hover:underline"
            >
              {comment.user.full_name}
            </Link>
            <span className="text-xs text-fg-subtle">{formatRelativeTime(comment.created_at, locale)}</span>
            {comment.is_edited && (
              <span className="text-xs text-fg-subtle">· {t('comments.edited')}</span>
            )}
          </div>

          {/* Content */}
          <p className="mt-1.5 text-sm leading-relaxed text-fg">
            {translatedContent ?? comment.content}
          </p>

          {/* Action row */}
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <TranslateButton
              text={comment.content}
              onTranslated={setTranslatedContent}
              compact
            />
            {onReply && !(user?.is_admin || user?.is_staff) && (
              <button
                type="button"
                onClick={() => setReplyOpen((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-fg-muted hover:text-brand-primary transition-colors"
              >
                <MessageSquare className="h-3 w-3" strokeWidth={2} />
                {t('comments.reply')}
              </button>
            )}
            {hasReplies && (
              <button
                type="button"
                onClick={() => setRepliesOpen((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline"
              >
                {repliesOpen ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" strokeWidth={2.25} />
                    {t('comments.hideReplies')}
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" strokeWidth={2.25} />
                    {t('comments.showReplies', { count: comment.replies!.length })}
                  </>
                )}
              </button>
            )}
            {/* Report button — always visible, not hidden */}
            {!(user?.is_admin || user?.is_staff) && (
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="ml-auto inline-flex items-center gap-1 text-xs text-fg-subtle hover:text-danger transition-colors"
              aria-label={t('comments.report')}
              title={t('comments.report')}
            >
              <Flag className="h-3 w-3" strokeWidth={1.75} />
              <span className="hidden sm:inline">{t('comments.report')}</span>
            </button>
            )}
          </div>

          {/* Reply input */}
          <AnimatePresence>
            {replyOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22 }}
                className="mt-3 overflow-hidden"
              >
                <div className="flex items-start gap-2">
                  <CornerDownRight className="mt-2.5 h-4 w-4 flex-shrink-0 text-fg-subtle" strokeWidth={1.75} />
                  <div className="flex-1">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={t('comments.replyPlaceholder')}
                      rows={2}
                      className="input-base w-full resize-none py-2.5 text-sm"
                    />
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => { setReplyOpen(false); setReplyText(''); }}
                        className="btn btn-ghost btn-sm"
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        type="button"
                        onClick={handleReply}
                        disabled={!replyText.trim() || submitting}
                        className="btn btn-primary btn-sm"
                      >
                        {t('comments.submit')}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Nested replies — shown by default */}
      <AnimatePresence initial={false}>
        {repliesOpen && hasReplies && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {comment.replies!.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                depth={depth + 1}
                sellerId={sellerId}
                onReply={onReply}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report dialog */}
      <ReportDialog
        open={reportOpen}
        target={{
          kind: 'comment',
          publicId: comment.id as number,
          fullName: comment.user.full_name,
        }}
        onClose={() => setReportOpen(false)}
      />
    </div>
  );
}

interface CommentSectionProps {
  listingId: number | string;
  sellerId?: number | string;
  initialComments?: Comment[];
}

export function CommentSection({ listingId, sellerId, initialComments = [] }: CommentSectionProps) {
  const t = useTranslations();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: number; full_name: string; avatar_url?: string; is_admin?: boolean; is_staff?: boolean } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('sayin-auth-store');
      if (raw) {
        const parsed = JSON.parse(raw);
        const auth = parsed?.state;
        setIsAuth(!!auth?.isAuthenticated);
        if (auth?.user) setCurrentUser(auth.user);
      }
    } catch {}
  }, []);

  // Sync when initialComments updates (parent re-fetches)
  useEffect(() => {
    if (initialComments.length > 0) {
      setComments(initialComments);
    }
  }, [initialComments]);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    const bodyText = text.trim();
    
    // Optimistic UI update
    const tempId = `local-${Date.now()}`;
    const newComment: Comment = {
      id: tempId,
      user: {
        id: currentUser?.id ?? 0,
        full_name: currentUser?.full_name ?? (t('common.you') ?? 'You'),
        avatar_url: currentUser?.avatar_url,
      },
      content: bodyText,
      created_at: new Date().toISOString(),
      replies: [],
    };
    
    setComments((prev) => [newComment, ...prev]);
    setText('');
    
    // Background API call
    try {
      const { listingsApi } = await import('@/lib/api/listings');
      const created = await listingsApi.createComment(listingId, bodyText);
      // Update with real backend data
      setComments((prev) => prev.map(c => c.id === tempId ? { ...c, id: created.id, created_at: created.created_at } : c));
    } catch {
      toast.error(t('errors.commentFailed') ?? 'Failed to post comment');
      // Rollback on failure
      setComments((prev) => prev.filter(c => c.id !== tempId));
      setText(bodyText);
    }
  };

  const handleReply = async (parentId: number | string, content: string) => {
    const bodyText = content.trim();
    if (!bodyText) return;

    // Optimistic UI update
    const tempId = `local-${Date.now()}`;
    const newReply: Comment = {
      id: tempId,
      user: {
        id: currentUser?.id ?? 0,
        full_name: currentUser?.full_name ?? (t('common.you') ?? 'You'),
        avatar_url: currentUser?.avatar_url,
      },
      content: bodyText,
      created_at: new Date().toISOString(),
    };
    
    setComments((prev) =>
      prev.map((c) =>
        c.id === parentId
          ? { ...c, replies: [...(c.replies ?? []), newReply] }
          : c
      )
    );
    
    // Background API call
    try {
      const { listingsApi } = await import('@/lib/api/listings');
      const created = await listingsApi.createComment(listingId, bodyText, String(parentId));
      const topLevelParentId = created?.parent ?? parentId;
      setComments((prev) =>
        prev.map((c) =>
          c.id === topLevelParentId
            ? { ...c, replies: c.replies?.map(r => r.id === tempId ? { ...r, id: created.id, created_at: created.created_at } : r) }
            : c
        )
      );
    } catch {
      toast.error(t('errors.replyFailed') ?? 'Failed to post reply');
      // Rollback on failure
      setComments((prev) =>
        prev.map((c) =>
          c.id === parentId
            ? { ...c, replies: c.replies?.filter(r => r.id !== tempId) }
            : c
        )
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div>
      <h3 className="display-sm">
        {t('comments.title')}
        {comments.length > 0 && (
          <span className="ml-2 text-base font-normal text-fg-muted">({comments.length})</span>
        )}
      </h3>

      {/* New comment input */}
      <div className="mt-4">
        {isAuth && !(currentUser?.is_admin || currentUser?.is_staff) ? (
          <>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('comments.commentPlaceholder')}
              rows={3}
              className="input-base w-full resize-none py-3 text-sm"
            />
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-fg-subtle">Ctrl+Enter — {t('common.send') ?? 'send'}</p>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!text.trim() || submitting}
                className="btn btn-primary btn-sm"
              >
                {submitting ? t('common.loading') : t('comments.submit')}
              </button>
            </div>
          </>
        ) : !isAuth ? (
          <div className="rounded-2xl border border-border bg-bg-subtle p-4 text-center">
            <p className="text-sm text-fg-muted mb-3">
              {t('comments.loginToComment') ?? 'Log in to leave a comment'}
            </p>
            <Link href="/auth" className="btn btn-primary btn-sm">
              <LogIn className="h-4 w-4" strokeWidth={2} />
              {t('auth.login')}
            </Link>
          </div>
        ) : null}
      </div>

      {/* Comments list */}
      <div className="mt-6 divide-y divide-border">
        {comments.length === 0 ? (
          <p className="py-8 text-center text-sm text-fg-muted">{t('comments.noComments')}</p>
        ) : (
          comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              sellerId={sellerId}
              onReply={isAuth ? handleReply : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}
