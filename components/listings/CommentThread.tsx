'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronUp, CornerDownRight, Flag, ShieldCheck } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { TranslateButton } from '@/components/shared/TranslateButton';
import { formatRelativeTime } from '@/lib/utils/format';

export interface Comment {
  public_id: number | string; // string for local optimistic comments
  user: { public_id: number | string; full_name: string; avatar_url?: string; is_seller?: boolean };
  content: string;
  created_at: string;
  is_edited?: boolean;
  replies?: Comment[];
}

interface CommentItemProps {
  comment: Comment;
  depth?: number;
  sellerId?: number | string;
  onReply?: (parentId: number | string, content: string) => Promise<void>;
}

export function CommentItem({ comment, depth = 0, sellerId, onReply }: CommentItemProps) {
  const t = useTranslations();
  const [repliesOpen, setRepliesOpen] = useState(depth === 0 && (comment.replies?.length ?? 0) > 0);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);

  const isSeller = comment.user.public_id === sellerId;
  const hasReplies = (comment.replies?.length ?? 0) > 0;

  const handleReply = async () => {
    if (!replyText.trim() || !onReply) return;
    setSubmitting(true);
    try {
      await onReply(comment.public_id, replyText.trim());
      setReplyText('');
      setReplyOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={depth > 0 ? 'ml-8 border-l-2 border-border pl-4' : ''}>
      <div className="group flex gap-3 py-3">
        <Link href={`/sellers/${comment.user.public_id}`} className="flex-shrink-0">
          <Avatar src={comment.user.avatar_url} name={comment.user.full_name} size="sm" />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/sellers/${comment.user.public_id}`}
              className="text-sm font-semibold text-fg hover:underline"
            >
              {comment.user.full_name}
            </Link>
            {isSeller && (
              <Badge variant="primary" size="sm">
                <ShieldCheck className="h-3 w-3" strokeWidth={2.25} />
                {t('listings.seller')}
              </Badge>
            )}
            <span className="text-xs text-fg-subtle">{formatRelativeTime(comment.created_at)}</span>
            {comment.is_edited && (
              <span className="text-xs text-fg-subtle">· {t('comments.edited')}</span>
            )}
          </div>

          <p className="mt-1.5 text-sm leading-relaxed text-fg">{translatedContent ?? comment.content}</p>

          <div className="mt-2 flex items-center gap-3">
            <TranslateButton
              text={comment.content}
              onTranslated={setTranslatedContent}
              compact
            />
            {onReply && (
              <button
                type="button"
                onClick={() => setReplyOpen((v) => !v)}
                className="text-xs font-semibold text-fg-muted hover:text-brand-primary"
              >
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
            <button
              type="button"
              className="ml-auto hidden text-xs text-fg-subtle hover:text-danger group-hover:inline-flex items-center gap-1"
              aria-label={t('comments.report')}
            >
              <Flag className="h-3 w-3" strokeWidth={1.75} />
            </button>
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

      {/* Nested replies */}
      <AnimatePresence>
        {repliesOpen && hasReplies && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {comment.replies!.map((reply) => (
              <CommentItem
                key={reply.public_id}
                comment={reply}
                depth={depth + 1}
                sellerId={sellerId}
                onReply={onReply}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
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

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const { listingsApi } = await import('@/lib/api/listings');
      await listingsApi.createComment(listingId, text.trim());
      // Optimistic add
      const newComment: Comment = {
        public_id: `local-${Date.now()}` as any,
        user: { public_id: 0, full_name: 'Siz', avatar_url: '' },
        content: text.trim(),
        created_at: new Date().toISOString(),
        replies: [],
      };
      setComments((prev) => [newComment, ...prev]);
      setText('');
    } catch {
      // keep text
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentId: number | string, content: string) => {
    try {
      const { listingsApi } = await import('@/lib/api/listings');
      await listingsApi.createComment(listingId, content, String(parentId));
      const newReply: Comment = {
        public_id: `local-${Date.now()}` as any,
        user: { public_id: 0, full_name: 'Siz', avatar_url: '' },
        content,
        created_at: new Date().toISOString(),
      };
      setComments((prev) =>
        prev.map((c) =>
          c.public_id === parentId
            ? { ...c, replies: [...(c.replies ?? []), newReply] }
            : c
        )
      );
    } catch {}
  };

  return (
    <div>
      <h3 className="display-sm">
        {t('comments.title')}
        {comments.length > 0 && (
          <span className="ml-2 text-base font-normal text-fg-muted">({comments.length})</span>
        )}
      </h3>

      {/* New comment */}
      <div className="mt-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('comments.commentPlaceholder')}
          rows={3}
          className="input-base w-full resize-none py-3 text-sm"
        />
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!text.trim() || submitting}
            className="btn btn-primary btn-sm"
          >
            {t('comments.submit')}
          </button>
        </div>
      </div>

      {/* Comments list */}
      <div className="mt-6 divide-y divide-border">
        {comments.length === 0 ? (
          <p className="py-8 text-center text-sm text-fg-muted">{t('comments.noComments')}</p>
        ) : (
          comments.map((c) => (
            <CommentItem
              key={c.public_id}
              comment={c}
              sellerId={sellerId}
              onReply={handleReply}
            />
          ))
        )}
      </div>
    </div>
  );
}
