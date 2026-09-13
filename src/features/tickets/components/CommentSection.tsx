import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageSquare } from 'lucide-react';
import { Avatar, LoadingSkeleton } from '@/components/ui';
import { useComments, useAddComment } from '../hooks/useComments';
import { commentSchema, type CommentFormData } from '../validation/commentSchema';
import { formatSmartDateTime } from '@/utils/dateUtils';
import { ROLE_LABELS } from '@/constants/ui';

interface CommentSectionProps {
  ticketId: string;
  canComment: boolean;
}

export function CommentSection({ ticketId, canComment }: CommentSectionProps) {
  const { comments, isLoading } = useComments(ticketId);
  const addCommentMutation = useAddComment(ticketId);
  const bottomRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: { text: '' },
  });

  const textValue = watch('text');

  const onSubmit = async (data: CommentFormData) => {
    await addCommentMutation.mutateAsync(data.text);
    reset();
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="pb-8">
      {/* Section header */}
      <h2 className="text-sm font-semibold text-gray-300 border-t border-white/[0.06] pt-6 mb-3 flex items-center gap-1.5">
        <MessageSquare size={14} className="text-blue-400" />
        Comments
        {!isLoading && (
          <span className="font-normal text-gray-600 ml-0.5">({comments.length})</span>
        )}
      </h2>

      {/* Compose area — compact single-row input with inline send */}
      {canComment && (
        <div className="mb-3 space-y-1">
          <div className="flex items-start gap-2">
            <textarea
              {...register('text')}
              placeholder="Add a comment…"
              rows={1}
              disabled={addCommentMutation.isPending}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
              }}
              className="flex-1 bg-gray-900/60 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600
                         focus:outline-none focus:ring-1 focus:ring-blue-500
                         resize-none disabled:opacity-50 transition-colors overflow-hidden leading-5"
              style={{ minHeight: '34px' }}
            />
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={addCommentMutation.isPending || !textValue.trim()}
              className="shrink-0 flex items-center justify-center size-[34px] rounded-lg bg-blue-600 hover:bg-blue-700
                         disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Post comment"
            >
              <Send size={13} className="text-white" />
            </button>
          </div>
          {errors.text?.message && (
            <p className="text-xs text-red-400 pl-1">{errors.text.message}</p>
          )}
          <div className="flex justify-between px-1">
            <span className="text-[11px] text-gray-700">{textValue.length}/1000</span>
            {addCommentMutation.isPending && (
              <span className="text-[11px] text-gray-500">Posting…</span>
            )}
          </div>
        </div>
      )}

      {/* Comment list */}
      <div className="space-y-1.5">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-12 rounded-lg" />
          ))
        ) : comments.length === 0 ? (
          <div className="py-5 text-center text-xs text-gray-600 bg-gray-900/20 rounded-lg border border-white/[0.04]">
            No comments yet.
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className="flex gap-2 px-2 py-2 rounded-lg hover:bg-gray-900/40 transition-colors"
              >
                {/* xs avatar: 24 × 24 */}
                <Avatar name={comment.authorName} size="xs" className="shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  {/* Single-line header: name · role badge · timestamp */}
                  <div className="flex items-center gap-1.5 flex-wrap leading-none mb-0.5">
                    <span className="text-[10px] font-semibold text-gray-200">{comment.authorName}</span>
                    <span className="text-[7px] font-medium uppercase tracking-wider px-1 py-px rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {ROLE_LABELS[comment.authorRole] ?? comment.authorRole}
                    </span>
                    <span className="text-[11px] text-gray-600 ml-auto">
                      {formatSmartDateTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {comment.text}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
